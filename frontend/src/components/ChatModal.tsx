import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle } from 'lucide-react';
import './ChatModal.css';

interface Message {
  id: string;
  author: string;
  text: string;
  time: string;
  isMe: boolean;
  avatar: string;
}

const mockMessages: Message[] = [
  {
    id: '1',
    author: 'Аня',
    text: 'Всем привет! Кто уже был на таких сходках?',
    time: '17:30',
    isMe: false,
    avatar: 'А',
  },
  {
    id: '2',
    author: 'Макс',
    text: 'Я ходил в прошлый раз - было круто! Будет викторина ',
    time: '17:32',
    isMe: false,
    avatar: 'М',
  },
  {
    id: '3',
    author: 'Ты',
    text: 'Круто! А косплей обязателен?',
    time: '17:35',
    isMe: true,
    avatar: 'Я',
  },
  {
    id: '4',
    author: 'Аня',
    text: 'Нет, но будет зона для фото - можно взять напрокат ',
    time: '17:36',
    isMe: false,
    avatar: 'А',
  },
];

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, eventTitle }) => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      author: 'Ты',
      text: input.trim(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      avatar: 'Я',
    };

    setMessages([...messages, newMessage]);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <motion.button
        className="chat-fab"
        onClick={() => {}}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{ display: 'none' }}
      >
        <MessageCircle size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="chat-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="chat-modal"
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="chat-header">
                <div className="chat-header__info">
                  <MessageCircle size={20} />
                  <div>
                    <h3>Чат события</h3>
                    <p>{eventTitle}</p>
                  </div>
                </div>
                <button className="chat-close" onClick={onClose}>
                  <X size={20} />
                </button>
              </div>

              <div className="chat-messages">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`message ${msg.isMe ? 'message--me' : 'message--other'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {!msg.isMe && (
                      <div className="message__avatar">{msg.avatar}</div>
                    )}
                    <div className="message__content">
                      {!msg.isMe && <span className="message__author">{msg.author}</span>}
                      <div className="message__bubble">
                        <p>{msg.text}</p>
                        <span className="message__time">{msg.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Написать сообщение..."
                  className="chat-input__field"
                />
                <button
                  className={`chat-input__send ${!input.trim() ? 'disabled' : ''}`}
                  onClick={handleSend}
                  disabled={!input.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};