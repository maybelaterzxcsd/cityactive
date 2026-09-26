from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json
import requests  # Добавлено для запросов к Яндексу

from database import engine, get_db, Base
from models import EventDB

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

# === НАСТРОЙКИ YANDEX GPT (Твои ключи уже здесь) ===
YANDEX_API_KEY = "AQVNxoQDQ6_JI2Dca6F9EIcW71fd4pQcx4w0KG5X"
YANDEX_FOLDER_ID = "b1g1pd15rpqbbsq8egst"
# ====================================================

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

@app.get("/")
def read_root():
    return {"message": "CityActive Backend with SQLite & YandexGPT is running!"}

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

@app.post("/api/events/{event_id}/join")
def join_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(EventDB).filter(EventDB.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event.participants_count >= event.max_participants:
        return {"error": "Мест нет"}
    
    event.participants_count += 1
    import random
    user_id = f"user_{random.randint(1000, 9999)}"
    participants = json.loads(event.participants) if event.participants else []
    participants.append(user_id)
    event.participants = json.dumps(participants)
    
    db.commit()
    db.refresh(event)
    
    print(f"✅ Счётчик увеличен. Теперь участников: {event.participants_count}")
    return {"message": "Успешно записались!", "new_count": event.participants_count}

@app.get("/api/my-events")
def get_my_events(db: Session = Depends(get_db)):
    user_id = "user1"
    events = db.query(EventDB).all()
    
    my_events = []
    for event in events:
        participants = json.loads(event.participants) if event.participants else []
        if user_id in participants:
            my_events.append(EventResponse(event).__dict__)
    
    return my_events

# === ЭНДПОИНТ ДЛЯ ИИ ===
@app.post("/api/ai/recommend")
def ai_recommend(data: dict, db: Session = Depends(get_db)):
    user_query = data.get("query", "")
    events = data.get("events", [])
    
    if not user_query:
        return {"error": "Пустой запрос"}
    
    # Собираем топ-15 событий в текст, чтобы отправить Яндексу
    events_context = "\n".join([
        f"ID: {e['id']}, Название: {e['title']}, Категория: {e['categoryRu']}, "
        f"Описание: {e['description'][:100]}..., Цена: {e['price']} руб., Место: {e['location']}"
        for e in events[:15]
    ])
    
    prompt = f"""Ты — дружелюбный помощник приложения "ГородАктив". 
Пользователь спрашивает: "{user_query}"

Вот доступные события:
{events_context}

Выбери 1-2 наиболее подходящих события. 
ОБЯЗАТЕЛЬНО в конце ответа напиши строго в таком формате: "РЕКОМЕНДУЮ_ID: 1, 3" (через запятую ID выбранных событий).
Отвечай кратко, живо, максимум 3-4 предложения."""

    try:
        response = requests.post(
            "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
            headers={
                "Authorization": f"Api-Key {YANDEX_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "modelUri": f"gpt://{YANDEX_FOLDER_ID}/yandexgpt/latest",
                "completionOptions": {
                    "stream": False,
                    "temperature": 0.7,
                    "maxTokens": "300"
                },
                "messages": [
                    {
                        "role": "user",
                        "text": prompt
                    }
                ]
            }
        )
        
        if response.ok:
            result = response.json()
            # Достаём текст ответа из структуры Яндекса
            answer = result["result"]["alternatives"][0]["message"]["text"]
            return {"answer": answer}
        else:
            print(f"Yandex Error: {response.text}")
            return {"error": f"Ошибка API Яндекса: {response.status_code}"}
            
    except Exception as e:
        print(f"YandexGPT Error: {e}")
        return {"error": "Ошибка подключения к ИИ. Проверьте консоль бэкенда."}