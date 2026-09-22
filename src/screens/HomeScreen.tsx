import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Calendar, Gift, MapPin } from 'lucide-react';
import { mockEvents } from '../mocks';
import { EventCard } from '../components/EventCard';
import { AIAssistant } from '../components/AIAssistant';
import './HomeScreen.css';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [recommendedId, setRecommendedId] = useState<string | null>(null);

  return (
    <div className="home-screen">
      <header className="home-header">
        <h1>ГородАктив</h1>
        <p className="home-subtitle">Найди свой движ сегодня</p>
      </header>

      <div className="filters">
        <button className="chip chip--active">
          <Flame size={16} /> Сегодня
        </button>
        <button className="chip">
          <Calendar size={16} /> Завтра
        </button>
        <button className="chip">
          <Gift size={16} /> Бесплатно
        </button>
        <button className="chip">
          <MapPin size={16} /> Рядом
        </button>
      </div>

      <AIAssistant 
        onRecommend={setRecommendedId}
        events={mockEvents}
      />

      <div className="events-list">
        {mockEvents.map(event => (
          <div 
            key={event.id}
            className={`event-card-wrapper ${recommendedId === event.id ? 'recommended' : ''}`}
          >
            <EventCard
              event={event}
              onClick={() => navigate(`/event/${event.id}`)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};