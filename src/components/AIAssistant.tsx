import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Bot } from 'lucide-react';
import './AIAssistant.css';

interface AIAssistantProps {
  onRecommend: (eventId: string | null) => void;
  events: Array<{
    id: string;
    title: string;
    category: string;
    price: number;
    description: string;
    location: string;
  }>;
}

const exampleQueries = [
  'Хочу куда-нибудь бесплатно',
  'Куда пойти с друзьями?',
  'Что-нибудь интересное рядом',
  'Помочь волонтёром',
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ onRecommend, events }) => {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [response, setResponse] = useState('');
  const [recommendedId, setRecommendedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyzeQuery = (text: string): { eventId: string | null; message: string } => {
    const lower = text.toLowerCase();

    // Бесплатно
    if (lower.includes('бесплатн') || lower.includes('0 руб') || lower.includes('без денег')) {
      const freeEvent = events.find(e => e.price === 0);
      if (freeEvent) {
        return {
          eventId: freeEvent.id,
          message: `💡 Рекомендую "${freeEvent.title}" — это бесплатно и проходит в ${freeEvent.location}!`
        };
      }
    }

    // С друзьями
    if (lower.includes('друз') || lower.includes('компан') || lower.includes('вместе')) {
      const socialEvent = events.find(e => e.maxParticipants >= 10);
      if (socialEvent) {
        return {
          eventId: socialEvent.id,
          message: `👥 Отлично для компании! Попробуй "${socialEvent.title}" — там будет весело!`
        };
      }
    }

    // Рядом
    if (lower.includes('рядом') || lower.includes('близк') || lower.includes('недалек')) {
      const nearEvent = events.find(e => e.location.toLowerCase().includes('парк') || e.distance.includes('500'));
      if (nearEvent) {
        return {
          eventId: nearEvent.id,
          message: `📍 Рядом с тобой есть "${nearEvent.title}" в ${nearEvent.location}!`
        };
      }
    }

    // Волонтёрство
    if (lower.includes('волонт') || lower.includes('помоч') || lower.includes('помог')) {
      const volunteerEvent = events.find(e => e.category === 'volunteering');
      if (volunteerEvent) {
        return {
          eventId: volunteerEvent.id,
          message: `🤝 Круто, что хочешь помочь! Посмотри "${volunteerEvent.title}" — там всегда нужны волонтёры!`
        };
      }
    }

    // Аниме
    if (lower.includes('аним') || lower.includes('манг') || lower.includes('косплей')) {
      const animeEvent = events.find(e => e.category === 'anime');
      if (animeEvent) {
        return {
          eventId: animeEvent.id,
          message: `✨ Для тебя идеально подойдёт "${animeEvent.title}"! Будет косплей-зона и викторина.`
        };
      }
    }

    // Настольные игры
    if (lower.includes('игр') || lower.includes('настол') || lower.includes(' Catan')) {
      const gameEvent = events.find(e => e.category === 'boardgames');
      if (gameEvent) {
        return {
          eventId: gameEvent.id,
          message: `🎮 Рекомендую "${gameEvent.title}" — играем в Catan и Мафию!`
        };
      }
    }

    // По умолчанию
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    return {
      eventId: randomEvent.id,
      message: `🔥 Посмотри "${randomEvent.title}" — может быть, это то, что ты ищешь!`
    };
  };

  const handleSend = () => {
    if (!query.trim()) return;

    setIsTyping(true);
    setRecommendedId(null);
    onRecommend(null);

    // Имитация "думания" ИИ
    setTimeout(() => {
      const result = analyzeQuery(query);
      
      // Эффект печатания
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex < result.message.length) {
          setResponse(result.message.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
          setRecommendedId(result.eventId);
          onRecommend(result.eventId);
        }
      }, 30);
    }, 800);
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    setResponse('');
    setRecommendedId(null);
    onRecommend(null);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      className="ai-assistant"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="ai-assistant__header">
        <Bot size={20} />
        <span>Спроси ИИ, куда пойти</span>
      </div>

      <div className="ai-assistant__input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Например: хочу куда-нибудь бесплатно..."
          className="ai-assistant__input"
        />
        {query && (
          <button className="ai-assistant__clear" onClick={handleClear}>
            <X size={16} />
          </button>
        )}
        <button 
          className={`ai-assistant__send ${!query.trim() ? 'disabled' : ''}`}
          onClick={handleSend}
          disabled={!query.trim()}
        >
          <Send size={18} />
        </button>
      </div>

      <AnimatePresence>
        {response && (
          <motion.div
            className="ai-assistant__response"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="ai-assistant__response-content">
              <Sparkles size={16} className="ai-icon" />
              <p>{response}</p>
              {isTyping && <span className="typing-cursor">|</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ai-assistant__examples">
        <span className="examples-label">Примеры:</span>
        <div className="examples-list">
          {exampleQueries.map((example, index) => (
            <motion.button
              key={index}
              className="example-chip"
              onClick={() => handleExampleClick(example)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {example}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};