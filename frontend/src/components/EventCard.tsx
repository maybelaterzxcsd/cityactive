import React from 'react';
import { MapPin, Clock, Users, Share2 } from 'lucide-react';
import { maxBridge } from '../utils/maxBridge';
import './EventCard.css';

interface EventCardProps {
  event: {
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
    weather_warning?: boolean;
    is_popular?: boolean; // <-- ДОБАВЛЕНО для метки популярности
  };
  recommended?: boolean;
  onClick?: () => void;
}

// Проверяем, доступно ли раннее бронирование
const isEarlyBird = (price: number, dateStr: string): boolean => {
  // 1. Только для платных событий
  if (price <= 0) return false;
  
  const lowerDate = dateStr.toLowerCase();
  
  // 2. Не показываем для событий "сегодня" или "завтра"
  if (lowerDate.includes('сегодня') || lowerDate.includes('завтра')) return false;

  // 3. Пытаемся распарсить дату
  const eventDate = new Date(dateStr);
  if (!isNaN(eventDate.getTime())) {
    const now = new Date();
    const diffDays = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 2; // Событие пройдет больше чем через 2 дня
  }
  
  // Fallback для демо-данных (если дата в формате "15 октября")
  return true; 
};

export const EventCard: React.FC<EventCardProps> = ({ event, recommended, onClick }) => {
  // Считаем оставшиеся места
  const spotsLeft = event.maxParticipants - event.participantsCount;
  const isHot = spotsLeft > 0 && spotsLeft <= 5;

  // Проверка погоды (мок: если есть поле weather_warning ИЛИ в названии "пробежка" для демо)
  const isRainy = event.weather_warning === true || event.title.toLowerCase().includes('пробежка');

  // Проверка времени: утренняя активность (если в дате есть "утро" или время с 06:00 до 11:59)
  const isMorning = event.date.toLowerCase().includes('утро') || /0[6-9]:|10:|11:/.test(event.date);

  // Проверка "Ранняя бронь"
  const earlyBird = isEarlyBird(event.price, event.date);

  // Проверка популярности (мок: если заполнено 80%+ или явно указано is_popular)
  const fillRate = event.participantsCount / event.maxParticipants;
  const isPopular = event.is_popular === true || fillRate >= 0.8;

  // Склонение слова "место"
  const getSpotsText = (count: number) => {
    if (count === 1) return 'место';
    if (count >= 2 && count <= 4) return 'места';
    return 'мест';
  };

  // Функция "Поделиться" через MAX Bridge
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shareText = `Смотри, крутое событие: ${event.title}!`;
    const shareLink = `${window.location.origin}?event_id=${event.id}`;
    
    maxBridge.share(shareText, shareLink);
  };

  return (
    <div className={`event-card ${recommended ? 'recommended' : ''}`} onClick={onClick}>
      {event.image && (
        <div className="event-card__image">
          <img src={event.image} alt={event.title} />
        </div>
      )}
      
      <div className="event-card__content">
        <div className="event-card__top">
          <span className="event-card__category">{event.categoryRu}</span>
          {event.needsVolunteers && (
            <span className="event-card__volunteer">♥ НУЖНА ПОМОЩЬ</span>
          )}
          {event.price === 0 && !event.needsVolunteers && (
            <span className="event-card__free">Бесплатно</span>
          )}
          <span className="event-card__age">{event.ageRestriction}+</span>
        </div>

        {/* МЕТКИ: FOMO + Ранняя бронь + Популярность */}
        <div className="fomo-badges-row">
          {isHot && (
            <div className="badge-fomo badge-hot">
              🔥 Осталось {spotsLeft} {getSpotsText(spotsLeft)}!
            </div>
          )}
          {isRainy && (
            <div className="badge-fomo badge-weather">
              ⚠️ На улице, возможен дождь ☔
            </div>
          )}
          {earlyBird && (
            <div className="badge-fomo badge-early">
              🎟️ Ранняя бронь
            </div>
          )}
          {isPopular && (
            <div className="badge-fomo badge-popular">
              🔥 Популярно в твоём районе
            </div>
          )}
          {isMorning && (
            <div className="badge-fomo badge-morning">
              🌅 Утренняя активность
            </div>
          )}
        </div>

        <h3 className="event-card__title">{event.title}</h3>
        
        <div className="event-card__meta">
          <div className="meta-row">
            <MapPin size={14} />
            <span>{event.location} • {event.distance}</span>
          </div>
          <div className="meta-row">
            <Clock size={14} />
            <span>{event.date}</span>
          </div>
        </div>

        <div className="event-card__footer">
          {event.price === 0 ? (
            <span className="price-free">Бесплатно</span>
          ) : (
            <span className="price-paid">{event.price} ₽</span>
          )}
          <div className="participants">
            <Users size={14} />
            <span>{event.participantsCount}/{event.maxParticipants}</span>
          </div>
        </div>

        {/* КНОПКА ПОДЕЛИТЬСЯ */}
        <button className="btn-share" onClick={handleShare}>
          <Share2 size={14} />
          Поделиться
        </button>
      </div>
    </div>
  );
};