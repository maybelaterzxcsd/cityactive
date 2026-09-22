import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Clock, Wallet, Users, ShieldAlert, 
  HeartHandshake, Heart, Share2, MessageCircle 
} from 'lucide-react';
import { mockEvents } from '../mocks';
import { Toast } from '../components/Toast';
import { ChatModal } from '../components/ChatModal';
import './EventDetailScreen.css';

const categoryGradients: Record<string, string> = {
  anime: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  boardgames: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  volunteering: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
};

const categoryIcons: Record<string, string> = {
  anime: '✨',
  boardgames: '🎮',
  volunteering: '🤝',
};

export const EventDetailScreen: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = mockEvents.find(e => e.id === id);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [animatedCount, setAnimatedCount] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (event) {
      let start = 0;
      const end = event.participantsCount;
      const duration = 1000;
      const step = duration / end;
      const timer = setInterval(() => {
        start++;
        setAnimatedCount(start);
        if (start >= end) clearInterval(timer);
      }, step);
      return () => clearInterval(timer);
    }
  }, [event]);

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

  if (!event) {
    return <div className="error-screen">Событие не найдено</div>;
  }

  const handleJoin = () => {
    setToast({ visible: true, message: '✅ Вы успешно записаны!' });
  };

  const handleVolunteer = () => {
    setToast({ visible: true, message: '🤝 Спасибо! Мы свяжемся с вами.' });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToast({ visible: true, message: ' Ссылка скопирована!' });
    }
  };

  const progressPercent = (event.participantsCount / event.maxParticipants) * 100;

  return (
    <motion.div 
      className="detail-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="detail-hero" style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
        <div 
          className="detail-hero__fallback"
          style={{ background: categoryGradients[event.category] }}
        >
          <span className="hero-icon">{categoryIcons[event.category]}</span>
        </div>
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Назад
        </button>
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
              className={`icon-btn ${isFavorite ? 'active' : ''}`}
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
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
            <span>{event.price === 0 ? 'Бесплатно' : `${event.price} ₽`}</span>
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
              <div 
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="progress-text">{Math.round(progressPercent)}% заполнено</span>
          </div>

          <div className="countdown">
            <span className="countdown-label">До события осталось:</span>
            <span className="countdown-time">
              {timeLeft.hours}ч {timeLeft.minutes}м
            </span>
          </div>
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
          <button className="btn btn--primary" onClick={handleJoin}>
            Иду как участник
          </button>
          {event.needsVolunteers && (
            <button className="btn btn--secondary" onClick={handleVolunteer}>
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
      />
    </motion.div>
  );
};