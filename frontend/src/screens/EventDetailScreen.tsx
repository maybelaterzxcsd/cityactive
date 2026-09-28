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

async function fetchEventDetail(id: string): Promise<CityEvent> {
  const response = await fetch(`${API_URL}/events/${id}`);
  if (!response.ok) throw new Error("Failed to fetch event");
  return response.json();
}

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
  music: "🎵",
  sport: "⚽",
  art: "🎨",
  tech: "💻",
  food: "🍔",
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

  // 1. Загружаем событие с бэкенда
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetchEventDetail(id)
      .then((data) => {
        setEvent(data);
        setAnimatedCount(data.participantsCount);
      })
      .catch((err) => {
        console.error("Error fetching event:", err);
        setError("Не удалось загрузить событие. Проверьте подключение к серверу.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // 2. Таймер обратного отсчёта
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

  // 3. Запись как УЧАСТНИК (с двумя toast по очереди и защитой от 409)
  const handleJoin = async () => {
    if (!id || isJoining) return;

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
        // Проверяем, это ошибка "уже записан" (409 Conflict)
        if (response.status === 409) {
          throw new Error("Вы уже записаны на это событие");
        }
        throw new Error(result.error || "Failed to join");
      }

      setEvent((prev) => prev ? { ...prev, participantsCount: result.new_count || (prev.participantsCount + 1) } : prev);
      setAnimatedCount(result.new_count || (event ? event.participantsCount + 1 : 0));

      // Первый toast — успех записи
      setToast({ visible: true, message: "✅ Вы успешно записаны!" });
      
      // Второй toast — бейдж через 1.5 сек (если есть)
      if (result.new_badge) {
        setTimeout(() => {
          setBadgeToast({ visible: true, message: `🏆 Новый бейдж: ${result.new_badge}!` });
        }, 1500);
      }
    } catch (err: any) {
      console.error("Ошибка при записи:", err);
      setToast({ visible: true, message: err.message || "❌ Ошибка при записи." });
    } finally {
      setIsJoining(false);
    }
  };

  // 4. Запись как ВОЛОНТЁР (с двумя toast по очереди и защитой от 409)
  const handleVolunteer = async () => {
    if (!id || isJoining) return;

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
        // Проверяем, это ошибка "уже записан" (409 Conflict)
        if (response.status === 409) {
          throw new Error("Вы уже записаны волонтёром на это событие");
        }
        throw new Error(result.error || "Failed to join");
      }

      setEvent((prev) => prev ? { ...prev, participantsCount: result.new_count || (prev.participantsCount + 1) } : prev);
      
      // Первый toast — успех записи волонтёром
      setToast({ visible: true, message: "🤝 Спасибо! Вы записаны волонтёром!" });
      
      // Второй toast — бейдж и часы через 1.5 сек
      setTimeout(() => {
        const hoursMsg = result.hours_earned ? ` (+${result.hours_earned} ч)` : "";
        const badgeMsg = result.new_badge ? `🏆 Новый бейдж: ${result.new_badge}!` : "";
        const message = `${badgeMsg}${hoursMsg}`.trim();
        if (message) {
          setBadgeToast({ visible: true, message });
        }
      }, 1500);
    } catch (err: any) {
      console.error("Ошибка при записи волонтёром:", err);
      setToast({ visible: true, message: err.message || "❌ Ошибка при записи." });
    } finally {
      setIsJoining(false);
    }
  };

  // 5. ШАРИНГ С DEEP LINKING (через MAX Bridge)
  const handleShare = async () => {
    if (!event || !id) return;
    
    const shareText = `Смотри, крутое событие: ${event.title}!`;
    const shareLink = `${window.location.origin}?event_id=${id}`;

    maxBridge.share(shareText, shareLink);
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
          style={{ background: categoryGradients[event.category] }}
        >
          <span className="hero-icon">{categoryIcons[event.category]}</span>
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

        {/* Блок с полезными ссылками (Карты и Календарь) */}
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

      {/* Первый toast — успех */}
      <Toast
        message={toast.message}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
        variant="success"
      />

      {/* Второй toast — бейдж (появляется через 1.5 сек) */}
      <Toast
        message={badgeToast.message}
        isVisible={badgeToast.visible}
        onClose={() => setBadgeToast({ ...badgeToast, visible: false })}
        variant="badge"
      />
    </motion.div>
  );
};