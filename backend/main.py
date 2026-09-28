from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
import json
import requests
import uuid
import urllib3

from database import engine, get_db, Base
from models import EventDB

# Отключаем предупреждения о SSL (нужно для Сбера)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Создаём таблицы при запуске
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CityActive API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === НАСТРОЙКИ GIGACHAT ===
GIGACHAT_AUTH_KEY = "MDFhMGRkYTAtOGZjOC03MTBjLTk0OGQtODkzMWYwN2Y1NzU0Ojc5NjVkNWE0LTAyMDktNGFhOS04MTZiLTI4ZGRiN2UwN2I5MA=="
GIGACHAT_MODEL = "GigaChat-2"
# ==========================

class EventResponse:
    def __init__(self, event: EventDB):
        self.id = event.id
        self.title = event.title
        self.description = event.description
        self.date = event.date
        self.location = event.location
        self.price = event.price
        self.maxParticipants = event.max_participants
        self.participantsCount = event.participants_count
        self.organizer = event.organizer
        self.category = event.category
        self.categoryRu = event.category_ru
        self.ageRestriction = event.age_restriction
        self.needsVolunteers = event.needs_volunteers
        self.distance = event.distance
        self.image = event.image
        self.participants = json.loads(event.participants) if event.participants else []
        # Добавляем volunteers_count, если поле есть в модели
        self.volunteersCount = getattr(event, 'volunteers_count', 0) or 0

@app.get("/")
def read_root():
    return {"message": "CityActive Backend with GigaChat is running!"}

@app.get("/api/events")
def get_events(db: Session = Depends(get_db)):
    events = db.query(EventDB).all()
    return [EventResponse(e).__dict__ for e in events]

@app.get("/api/events/{event_id}")
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(EventDB).filter(EventDB.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return EventResponse(event).__dict__

# =========================================================
# ОБНОВЛЁННЫЙ ЭНДПОИНТ /join (принимает user_id и role)
# =========================================================
@app.post("/api/events/{event_id}/join")
def join_event(event_id: str, data: dict, db: Session = Depends(get_db)):
    event = db.query(EventDB).filter(EventDB.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event.participants_count >= event.max_participants:
        return {"error": "Мест нет"}
    
    # Получаем user_id и role из тела запроса (от фронтенда)
    user_id = data.get("user_id", "demo_user")
    role = data.get("role", "participant")  # "participant" или "volunteer"
    
    event.participants_count += 1
    
    # Если волонтёр — увеличиваем счётчик волонтёров
    if role == "volunteer":
        current_volunteers = getattr(event, 'volunteers_count', 0) or 0
        event.volunteers_count = current_volunteers + 1
        hours_earned = 2
        new_badge = "🫶 Волонтёр"  # Для демо всегда выдаём этот бейдж
    else:
        hours_earned = 0
        new_badge = None
    
    # Сохраняем участника с ролью
    participants = json.loads(event.participants) if event.participants else []
    participants.append({"user_id": user_id, "role": role})
    event.participants = json.dumps(participants)
    
    db.commit()
    db.refresh(event)
    
    print(f"✅ Запись: user_id={user_id}, role={role}. Теперь участников: {event.participants_count}")
    
    return {
        "message": "Успешно записались!",
        "new_count": event.participants_count,
        "hours_earned": hours_earned,
        "new_badge": new_badge
    }

@app.get("/api/my-events")
def get_my_events(db: Session = Depends(get_db)):
    user_id = "user1"
    events = db.query(EventDB).all()
    
    my_events = []
    for event in events:
        participants = json.loads(event.participants) if event.participants else []
        # Проверяем, есть ли user_id в списке участников
        if any(p.get("user_id") == user_id if isinstance(p, dict) else p == user_id for p in participants):
            my_events.append(EventResponse(event).__dict__)
    
    return my_events

# =========================================================
# ЭНДПОИНТ ДЛЯ ИИ (GIGACHAT)
# =========================================================
@app.post("/api/ai/recommend")
def ai_recommend(data: dict, db: Session = Depends(get_db)):
    user_query = data.get("query", "")
    events = data.get("events", [])
    
    if not user_query:
        return {"error": "Пустой запрос"}
    
    events_context = "\n".join([
        f"ID: {e['id']}, Название: {e['title']}, Категория: {e['categoryRu']}, "
        f"Описание: {e['description'][:100]}..., Цена: {e['price']} руб., Место: {e['location']}"
        for e in events[:15]
    ])
    
    prompt = f"""Ты — дружелюбный помощник приложения "ГородАктив".
Пользователь спрашивает: "{user_query}"

Вот доступные события:
{events_context}

ОБЯЗАТЕЛЬНО выбери 2-3 наиболее подходящих события. 
КРАЙНЕ ВАЖНО: НЕ пиши ID событий внутри самого текста ответа. Описывай их только названиями.

В самом конце ответа СТРОГО в таком формате (это критически важно):
РЕКОМЕНДУЮ_ID: 1, 3, 5

Пример правильного ответа:
"Отлично! Вот что я нашёл:
1. Аниме-сходка — бесплатно и весело!
2. Вечер настольных игр — классно для компании.
РЕКОМЕНДУЮ_ID: 1, 2"

Отвечай живо, с эмодзи, максимум 5-6 предложений."""

    try:
        auth_key = GIGACHAT_AUTH_KEY.strip()
        rq_uid = str(uuid.uuid4())
        
        token_response = requests.post(
            "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "RqUID": rq_uid,
                "Authorization": f"Basic {auth_key}"
            },
            data="scope=GIGACHAT_API_PERS",
            verify=False
        )
        
        token_data = token_response.json()
        access_token = token_data.get("tok") or token_data.get("access_token")
        
        if not access_token:
            print(f"❌ ОШИБКА ТОКЕНА: {token_data}")
            return {"error": "Сбер не вернул токен. Смотри консоль бэкенда."}
            
        chat_response = requests.post(
            "https://api.giga.chat/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {access_token}"
            },
            json={
                "model": GIGACHAT_MODEL,
                "messages": [
                    {"role": "system", "content": "Ты — дружелюбный помощник."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 500
            },
            verify=False
        )
        
        if not chat_response.ok:
            print(f"❌ ОШИБКА ЧАТА ({chat_response.status_code}): {chat_response.text}")
            return {"error": f"Ошибка GigaChat: {chat_response.status_code}"}
        
        answer = chat_response.json()["choices"][0]["message"]["content"]
        print(f"✅ УСПЕХ! GigaChat ответ: {answer}")
        return {"answer": answer}
        
    except Exception as e:
        print(f" КРИТИЧЕСКАЯ ОШИБКА: {e}")
        return {"error": f"Ошибка: {str(e)}"}

# =========================================================
# ДИАГНОСТИЧЕСКИЙ ЭНДПОИНТ (список моделей)
# =========================================================
@app.get("/api/ai/models")
def get_available_models():
    try:
        auth_key = GIGACHAT_AUTH_KEY.strip()
        rq_uid = str(uuid.uuid4())
        
        token_response = requests.post(
            "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "RqUID": rq_uid,
                "Authorization": f"Basic {auth_key}"
            },
            data="scope=GIGACHAT_API_PERS",
            verify=False
        )
        
        token_data = token_response.json()
        access_token = token_data.get("tok") or token_data.get("access_token")
        
        models_response = requests.get(
            "https://api.giga.chat/v1/models",
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {access_token}"
            },
            verify=False
        )
        
        return models_response.json()
    except Exception as e:
        return {"error": str(e)}

# =========================================================
# ЭНДПОИНТ: Генерация .ics файла для календаря
# =========================================================
@app.get("/api/events/{event_id}/ics")
def get_event_ics(event_id: str, db: Session = Depends(get_db)):
    """Генерирует .ics файл для добавления события в календарь"""
    event = db.query(EventDB).filter(EventDB.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
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
            "Content-Disposition": f"attachment; filename=event_{event_id}.ics"
        }
    )