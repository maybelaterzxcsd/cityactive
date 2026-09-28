import React from 'react';
import { MapPin, Calendar, Users, Clock, Share2 } from 'lucide-react';
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
  };
  recommended?: boolean;
  onClick?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, recommended, onClick }) => {
  // Считаем оставшиеся места
  const spotsLeft = event.maxParticipants - event.participantsCount;
  const isHot = spotsLeft > 0 && spotsLeft <= 5;

  // Проверка погоды (мок: если есть поле weather_warning ИЛИ в названии "пробежка" для демо)
  const isRainy = event.weather_warning === true || event.title.toLowerCase().includes('пробежка');

  // Склонение слова "место"
  const getSpotsText = (count: number) => {
    if (count === 1) return 'место';
    if (count >= 2 && count <= 4) return 'места';
    return 'мест';
  };

  // Функция "Поделиться"
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Чтобы не срабатывал переход по карточке
    
    const shareData = {
      title: event.title,
      text: `Смотри, крутое событие: ${event.title}!`,
      url: `${window.location.origin}?event_id=${event.id}` // Deep link для MAX
    };

    try {
      if (navigator.share) {
        // Нативный шеринг (работает в MAX и на мобильных)
        await navigator.share(shareData);
      } else {
        // Фоллбэк для десктопа: копируем в буфер обмена
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        alert('✅ Ссылка скопирована в буфер обмена!');
      }
    } catch (err) {
      console.error('Ошибка при шаринге:', err);
    }
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

        {/* МЕТКИ FOMO */}
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