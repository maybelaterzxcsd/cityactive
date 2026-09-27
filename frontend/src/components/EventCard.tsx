import React from 'react';
import { MapPin, Calendar, Users, Clock } from 'lucide-react';
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
  };
  recommended?: boolean;
  onClick?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, recommended, onClick }) => {
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
      </div>
    </div>
  );
};