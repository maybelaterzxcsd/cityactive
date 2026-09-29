import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Flame, Calendar, Gift, MapPin, User, Wallet } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { AIAssistant } from "../components/AIAssistant";
import "./HomeScreen.css";

const API_URL = "http://127.0.0.1:8000/api";

type FilterType =
  | "all"
  | "today"
  | "tomorrow"
  | "free"
  | "under500"
  | "under1000"
  | "nearby";

interface CityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  maxParticipants: number;
  participantsCount: number;
  organizer: string;
  category: string;
  categoryRu: string;
  ageRestriction: number;
  needsVolunteers: boolean;
  distance: string;
  image: string | null;
}

const MOCK_EVENTS: CityEvent[] = [
  {
    id: "1",
    title: "Аниме-сходка: Обсуждение нового сезона",
    description: "Собираемся обсудить последние серии и поиграть в настолки по мотивам.",
    date: "Сегодня, 18:00",
    location: "Парк Горького, у фонтана",
    price: 0,
    maxParticipants: 30,
    participantsCount: 13,
    organizer: "AnimeClub",
    category: "anime",
    categoryRu: "Аниме и манга",
    ageRestriction: 16,
    needsVolunteers: false,
    distance: "1.2 км",
    image: null,
  },
  {
    id: "2",
    title: "Вечер настольных игр",
    description: "Коллекция из 50+ игр. Чай, печеньки и отличная компания.",
    date: "Завтра, 19:00",
    location: "Антикафе 'Время'",
    price: 300,
    maxParticipants: 15,
    participantsCount: 8,
    organizer: "Настолки РФ",
    category: "boardgames",
    categoryRu: "Настольные игры",
    ageRestriction: 12,
    needsVolunteers: false,
    distance: "2.5 км",
    image: null,
  },
  {
    id: "3",
    title: "Утренняя пробежка в парке",
    description: "Легкий бег для всех уровней подготовки. Разминка и заминка включены.",
    date: "Сегодня, 07:00",
    location: "Парк Победы, главный вход",
    price: 0,
    maxParticipants: 20,
    participantsCount: 5,
    organizer: "RunCity",
    category: "sport",
    categoryRu: "Спорт",
    ageRestriction: 12,
    needsVolunteers: false,
    distance: "0.8 км",
    image: null,
  },
  {
    id: "4",
    title: "Волонтёрство: Помощь в приюте для животных",
    description: "Нужна помощь с выгулом собак и уборкой вольеров. Инструктаж на месте.",
    date: "Сегодня, 14:00",
    location: "Приют 'Друг', ул. Ленина 45",
    price: 0,
    maxParticipants: 10,
    participantsCount: 4,
    organizer: "Друг",
    category: "volunteering",
    categoryRu: "Волонтёрство",
    ageRestriction: 14,
    needsVolunteers: true,
    distance: "4.5 км",
    image: null,
  },
  {
    id: "5",
    title: "Мастер-класс по живописи",
    description: "Рисуем акрилом на холсте. Все материалы предоставляются.",
    date: "Завтра, 15:00",
    location: "Арт-пространство 'Холст'",
    price: 800,
    maxParticipants: 10,
    participantsCount: 8,
    organizer: "ArtSpace",
    category: "art",
    categoryRu: "Творчество",
    ageRestriction: 16,
    needsVolunteers: false,
    distance: "3.1 км",
    image: null,
  },
  {
    id: "6",
    title: "Хакатон по веб-разработке",
    description: "48 часов кодинга, пиццы и нетворкинга. Призовой фонд 100к.",
    date: "15 октября, 10:00",
    location: "Технопарк, зал 301",
    price: 0,
    maxParticipants: 60,
    participantsCount: 45,
    organizer: "TechHub",
    category: "tech",
    categoryRu: "IT и Хакатоны",
    ageRestriction: 16,
    needsVolunteers: true,
    distance: "5.0 км",
    image: null,
  },
  {
    id: "7",
    title: "Йога на открытом воздухе",
    description: "Утренняя практика для всех уровней. Коврики предоставляем.",
    date: "Завтра, 08:00",
    location: "Сквер у Театра Драмы",
    price: 400,
    maxParticipants: 25,
    participantsCount: 12,
    organizer: "YogaFlow",
    category: "sport",
    categoryRu: "Спорт",
    ageRestriction: 14,
    needsVolunteers: false,
    distance: "1.8 км",
    image: null,
  },
  {
    id: "8",
    title: "Квиз 'Что? Где? Когда?'",
    description: "Интеллектуальная битва команд. 6 раундов, 36 вопросов.",
    date: "Сегодня, 20:00",
    location: "Бар 'Мозгобойня'",
    price: 500,
    maxParticipants: 40,
    participantsCount: 32,
    organizer: "QuizMaster",
    category: "boardgames",
    categoryRu: "Настольные игры",
    ageRestriction: 16,
    needsVolunteers: false,
    distance: "2.2 км",
    image: null,
  },
  {
    id: "9",
    title: "Фестиваль уличной еды",
    description: "15 фудтраков, живая музыка, мастер-классы от шеф-поваров.",
    date: "16 октября, 12:00",
    location: "Набережная, площадь у Моста",
    price: 0,
    maxParticipants: 500,
    participantsCount: 234,
    organizer: "StreetFood Fest",
    category: "food",
    categoryRu: "Еда и напитки",
    ageRestriction: 0,
    needsVolunteers: true,
    distance: "3.5 км",
    image: null,
  },
  {
    id: "10",
    title: "Концерт инди-группы 'Лунный свет'",
    description: "Акустический концерт в уютной атмосфере. Мерч, автограф-сессия.",
    date: "17 октября, 19:00",
    location: "Клуб 'Подвал'",
    price: 700,
    maxParticipants: 80,
    participantsCount: 67,
    organizer: "LiveMusic",
    category: "music",
    categoryRu: "Музыка",
    ageRestriction: 18,
    needsVolunteers: false,
    distance: "4.0 км",
    image: null,
  },
  {
    id: "11",
    title: "Экскурсия по историческому центру",
    description: "Пешеходная прогулка с гидом. Узнайте тайны старых зданий.",
    date: "Завтра, 11:00",
    location: "Площадь Революции, у фонтана",
    price: 350,
    maxParticipants: 20,
    participantsCount: 15,
    organizer: "ГидГород",
    category: "art",
    categoryRu: "Творчество",
    ageRestriction: 12,
    needsVolunteers: false,
    distance: "1.5 км",
    image: null,
  },
  {
    id: "12",
    title: "Турнир по настольному теннису",
    description: "Одиночный разряд, олимпийская система. Призы от спонсоров.",
    date: "18 октября, 10:00",
    location: "Спорткомплекс 'Олимп'",
    price: 200,
    maxParticipants: 32,
    participantsCount: 28,
    organizer: "SportCity",
    category: "sport",
    categoryRu: "Спорт",
    ageRestriction: 14,
    needsVolunteers: false,
    distance: "6.2 км",
    image: null,
  }
];

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const eventId = params.get("event_id");

    if (eventId) {
      navigate(`/event/${eventId}`);
    }
  }, [location.search, navigate]);

  useEffect(() => {
    fetch(`${API_URL}/events`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: CityEvent[]) => {
        setEvents(data);
      })
      .catch((err) => {
        console.warn("Бэкенд недоступен, используем демо-данные (mocks).", err);
        setEvents(MOCK_EVENTS);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = useMemo(() => {
    let result: CityEvent[] = [];

    if (activeFilter === "all") {
      result = events;
    } else {
      result = events.filter((event) => {
        switch (activeFilter) {
          case "today":
            return event.date.toLowerCase().includes("сегодня");
          case "tomorrow":
            return event.date.toLowerCase().includes("завтра");
          case "free":
            return event.price === 0;
          case "under500":
            return event.price <= 500;
          case "under1000":
            return event.price <= 1000;
          case "nearby":
            const distance = parseFloat(event.distance.replace(" км", ""));
            return !isNaN(distance) && distance <= 3;
          default:
            return true;
        }
      });
    }

    if (recommendedIds.length > 0) {
      result = [...result].sort((a, b) => {
        const aRecommended = recommendedIds.includes(a.id) ? 0 : 1;
        const bRecommended = recommendedIds.includes(b.id) ? 0 : 1;
        return aRecommended - bRecommended;
      });
    }

    return result;
  }, [events, activeFilter, recommendedIds]);

  if (loading) {
    return (
      <div className="home-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка событий...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-screen">
      <header className="home-header">
        <div className="header-left">
          <h1>ГородАктив</h1>
          <p className="home-subtitle">Найди свой движ сегодня</p>
        </div>
        <button className="my-events-btn" onClick={() => navigate("/profile")}>
          <User size={18} /> Профиль
        </button>
      </header>

      <div className="filters">
        <button
          className={`chip ${activeFilter === "all" ? "chip--active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          <Flame size={16} /> Все
        </button>
        <button
          className={`chip ${activeFilter === "today" ? "chip--active" : ""}`}
          onClick={() => setActiveFilter("today")}
        >
          <Calendar size={16} /> Сегодня
        </button>
        <button
          className={`chip ${activeFilter === "tomorrow" ? "chip--active" : ""}`}
          onClick={() => setActiveFilter("tomorrow")}
        >
          <Calendar size={16} /> Завтра
        </button>
        <button
          className={`chip ${activeFilter === "free" ? "chip--active" : ""}`}
          onClick={() => setActiveFilter("free")}
        >
          <Gift size={16} /> Бесплатно
        </button>
        <button
          className={`chip ${activeFilter === "under500" ? "chip--active" : ""}`}
          onClick={() => setActiveFilter("under500")}
        >
          <Wallet size={16} /> До 500₽
        </button>
        <button
          className={`chip ${activeFilter === "under1000" ? "chip--active" : ""}`}
          onClick={() => setActiveFilter("under1000")}
        >
          <Wallet size={16} /> До 1000₽
        </button>
        <button
          className={`chip ${activeFilter === "nearby" ? "chip--active" : ""}`}
          onClick={() => setActiveFilter("nearby")}
        >
          <MapPin size={16} /> Рядом
        </button>
      </div>

      <AIAssistant onRecommend={setRecommendedIds} events={filteredEvents} />

      <div className="events-list">
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <p>Ничего не найдено. Попробуйте другой фильтр.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`event-card-wrapper ${
                recommendedIds.includes(event.id) ? "recommended-badge" : ""
              }`}
            >
              <EventCard
                event={event}
                recommended={recommendedIds.includes(event.id)}
                onClick={() => navigate(`/event/${event.id}`)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};