import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, ArrowLeft } from 'lucide-react';
import './MyEventsScreen.css';

const API_URL = 'http://127.0.0.1:8000/api';

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

export const MyEventsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/my-events`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
      })
      .catch((err) => console.error('Error fetching my events:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="my-events-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="my-events-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="my-events-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Назад
        </button>
        <h1>Мои события</h1>
      </header>

      {events.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <p>Вы еще не записались ни на одно событие</p>
          <button className="btn btn--primary" onClick={() => navigate('/')}>
            Найти событие
          </button>
        </div>
      ) : (
        <div className="events-list">
          {events.map(event => (
            <motion.div
              key={event.id}
              className="event-card"
              onClick={() => navigate(`/event/${event.id}`)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="event-card__content">
                <h3>{event.title}</h3>
                <div className="event-meta">
                  <span className="meta-item">
                    <Calendar size={14} /> {event.date}
                  </span>
                  <span className="meta-item">
                    <MapPin size={14} /> {event.location}
                  </span>
                  <span className="meta-item">
                    <Users size={14} /> {event.participantsCount}/{event.maxParticipants}
                  </span>
                </div>
                <div className="event-category">
                  {event.categoryRu}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};