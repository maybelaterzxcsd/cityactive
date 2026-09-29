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

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching events:", err);
        setError(
          "Не удалось загрузить события. Проверьте подключение к серверу.",
        );
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
            return distance <= 3;
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

  if (error) {
    return (
      <div className="home-screen">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
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

        {/* НОВЫЕ ЧИПЫ ФИЛЬТРОВ ПО ЦЕНЕ */}
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
