import React, { useState } from 'react';
import { Flame, Heart, MapPin, Clock, Users, Sparkles, Gamepad2, HeartHandshake } from 'lucide-react';
import './EventCard.css';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    category: string;
    date: string;
    location: string;
    distance: string;
    price: number;
    ageRestriction: number;
    needsVolunteers: boolean;
    participantsCount: number;
    maxParticipants: number;
    image: string;
    description: string;
    organizer: string;
  };
  onClick: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  anime: <Sparkles size={48} />,
  boardgames: <Gamepad2 size={48} />,
  volunteering: <HeartHandshake size={48} />,
};

const categoryGradients: Record<string, string> = {
  anime: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  boardgames: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  volunteering: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
};

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const spotsLeft = event.maxParticipants - event.participantsCount;
  const isHot = spotsLeft <= 3;

  return (
    <div className="event-card" onClick={onClick}>
      <div className="event-card__image-wrapper">
        {!imageError ? (
          <img 
            src={event.image} 
            alt={event.title} 
            className="event-card__image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div 
            className="event-card__fallback"
            style={{ background: categoryGradients[event.category] || categoryGradients.anime }}
          >
            {categoryIcons[event.category] || <Sparkles size={48} />}
          </div>
        )}
        
        {event.needsVolunteers && (
          <span className="badge badge--volunteer">
            <Heart size={12} fill="white" /> Нужна помощь
          </span>
        )}
        {isHot && (
          <span className="badge badge--hot">
            <Flame size={12} fill="white" /> Осталось {spotsLeft} места
          </span>
        )}
      </div>
      
      <div className="event-card__content">
        <div className="event-card__header">
          <span className="category-tag">{event.categoryRu}</span>
          <span className="age-tag">{event.ageRestriction}+</span>
        </div>
        
        <h3 className="event-card__title">{event.title}</h3>
        
        <div className="event-card__meta">
          <span>
            <MapPin size={14} /> {event.location} • {event.distance}
          </span>
          <span>
            <Clock size={14} /> {event.date}
          </span>
        </div>

        <div className="event-card__footer">
          <span className="price">{event.price === 0 ? 'Бесплатно' : `${event.price} ₽`}</span>
          <span className="participants">
            <Users size={14} /> {event.participantsCount}/{event.maxParticipants}
          </span>
        </div>
      </div>
    </div>
  );
};