from database import engine, SessionLocal, Base
from models import EventDB, UserDB
import json


def init_db():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Полностью очищаем тестовые данные
        if db.query(EventDB).first():
            print("База данных уже инициализирована. Удаляем старые события...")
            db.query(EventDB).delete()
            db.commit()

        if db.query(UserDB).first():
            print("Удаляем старых пользователей...")
            db.query(UserDB).delete()
            db.commit()

        events = [
            EventDB(
                id="1",
                title="Аниме-сходка: Обсуждение нового сезона",
                description="Собираемся обсудить новый сезон аниме. Будет косплей-зона и викторина.",
                date="Сегодня, 18:00",
                location="Парк Горького, у фонтана",
                price=0,
                max_participants=30,
                participants_count=12,
                volunteers_count=0,
                organizer="AnimeClub_KZN",
                category="anime",
                category_ru="Аниме",
                age_restriction=16,
                needs_volunteers=False,
                distance="1.2 км",
                image=None,
                participants=json.dumps(["user1", "user2"])
            ),
            EventDB(
                id="2",
                title="Вечер настольных игр",
                description="Играем в Catan, Мафию и другие настолки. Приносите свои игры!",
                date="Завтра, 19:00",
                location="Антикафе 'Время'",
                price=300,
                max_participants=15,
                participants_count=8,
                volunteers_count=0,
                organizer="BoardGameClub",
                category="boardgames",
                category_ru="Настольные игры",
                age_restriction=12,
                needs_volunteers=True,
                distance="3.5 км",
                image=None,
                participants=json.dumps(["user1"])
            ),
            EventDB(
                id="3",
                title="Волонтёрство: Помощь в приюте для животных",
                description="Помогаем ухаживать за собаками и кошками. Нужны руки и доброе сердце!",
                date="Сегодня, 14:00",
                location="Приют 'Друг', ул. Ленина 45",
                price=0,
                max_participants=20,
                participants_count=5,
                volunteers_count=0,
                organizer="VolunteerKZN",
                category="volunteering",
                category_ru="Волонтёрство",
                age_restriction=14,
                needs_volunteers=True,
                distance="5.8 км",
                image=None,
                participants=json.dumps([])
            ),
            EventDB(
                id="4",
                title="Концерт инди-рока",
                description="Живая музыка от местных групп. Бар и фудкорт.",
                date="Завтра, 21:00",
                location="Клуб 'Рок-н-ролл'",
                price=500,
                max_participants=100,
                participants_count=67,
                volunteers_count=0,
                organizer="RockLive",
                category="music",
                category_ru="Музыка",
                age_restriction=18,
                needs_volunteers=False,
                distance="2.1 км",
                image=None,
                participants=json.dumps([])
            ),
            EventDB(
                id="5",
                title="Утренняя пробежка в парке",
                description="Бегаем вместе 5 км. Темп комфортный, для начинающих.",
                date="Сегодня, 07:00",
                location="Парк Победы, главный вход",
                price=0,
                max_participants=50,
                participants_count=23,
                volunteers_count=0,
                organizer="RunKZN",
                category="sport",
                category_ru="Спорт",
                age_restriction=16,
                needs_volunteers=False,
                distance="0.8 км",
                image=None,
                participants=json.dumps([])
            ),
            EventDB(
                id="6",
                title="Мастер-класс по живописи",
                description="Рисуем акварелью. Все материалы предоставляются.",
                date="Завтра, 15:00",
                location="Арт-пространство 'Холст'",
                price=800,
                max_participants=12,
                participants_count=9,
                volunteers_count=0,
                organizer="ArtStudio",
                category="art",
                category_ru="Искусство",
                age_restriction=12,
                needs_volunteers=False,
                distance="4.2 км",
                image=None,
                participants=json.dumps([])
            ),
            EventDB(
                id="7",
                title="Хакатон: Разработка мобильного приложения",
                description="48 часов кодинга. Призовой фонд 100 000 рублей.",
                date="Суббота, 10:00",
                location="IT-парк, ул. Университетская 1",
                price=0,
                max_participants=60,
                participants_count=45,
                volunteers_count=0,
                organizer="TechHub",
                category="tech",
                category_ru="Технологии",
                age_restriction=16,
                needs_volunteers=True,
                distance="6.5 км",
                image=None,
                participants=json.dumps([])
            ),
            EventDB(
                id="8",
                title="Фуд-фестиваль уличной еды",
                description="Бургеры, тако, рамен и другие деликатесы со всего мира.",
                date="Воскресенье, 12:00",
                location="Набережная, площадь у моста",
                price=0,
                max_participants=500,
                participants_count=234,
                volunteers_count=0,
                organizer="FoodFest",
                category="food",
                category_ru="Еда",
                age_restriction=0,
                needs_volunteers=False,
                distance="1.5 км",
                image=None,
                participants=json.dumps([])
            ),
            EventDB(
                id="9",
                title="Кинопоказ под открытым небом",
                description="Смотрим классику советского кино. Пледы и чай бесплатно.",
                date="Пятница, 22:00",
                location="Парк Чернышевского",
                price=0,
                max_participants=80,
                participants_count=34,
                volunteers_count=0,
                organizer="CinemaPark",
                category="art",
                category_ru="Искусство",
                age_restriction=12,
                needs_volunteers=False,
                distance="2.8 км",
                image=None,
                participants=json.dumps([])
            ),
            EventDB(
                id="10",
                title="Турнир по шахматам",
                description="Соревнование для любителей. Призы победителям.",
                date="Суббота, 14:00",
                location="Шахматный клуб, ул. Баумана 10",
                price=200,
                max_participants=32,
                participants_count=18,
                volunteers_count=0,
                organizer="ChessClub",
                category="boardgames",
                category_ru="Настольные игры",
                age_restriction=10,
                needs_volunteers=False,
                distance="3.1 км",
                image=None,
                participants=json.dumps([])
            )
        ]

        demo_user = UserDB(
            user_id="user1",
            volunteer_hours=0,
            badges=json.dumps([])
        )

        db.add_all(events)
        db.add(demo_user)
        db.commit()

        print(f"✅ Добавлено {len(events)} событий в базу данных")
        print("✅ Добавлен тестовый пользователь user1")

    finally:
        db.close()


if __name__ == "__main__":
    init_db()