import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Bot, Loader2 } from 'lucide-react';
import './AIAssistant.css';

interface AIAssistantProps {
  onRecommend: (eventIds: string[]) => void;
  events: Array<{
    id: string;
    title: string;
    category: string;
    categoryRu: string;
    price: number;
    description: string;
    location: string;
    distance: string;
    maxParticipants: number;
    needsVolunteers: boolean;
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Умный парсинг: ищет ID по названию или по служебной строке
  const extractRecommendedIds = (answer: string): string[] => {
    // Способ 1: ищем явную строку РЕКОМЕНДУЮ_ID: 1, 3, 5
    const explicitMatch = answer.match(/РЕКОМЕНДУЮ_ID:\s*([\d,\s]+)/i);
    if (explicitMatch) {
      return explicitMatch[1].split(',').map((id: string) => id.trim()).filter((id: string) => id);
    }

    // Способ 2 (fallback): ищем ID по совпадению названий событий в ответе
    const foundIds: string[] = [];
    events.forEach((event) => {
      // Берём короткое название (до двоеточия или первое слово)
      const shortTitle = event.title.split(':')[0].trim().toLowerCase();
      const fullTitle = event.title.toLowerCase();
      
      // Если название события встречается в ответе ИИ
      if (answer.toLowerCase().includes(shortTitle) || answer.toLowerCase().includes(fullTitle)) {
        foundIds.push(event.id);
      }
    });

    return foundIds.slice(0, 3); // Максимум 3
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    setIsTyping(true);
    setResponse('');
    onRecommend([]);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, events }),
      });

      const data = await res.json();

      if (data.error) {
        setResponse(`❌ Ошибка: ${data.error}`);
      } else {
        // Убираем служебную строку из текста
        const cleanAnswer = data.answer.replace(/РЕКОМЕНДУЮ_ID:\s*[\d,\s]+/i, '').trim();
        setResponse(cleanAnswer);
        
        // Парсим ID (с fallback)
        const ids = extractRecommendedIds(data.answer);
        if (ids.length > 0) {
          onRecommend(ids);
        }
      }
    } catch (err) {
      console.error(err);
      setResponse('❌ Не удалось связаться с сервером.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    setTimeout(() => handleSend(), 100);
  };

  const handleClear = () => {
    setQuery('');
    setResponse('');
    onRecommend([]);
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
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Например: хочу куда-нибудь бесплатно..."
          className="ai-assistant__input"
          disabled={isTyping}
        />
        {query && !isTyping && (
          <button className="ai-assistant__clear" onClick={handleClear}>
            <X size={16} />
          </button>
        )}
        <button 
          className={`ai-assistant__send ${!query.trim() || isTyping ? 'disabled' : ''}`}
          onClick={handleSend}
          disabled={!query.trim() || isTyping}
        >
          {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
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
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{response}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!response && !isTyping && (
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
      )}
    </motion.div>
  );
};