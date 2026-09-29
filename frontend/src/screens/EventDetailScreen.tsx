import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Wallet,
  Users,
  ShieldAlert,
  HeartHandshake,
  Heart,
  Share2,
  MessageCircle,
  Calendar,
} from "lucide-react";
import { maxBridge } from "../utils/maxBridge";
import { Toast } from "../components/Toast";
import { ChatModal } from "../components/ChatModal";
import "./EventDetailScreen.css";

const API_URL = "http://127.0.0.1:8000/api";

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

const MOCK_EVENTS_DB: Record<string, CityEvent> = {
  "1": { id: "1", title: "Аниме-сходка: Обсуждение нового сезона", description: "Собираемся обсудить последние серии и поиграть в настолки по мотивам.", date: "Сегодня, 18:00", location: "Парк Горького, у фонтана", price: 0, maxParticipants: 30, participantsCount: 13, organizer: "AnimeClub", category: "anime", categoryRu: "Аниме и манга", ageRestriction: 16, needsVolunteers: false, distance: "1.2 км", image: null },
  "2": { id: "2", title: "Вечер настольных игр", description: "Коллекция из 50+ игр. Чай, печеньки и отличная компания.", date: "Завтра, 19:00", location: "Антикафе 'Время'", price: 300, maxParticipants: 15, participantsCount: 8, organizer: "Настолки РФ", category: "boardgames", categoryRu: "Настольные игры", ageRestriction: 12, needsVolunteers: false, distance: "2.5 км", image: null },
  "3": { id: "3", title: "Утренняя пробежка в парке", description: "Легкий бег для всех уровней подготовки. Разминка и заминка включены.", date: "Сегодня, 07:00", location: "Парк Победы, главный вход", price: 0, maxParticipants: 20, participantsCount: 5, organizer: "RunCity", category: "sport", categoryRu: "Спорт", ageRestriction: 12, needsVolunteers: false, distance: "0.8 км", image: null },
  "4": { id: "4", title: "Волонтёрство: Помощь в приюте для животных", description: "Нужна помощь с выгулом собак и уборкой вольеров. Инструктаж на месте.", date: "Сегодня, 14:00", location: "Приют 'Друг', ул. Ленина 45", price: 0, maxParticipants: 10, participantsCount: 4, organizer: "Друг", category: "volunteering", categoryRu: "Волонтёрство", ageRestriction: 14, needsVolunteers: true, distance: "4.5 км", image: null },
  "5": { id: "5", title: "Мастер-класс по живописи", description: "Рисуем акрилом на холсте. Все материалы предоставляются.", date: "Завтра, 15:00", location: "Арт-пространство 'Холст'", price: 800, maxParticipants: 10, participantsCount: 8, organizer: "ArtSpace", category: "art", categoryRu: "Творчество", ageRestriction: 16, needsVolunteers: false, distance: "3.1 км", image: null },
  "6": { id: "6", title: "Хакатон по веб-разработке", description: "48 часов кодинга, пиццы и нетворкинга. Призовой фонд 100к.", date: "15 октября, 10:00", location: "Технопарк, зал 301", price: 0, maxParticipants: 60, participantsCount: 45, organizer: "TechHub", category: "tech", categoryRu: "IT и Хакатоны", ageRestriction: 16, needsVolunteers: true, distance: "5.0 км", image: null },
  "7": { id: "7", title: "Йога на открытом воздухе", description: "Утренняя практика для всех уровней. Коврики предоставляем.", date: "Завтра, 08:00", location: "Сквер у Театра Драмы", price: 400, maxParticipants: 25, participantsCount: 12, organizer: "YogaFlow", category: "sport", categoryRu: "Спорт", ageRestriction: 14, needsVolunteers: false, distance: "1.8 км", image: null },
  "8": { id: "8", title: "Квиз 'Что? Где? Когда?'", description: "Интеллектуальная битва команд. 6 раундов, 36 вопросов.", date: "Сегодня, 20:00", location: "Бар 'Мозгобойня'", price: 500, maxParticipants: 40, participantsCount: 32, organizer: "QuizMaster", category: "boardgames", categoryRu: "Настольные игры", ageRestriction: 16, needsVolunteers: false, distance: "2.2 км", image: null },
  "9": { id: "9", title: "Фестиваль уличной еды", description: "15 фудтраков, живая музыка, мастер-классы от шеф-поваров.", date: "16 октября, 12:00", location: "Набережная, площадь у Моста", price: 0, maxParticipants: 500, participantsCount: 234, organizer: "StreetFood Fest", category: "food", categoryRu: "Еда и напитки", ageRestriction: 0, needsVolunteers: true, distance: "3.5 км", image: null },
  "10": { id: "10", title: "Концерт инди-группы 'Лунный свет'", description: "Акустический концерт в уютной атмосфере. Мерч, автограф-сессия.", date: "17 октября, 19:00", location: "Клуб 'Подвал'", price: 700, maxParticipants: 80, participantsCount: 67, organizer: "LiveMusic", category: "music", categoryRu: "Музыка", ageRestriction: 18, needsVolunteers: false, distance: "4.0 км", image: null },
  "11": { id: "11", title: "Экскурсия по историческому центру", description: "Пешеходная прогулка с гидом. Узнайте тайны старых зданий.", date: "Завтра, 11:00", location: "Площадь Революции, у фонтана", price: 350, maxParticipants: 20, participantsCount: 15, organizer: "ГидГород", category: "art", categoryRu: "Творчество", ageRestriction: 12, needsVolunteers: false, distance: "1.5 км", image: null },
  "12": { id: "12", title: "Турнир по настольному теннису", description: "Одиночный разряд, олимпийская система. Призы от спонсоров.", date: "18 октября, 10:00", location: "Спорткомплекс 'Олимп'", price: 200, maxParticipants: 32, participantsCount: 28, organizer: "SportCity", category: "sport", categoryRu: "Спорт", ageRestriction: 14, needsVolunteers: false, distance: "6.2 км", image: null }
};

const categoryGradients: Record<string, string> = {
  anime: "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
  boardgames: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
  volunteering: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  music: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
  sport: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
  art: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
  tech: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  food: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
};

const categoryIcons: Record<string, string> = {
  anime: "✨",
  boardgames: "🎮",
  volunteering: "🤝",
  music: "",
  sport: "⚽",
  art: "🎨",
  tech: "💻",
  food: "",
};

export const EventDetailScreen: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<CityEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [badgeToast, setBadgeToast] = useState({ visible: false, message: "" });
  const [animatedCount, setAnimatedCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/events/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: CityEvent) => {
        setEvent(data);
        setAnimatedCount(data.participantsCount);
      })
      .catch((_err) => {
        console.warn("Бэкенд недоступен, используем демо-данные для события", id);
        const mockEvent = MOCK_EVENTS_DB[id];
        if (mockEvent) {
          setEvent(mockEvent);
          setAnimatedCount(mockEvent.participantsCount);
        } else {
          setError("Событие не найдено");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const targetTime = new Date();
    targetTime.setHours(targetTime.getHours() + 2);

    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetTime.getTime() - now.getTime();
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft({ hours, minutes });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleJoin = async () => {
    if (!id || isJoining || !event) return;

    setIsJoining(true);
    const userId = maxBridge.getUserId();
    
    try {
      const response = await fetch(`${API_URL}/events/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: "participant" }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || result.error || "Ошибка при записи");
      }

      setEvent({ ...event, participantsCount: result.new_count || (event.participantsCount + 1) });
      setAnimatedCount(result.new_count || (event.participantsCount + 1));
      setToast({ visible: true, message: "Вы успешно записаны!" });
      
      if (result.new_badge) {
        setTimeout(() => {
          setBadgeToast({ visible: true, message: `Новый бейдж: ${result.new_badge}!` });
        }, 1500);
      }
    } catch (err: any) {
      console.warn("Бэкенд недоступен, симулируем успешную запись (демо-режим)");
      setEvent({ ...event, participantsCount: event.participantsCount + 1 });
      setAnimatedCount(event.participantsCount + 1);
      setToast({ visible: true, message: "Вы успешно записаны! (Демо-режим)" });
    } finally {
      setIsJoining(false);
    }
  };

  const handleVolunteer = async () => {
    if (!id || isJoining || !event) return;

    setIsJoining(true);
    const userId = maxBridge.getUserId();

    try {
      const response = await fetch(`${API_URL}/events/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: "volunteer" }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || result.error || "Ошибка при записи");
      }

      setEvent({ ...event, participantsCount: result.new_count || (event.participantsCount + 1) });
      setToast({ visible: true, message: "Вы записаны волонтером!" });
      
      setTimeout(() => {
        const hoursMsg = result.hours_earned ? ` (+${result.hours_earned} ч)` : "";
        const badgeMsg = result.new_badge ? `🏆 Новый бейдж: ${result.new_badge}!` : "";
        const message = `${badgeMsg}${hoursMsg}`.trim();
        if (message) {
          setBadgeToast({ visible: true, message });
        }
      }, 1500);
    } catch (err: any) {
      console.warn("Бэкенд недоступен, симулируем запись волонтера (демо-режим)");
      setEvent({ ...event, participantsCount: event.participantsCount + 1 });
      setToast({ visible: true, message: "Вы записаны волонтером! (Демо-режим)" });
      setTimeout(() => {
        setBadgeToast({ visible: true, message: "🏆 Новый бейдж: Волонтёр! (+2 ч)" });
      }, 1500);
    } finally {
      setIsJoining(false);
    }
  };

  const handleShare = async () => {
    if (!event || !id) return;
    
    const shareText = `Смотри, крутое событие: ${event.title}!`;
    const shareLink = `${window.location.origin}?event_id=${id}`;

    const success = await maxBridge.share(shareText, shareLink);
    
    if (success) {
      setToast({ visible: true, message: "Ссылка скопирована!" });
    }
  };

  if (loading) {
    return (
      <div className="detail-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка события...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="detail-screen">
        <div className="error-container">
          <p>{error || "Событие не найдено"}</p>
          <button className="btn btn--primary" onClick={() => navigate(-1)}>Назад</button>
        </div>
      </div>
    );
  }

  const progressPercent = (event.participantsCount / event.maxParticipants) * 100;

  return (
    <motion.div
      className="detail-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="detail-hero">
        <button className="back-button-inline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Назад
        </button>
        <div
          className="detail-hero__fallback"
          style={{ background: categoryGradients[event.category] || categoryGradients.tech }}
        >
          <span className="hero-icon">{categoryIcons[event.category] || "📅"}</span>
        </div>
      </div>

      <div className="detail-content">
        <motion.div
          className="title-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1>{event.title}</h1>
          <div className="action-buttons">
            <button
              className={`icon-btn ${isFavorite ? "active" : ""}`}
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <button className="icon-btn" onClick={handleShare}>
              <Share2 size={20} />
            </button>
          </div>
        </motion.div>

        <motion.div
          className="detail-meta glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="meta-item">
            <MapPin size={18} />
            <span>{event.location}</span>
          </div>
          <div className="meta-item">
            <Clock size={18} />
            <span>{event.date}</span>
          </div>
          <div className="meta-item">
            <Wallet size={18} />
            <span>{event.price === 0 ? "Бесплатно" : `${event.price} ₽`}</span>
          </div>
          <div className="meta-item">
            <Users size={18} />
            <span>{animatedCount} из {event.maxParticipants} мест</span>
          </div>
          <div className="meta-item">
            <ShieldAlert size={18} />
            <span>{event.ageRestriction}+</span>
          </div>

          <div className="progress-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="progress-text">{Math.round(progressPercent)}% заполнено</span>
          </div>

          <div className="countdown">
            <span className="countdown-label">До события осталось:</span>
            <span className="countdown-time">{timeLeft.hours}ч {timeLeft.minutes}м</span>
          </div>
        </motion.div>

        <motion.div
          className="detail-links glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <a 
            href={`https://yandex.ru/maps/?text=${encodeURIComponent(event.location)}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="link-item"
          >
            <MapPin size={18} className="link-icon" /> 
            <span>Открыть в Яндекс.Картах</span>
          </a>
          <button 
            className="link-item"
            onClick={() => window.open(`${API_URL}/events/${event.id}/ics`)}
          >
            <Calendar size={18} className="link-icon" /> 
            <span>Добавить в календарь (.ics)</span>
          </button>
        </motion.div>

        <motion.div
          className="detail-description"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2>О событии</h2>
          <p>{event.description}</p>
          <p className="organizer">Организатор: {event.organizer}</p>
        </motion.div>

        <motion.div
          className="detail-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            className="btn btn--primary"
            onClick={handleJoin}
            disabled={isJoining}
          >
            {isJoining ? "Записываем..." : "Иду как участник"}
          </button>

          {event.needsVolunteers && (
            <button className="btn btn--secondary" onClick={handleVolunteer} disabled={isJoining}>
              <HeartHandshake size={18} /> Хочу помочь организовать
            </button>
          )}

          <button className="btn btn--chat" onClick={() => setIsChatOpen(true)}>
            <MessageCircle size={18} /> Открыть чат события
            <span className="chat-badge">3</span>
          </button>
        </motion.div>

        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          eventTitle={event.title}
        />
      </div>

      <Toast
        message={toast.message}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
        variant="success"
      />

      <Toast
        message={badgeToast.message}
        isVisible={badgeToast.visible}
        onClose={() => setBadgeToast({ ...badgeToast, visible: false })}
        variant="badge"
      />
    </motion.div>
  );
};