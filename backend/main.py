from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional
import json
import os
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
import requests
import uuid
import urllib3

from database import engine, get_db, Base
from models import EventDB, UserDB

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CityActive API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
GIGACHAT_AUTH_KEY = os.getenv("GIGACHAT_AUTH_KEY", "").strip()
GIGACHAT_MODEL = "GigaChat-2"


def load_participants(event: EventDB) -> list:
    if not event.participants:
        return []
    try:
        data = json.loads(event.participants)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def participant_user_id(participant):
    if isinstance(participant, dict):
        return str(participant.get("user_id", ""))
    return str(participant)


def is_user_joined(event: EventDB, user_id: str) -> bool:
    return any(
        participant_user_id(participant) == user_id
        for participant in load_participants(event)
    )


def get_or_create_user(db: Session, user_id: str) -> UserDB:
    user = db.query(UserDB).filter(UserDB.user_id == user_id).first()
    if user:
        return user

    user = UserDB(
        user_id=user_id,
        volunteer_hours=0,
        badges=json.dumps([], ensure_ascii=False),
    )
    db.add(user)
    db.flush()
    return user


def load_badges(user: UserDB) -> list:
    if not user.badges:
        return []
    try:
        badges = json.loads(user.badges)
        return badges if isinstance(badges, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def count_user_events(db: Session, user_id: str) -> int:
    return sum(
        1
        for event in db.query(EventDB).all()
        if is_user_joined(event, user_id)
    )


def event_to_dict(event: EventDB) -> dict:
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "date": event.date,
        "location": event.location,
        "price": event.price,
        "maxParticipants": event.max_participants,
        "participantsCount": event.participants_count,
        "volunteersCount": event.volunteers_count or 0,
        "organizer": event.organizer,
        "category": event.category,
        "categoryRu": event.category_ru,
        "ageRestriction": event.age_restriction,
        "needsVolunteers": event.needs_volunteers,
        "distance": event.distance,
        "image": event.image,
        "participants": load_participants(event),
    }


@app.get("/")
def read_root():
    return {"message": "CityActive Backend with GigaChat is running!"}


@app.get("/api/events")
def get_events(
    max_price: Optional[int] = Query(default=None, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(EventDB)
    if max_price is not None:
        query = query.filter(EventDB.price <= max_price)
    return [event_to_dict(event) for event in query.all()]


@app.get("/api/events/{event_id}")
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(EventDB).filter(EventDB.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event_to_dict(event)


@app.post("/api/events/{event_id}/join")
def join_event(event_id: str, data: dict, db: Session = Depends(get_db)):
    event = db.query(EventDB).filter(EventDB.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    user_id = str(data.get("user_id", "")).strip()
    role = str(data.get("role", "participant")).strip().lower()

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id обязателен")

    if role not in {"participant", "volunteer"}:
        raise HTTPException(
            status_code=400,
            detail="role должен быть participant или volunteer",
        )

    if role == "volunteer" and not event.needs_volunteers:
        raise HTTPException(
            status_code=400,
            detail="Для этого события волонтёры не требуются",
        )

    if is_user_joined(event, user_id):
        raise HTTPException(
            status_code=409,
            detail="Пользователь уже записан на это событие",
        )

    if event.participants_count >= event.max_participants:
        raise HTTPException(status_code=409, detail="Мест нет")

    user = get_or_create_user(db, user_id)

    participants = load_participants(event)
    participants.append({"user_id": user_id, "role": role})
    event.participants = json.dumps(participants, ensure_ascii=False)
    event.participants_count += 1

    hours_earned = 0
    new_badge = None

    if role == "volunteer":
        event.volunteers_count = (event.volunteers_count or 0) + 1
        hours_earned = 2
        user.volunteer_hours = (user.volunteer_hours or 0) + hours_earned

        badges = load_badges(user)
        volunteer_badge = "🫶 Волонтёр"
        if volunteer_badge not in badges:
            badges.append(volunteer_badge)
            new_badge = volunteer_badge

        user.badges = json.dumps(badges, ensure_ascii=False)

    db.commit()
    db.refresh(event)
    db.refresh(user)

    return {
        "message": "Успешно записались!",
        "new_count": event.participants_count,
        "volunteers_count": event.volunteers_count or 0,
        "hours_earned": hours_earned,
        "new_badge": new_badge,
    }


@app.get("/api/my-events")
def get_my_events(
    user_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    return [
        event_to_dict(event)
        for event in db.query(EventDB).all()
        if is_user_joined(event, user_id)
    ]


@app.get("/api/profile")
def get_profile(
    user_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    user = db.query(UserDB).filter(UserDB.user_id == user_id).first()

    if not user:
        return {
            "user_id": user_id,
            "volunteer_hours": 0,
            "badges": [],
            "events_count": count_user_events(db, user_id),
        }

    return {
        "user_id": user.user_id,
        "volunteer_hours": user.volunteer_hours or 0,
        "badges": load_badges(user),
        "events_count": count_user_events(db, user_id),
    }


@app.post("/api/ai/recommend")
def ai_recommend(data: dict, db: Session = Depends(get_db)):
    user_query = str(data.get("query", "")).strip()
    events = data.get("events", [])

    if not user_query:
        raise HTTPException(status_code=400, detail="Пустой запрос")

    if not GIGACHAT_AUTH_KEY:
        raise HTTPException(
            status_code=503,
            detail="GIGACHAT_AUTH_KEY не настроен на сервере",
        )

    events_context = "\n".join(
        [
            (
                f"ID: {event['id']}, "
                f"Название: {event['title']}, "
                f"Категория: {event['categoryRu']}, "
                f"Описание: {event['description'][:100]}..., "
                f"Цена: {event['price']} руб., "
                f"Место: {event['location']}"
            )
            for event in events[:15]
        ]
    )

    prompt = f'''
Ты — дружелюбный помощник приложения "ГородАктив".

Пользователь спрашивает:
"{user_query}"

Вот доступные события:
{events_context}

Твоя задача:
- выбери от 1 до 3 наиболее подходящих событий;
- выбирай события ТОЛЬКО из списка выше;
- НИКОГДА не придумывай новые ID;
- НИКОГДА не используй ID, которого нет в списке доступных событий;
- если доступно только 1 или 2 подходящих события, рекомендуй только их;
- внутри обычного текста ответа называй события только по названию, без ID.

В самом конце ответа ОБЯЗАТЕЛЬНО добавь отдельную строку
СТРОГО в таком формате:

РЕКОМЕНДУЮ_ID: <ID через запятую>

Используй именно латинские символы ID.
Не пиши "ИД".
Не добавляй после этой строки никаких комментариев.

Пример формата:
РЕКОМЕНДУЮ_ID: 1, 4

Отвечай живо, с эмодзи, максимум 5-6 предложений.
'''.strip()

    try:
        rq_uid = str(uuid.uuid4())

        token_response = requests.post(
            "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "RqUID": rq_uid,
                "Authorization": f"Basic {GIGACHAT_AUTH_KEY}",
            },
            data="scope=GIGACHAT_API_PERS",
            verify=False,
            timeout=30,
        )

        if not token_response.ok:
            raise HTTPException(
                status_code=502,
                detail="Не удалось получить токен GigaChat",
            )

        token_data = token_response.json()
        access_token = token_data.get("tok") or token_data.get("access_token")

        if not access_token:
            raise HTTPException(
                status_code=502,
                detail="GigaChat не вернул access token",
            )

        chat_response = requests.post(
            "https://api.giga.chat/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {access_token}",
            },
            json={
                "model": GIGACHAT_MODEL,
                "messages": [
                    {"role": "system", "content": "Ты — дружелюбный помощник."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.7,
                "max_tokens": 500,
            },
            verify=False,
            timeout=60,
        )

        if not chat_response.ok:
            raise HTTPException(
                status_code=502,
                detail=f"Ошибка GigaChat: {chat_response.status_code}",
            )

        answer = chat_response.json()["choices"][0]["message"]["content"]
        return {"answer": answer}

    except HTTPException:
        raise

    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail=f"Ошибка соединения с GigaChat: {error}",
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка GigaChat: {error}",
        )


@app.get("/api/ai/models")
def get_available_models():
    if not GIGACHAT_AUTH_KEY:
        raise HTTPException(
            status_code=503,
            detail="GIGACHAT_AUTH_KEY не настроен на сервере",
        )

    try:
        rq_uid = str(uuid.uuid4())

        token_response = requests.post(
            "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "RqUID": rq_uid,
                "Authorization": f"Basic {GIGACHAT_AUTH_KEY}",
            },
            data="scope=GIGACHAT_API_PERS",
            verify=False,
            timeout=30,
        )

        if not token_response.ok:
            raise HTTPException(
                status_code=502,
                detail="Не удалось получить токен GigaChat",
            )

        token_data = token_response.json()
        access_token = token_data.get("tok") or token_data.get("access_token")

        if not access_token:
            raise HTTPException(
                status_code=502,
                detail="GigaChat не вернул access token",
            )

        models_response = requests.get(
            "https://api.giga.chat/v1/models",
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {access_token}",
            },
            verify=False,
            timeout=30,
        )

        if not models_response.ok:
            raise HTTPException(
                status_code=502,
                detail="Не удалось получить список моделей",
            )

        return models_response.json()

    except HTTPException:
        raise

    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail=f"Ошибка соединения с GigaChat: {error}",
        )


MOSCOW_TZ = ZoneInfo("Europe/Moscow")

RUSSIAN_WEEKDAYS = {
    "понедельник": 0,
    "вторник": 1,
    "среда": 2,
    "четверг": 3,
    "пятница": 4,
    "суббота": 5,
    "воскресенье": 6,
}


def parse_event_datetime(date_text: str) -> datetime:
    if not date_text:
        raise ValueError("Дата события не указана")

    parts = [part.strip() for part in date_text.split(",", 1)]

    if len(parts) != 2:
        raise ValueError(f"Неизвестный формат даты: {date_text}")

    day_text = parts[0].lower()
    time_text = parts[1]

    try:
        event_time = datetime.strptime(time_text, "%H:%M").time()
    except ValueError as error:
        raise ValueError(
            f"Неизвестный формат времени: {time_text}"
        ) from error

    now = datetime.now(MOSCOW_TZ)
    today = now.date()

    if day_text == "сегодня":
        event_date = today

    elif day_text == "завтра":
        event_date = today + timedelta(days=1)

    elif day_text in RUSSIAN_WEEKDAYS:
        target_weekday = RUSSIAN_WEEKDAYS[day_text]
        days_ahead = (target_weekday - today.weekday()) % 7

        if days_ahead == 0:
            days_ahead = 7

        event_date = today + timedelta(days=days_ahead)

    else:
        raise ValueError(f"Неизвестный день: {parts[0]}")

    return datetime.combine(
        event_date,
        event_time,
        tzinfo=MOSCOW_TZ,
    )


def escape_ics_text(value: str) -> str:
    if value is None:
        return ""

    return (
        value
        .replace("\\", "\\\\")
        .replace("\n", "\\n")
        .replace(",", "\\,")
        .replace(";", "\\;")
    )


@app.get("/api/events/{event_id}/ics")
def get_event_ics(
    event_id: str,
    db: Session = Depends(get_db),
):
    event = db.query(EventDB).filter(EventDB.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    try:
        start_datetime = parse_event_datetime(event.date)
    except ValueError as error:
        raise HTTPException(
            status_code=500,
            detail=f"Не удалось разобрать дату события: {error}",
        )

    end_datetime = start_datetime + timedelta(hours=2)
    now_utc = datetime.now(timezone.utc)

    dtstamp = now_utc.strftime("%Y%m%dT%H%M%SZ")
    dtstart = start_datetime.strftime("%Y%m%dT%H%M%S")
    dtend = end_datetime.strftime("%Y%m%dT%H%M%S")

    summary = escape_ics_text(event.title)
    description = escape_ics_text(event.description)
    location = escape_ics_text(event.location)

    ics_content = (
        "BEGIN:VCALENDAR\r\n"
        "VERSION:2.0\r\n"
        "PRODID:-//CityActive//RU\r\n"
        "CALSCALE:GREGORIAN\r\n"
        "BEGIN:VEVENT\r\n"
        f"UID:{event.id}@cityactive.ru\r\n"
        f"DTSTAMP:{dtstamp}\r\n"
        f"DTSTART;TZID=Europe/Moscow:{dtstart}\r\n"
        f"DTEND;TZID=Europe/Moscow:{dtend}\r\n"
        f"SUMMARY:{summary}\r\n"
        f"DESCRIPTION:{description}\r\n"
        f"LOCATION:{location}\r\n"
        "END:VEVENT\r\n"
        "END:VCALENDAR\r\n"
    )

    return Response(
        content=ics_content,
        media_type="text/calendar; charset=utf-8",
        headers={
            "Content-Disposition": (
                f'attachment; filename="event_{event_id}.ics"'
            )
        },
    )
