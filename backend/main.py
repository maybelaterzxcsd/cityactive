from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional
import json
import os
from dotenv import load_dotenv
import requests
import uuid
import urllib3

from database import engine, get_db, Base
from models import EventDB, UserDB


# Отключаем предупреждения о SSL для запросов к GigaChat
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Создаём отсутствующие таблицы при запуске
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


# =========================================================
# GIGACHAT
# =========================================================

load_dotenv()
GIGACHAT_AUTH_KEY = os.getenv("GIGACHAT_AUTH_KEY", "").strip()
GIGACHAT_MODEL = "GigaChat-2"


# =========================================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# =========================================================

def load_participants(event: EventDB) -> list:
    """
    Читает список участников.

    Поддерживает старый формат:
    ["user1", "user2"]

    И новый:
    [
        {"user_id": "user1", "role": "participant"},
        {"user_id": "user2", "role": "volunteer"}
    ]
    """
    if not event.participants:
        return []

    try:
        data = json.loads(event.participants)

        if isinstance(data, list):
            return data

        return []
    except (json.JSONDecodeError, TypeError):
        return []


def participant_user_id(participant):
    """
    Возвращает user_id как для старого формата,
    так и для нового.
    """
    if isinstance(participant, dict):
        return str(participant.get("user_id", ""))

    return str(participant)


def is_user_joined(event: EventDB, user_id: str) -> bool:
    participants = load_participants(event)

    return any(
        participant_user_id(participant) == user_id
        for participant in participants
    )


def get_or_create_user(db: Session, user_id: str) -> UserDB:
    user = (
        db.query(UserDB)
        .filter(UserDB.user_id == user_id)
        .first()
    )

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

        if isinstance(badges, list):
            return badges

        return []
    except (json.JSONDecodeError, TypeError):
        return []


def count_user_events(db: Session, user_id: str) -> int:
    events = db.query(EventDB).all()

    return sum(
        1
        for event in events
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


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def read_root():
    return {
        "message": "CityActive Backend with GigaChat is running!"
    }


# =========================================================
# EVENTS
# =========================================================

@app.get("/api/events")
def get_events(
    max_price: Optional[int] = Query(default=None, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(EventDB)

    if max_price is not None:
        query = query.filter(EventDB.price <= max_price)

    events = query.all()

    return [
        event_to_dict(event)
        for event in events
    ]


@app.get("/api/events/{event_id}")
def get_event(
    event_id: str,
    db: Session = Depends(get_db),
):
    event = (
        db.query(EventDB)
        .filter(EventDB.id == event_id)
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found",
        )

    return event_to_dict(event)


# =========================================================
# JOIN EVENT
# =========================================================

@app.post("/api/events/{event_id}/join")
def join_event(
    event_id: str,
    data: dict,
    db: Session = Depends(get_db),
):
    event = (
        db.query(EventDB)
        .filter(EventDB.id == event_id)
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found",
        )

    user_id = str(data.get("user_id", "")).strip()
    role = str(data.get("role", "participant")).strip().lower()

    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="user_id обязателен",
        )

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
        raise HTTPException(
            status_code=409,
            detail="Мест нет",
        )

    user = get_or_create_user(
        db=db,
        user_id=user_id,
    )

    participants = load_participants(event)

    participants.append(
        {
            "user_id": user_id,
            "role": role,
        }
    )

    event.participants = json.dumps(
        participants,
        ensure_ascii=False,
    )

    event.participants_count += 1

    hours_earned = 0
    new_badge = None

    if role == "volunteer":
        event.volunteers_count = (
            event.volunteers_count or 0
        ) + 1

        hours_earned = 2
        user.volunteer_hours = (
            user.volunteer_hours or 0
        ) + hours_earned

        badges = load_badges(user)

        volunteer_badge = "🫶 Волонтёр"

        if volunteer_badge not in badges:
            badges.append(volunteer_badge)
            new_badge = volunteer_badge

        user.badges = json.dumps(
            badges,
            ensure_ascii=False,
        )

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


# =========================================================
# MY EVENTS
# =========================================================

@app.get("/api/my-events")
def get_my_events(
    user_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    events = db.query(EventDB).all()

    my_events = [
        event_to_dict(event)
        for event in events
        if is_user_joined(event, user_id)
    ]

    return my_events


# =========================================================
# PROFILE
# =========================================================

@app.get("/api/profile")
def get_profile(
    user_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    user = (
        db.query(UserDB)
        .filter(UserDB.user_id == user_id)
        .first()
    )

    if not user:
        return {
            "user_id": user_id,
            "volunteer_hours": 0,
            "badges": [],
            "events_count": count_user_events(
                db,
                user_id,
            ),
        }

    return {
        "user_id": user.user_id,
        "volunteer_hours": user.volunteer_hours or 0,
        "badges": load_badges(user),
        "events_count": count_user_events(
            db,
            user_id,
        ),
    }


# =========================================================
# AI / GIGACHAT
# =========================================================

@app.post("/api/ai/recommend")
def ai_recommend(
    data: dict,
    db: Session = Depends(get_db),
):
    user_query = str(
        data.get("query", "")
    ).strip()

    events = data.get("events", [])

    if not user_query:
        raise HTTPException(
            status_code=400,
            detail="Пустой запрос",
        )

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

    prompt = f"""
Ты — дружелюбный помощник приложения "ГородАктив".

Пользователь спрашивает:
"{user_query}"

Вот доступные события:
{events_context}

ОБЯЗАТЕЛЬНО выбери 2-3 наиболее подходящих события.

КРАЙНЕ ВАЖНО:
не пиши ID событий внутри самого текста ответа.
Описывай их только названиями.

В самом конце ответа СТРОГО напиши:
РЕКОМЕНДУЮ_ID: 1, 3, 5

Отвечай живо, с эмодзи, максимум 5-6 предложений.
""".strip()

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
                detail=(
                    "Не удалось получить токен GigaChat"
                ),
            )

        token_data = token_response.json()

        access_token = (
            token_data.get("tok")
            or token_data.get("access_token")
        )

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
                "Authorization": (
                    f"Bearer {access_token}"
                ),
            },
            json={
                "model": GIGACHAT_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "Ты — дружелюбный помощник."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
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
                detail=(
                    f"Ошибка GigaChat: "
                    f"{chat_response.status_code}"
                ),
            )

        answer = (
            chat_response
            .json()["choices"][0]["message"]["content"]
        )

        return {
            "answer": answer
        }

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


# =========================================================
# AI MODELS
# =========================================================

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

        access_token = (
            token_data.get("tok")
            or token_data.get("access_token")
        )

        if not access_token:
            raise HTTPException(
                status_code=502,
                detail="GigaChat не вернул access token",
            )

        models_response = requests.get(
            "https://api.giga.chat/v1/models",
            headers={
                "Accept": "application/json",
                "Authorization": (
                    f"Bearer {access_token}"
                ),
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


# =========================================================
# ICS
# =========================================================

@app.get("/api/events/{event_id}/ics")
def get_event_ics(
    event_id: str,
    db: Session = Depends(get_db),
):
    event = (
        db.query(EventDB)
        .filter(EventDB.id == event_id)
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found",
        )

    # Пока оставляем старую логику даты.
    # Исправим отдельным следующим шагом.
    ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CityActive//RU
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:{event.id}@cityactive.ru
DTSTAMP:20260929T120000Z
DTSTART:20261005T180000Z
DTEND:20261005T200000Z
SUMMARY:{event.title}
DESCRIPTION:{event.description.replace(chr(10), '\\n')}
LOCATION:{event.location}
END:VEVENT
END:VCALENDAR"""

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": (
                f"attachment; filename=event_{event_id}.ics"
            )
        },
    )