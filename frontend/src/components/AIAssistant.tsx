import React, { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

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

interface AIAssistantProps {
  events: CityEvent[];
  onRecommend: (ids: string[]) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ events, onRecommend }) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

  // === ЛОКАЛЬНАЯ ЭМУЛЯЦИЯ AI (Демо-режим для стабильной работы без бэкенда) ===
  const generateMockResponse = (q: string, evts: CityEvent[]) => {
    const lowerQ = q.toLowerCase();
    let filtered = [...evts];
    let message = "Я проанализировал ваш запрос. ";

    if (lowerQ.includes("бесплатн") || lowerQ.includes("0 руб") || lowerQ.includes("даром")) {
      filtered = filtered.filter(e => e.price === 0);
      message += "Отфильтровал только бесплатные события. ";
    }
    if (lowerQ.includes("сегодня")) {
      filtered = filtered.filter(e => e.date.toLowerCase().includes("сегодня"));
      message += "Оставил только то, что проходит сегодня. ";
    }
    if (lowerQ.includes("завтра")) {
      filtered = filtered.filter(e => e.date.toLowerCase().includes("завтра"));
      message += "Оставил только то, что проходит завтра. ";
    }
    if (lowerQ.includes("волонтер") || lowerQ.includes("помощь") || lowerQ.includes("приют") || lowerQ.includes("добр")) {
      filtered = filtered.filter(e => e.needsVolunteers || e.category === "volunteering");
      message += "Нашёл отличные возможности для волонтёрства. ";
    }
    if (lowerQ.includes("аниме") || lowerQ.includes("манга") || lowerQ.includes("косплей")) {
      filtered = filtered.filter(e => e.category === "anime");
      message += "Подобрал лучшие аниме-события. ";
    }
    if (lowerQ.includes("настолк") || lowerQ.includes("игр") || lowerQ.includes("монополия")) {
      filtered = filtered.filter(e => e.category === "boardgames");
      message += "Рекомендую эти настольные игры. ";
    }
    if (lowerQ.includes("спорт") || lowerQ.includes("бег") || lowerQ.includes("йога")) {
      filtered = filtered.filter(e => e.category === "sport");
      message += "Вот спортивные активности. ";
    }
    
    // ИСПРАВЛЕНО: безопасная проверка distance, чтобы не было краша на локале
    if (lowerQ.includes("рядом") || lowerQ.includes("близко")) {
      filtered = filtered.filter(e => {
        if (!e.distance) return false;
        const dist = parseFloat(e.distance.replace(" км", ""));
        return !isNaN(dist) && dist <= 3;
      });
      message += "Отобрал события в шаговой доступности. ";
    }

    // Fallback: если ничего не нашлось или запрос слишком общий
    if (filtered.length === 0) {
      filtered = evts.slice(0, 3);
      message = "По вашему точному запросу ничего не нашлось, но вот самые популярные события, которые могут вам понравиться: ";
    } else if (filtered.length > 3) {
      filtered = filtered.slice(0, 3); // Ограничиваем до топ-3 для чистоты UI
      message += `Вот топ-3 рекомендации: `;
    } else {
      message += `Вот что я нашёл: `;
    }

    // Формируем ответ со скрытыми тегами для подсветки карточек
    const tags = filtered.map(e => `РЕКОМЕНДУЮ_${e.id}`).join(" ");
    const titles = filtered.map(e => `• ${e.title} (${e.date})`).join("\n");
    
    return {
      answer: `${message}\n\n${titles}\n\n${tags}`
    };
  };

  const handleAsk = async () => {
    if (!query.trim() || events.length === 0) return;

    setIsLoading(true);
    setResponse("");
    setError("");

    try {
      // =========================================================================
      // РЕАЛЬНАЯ ИНТЕГРАЦИЯ С AI-БЭКЕНДОМ (закомментировано для стабильного демо-режима)
      // =========================================================================
      /*
      const res = await fetch(`${API_URL}/ai/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, events }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Ошибка сервера при обработке запроса");
      }

      if (data.answer) {
        const cleanAnswer = data.answer.replace(/РЕКОМЕНДУЮ_\d+/g, "");
        setResponse(cleanAnswer);

        const recommendedIds = data.answer.match(/РЕКОМЕНДУЮ_(\d+)/g)?.map((id: string) => 
          id.replace("РЕКОМЕНДУЮ_", "")
        ) || [];
        
        onRecommend(recommendedIds);
      } else {
        throw new Error("Не удалось получить ответ от AI-ассистента");
      }
      */
      // =========================================================================

      // ДЕМО-РЕЖИМ: Эмуляция задержки сети и "раздумий" AI (1 секунда)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = generateMockResponse(query, events);
      
      const cleanAnswer = mockData.answer.replace(/РЕКОМЕНДУЮ_\d+/g, "");
      setResponse(cleanAnswer);

      const recommendedIds = mockData.answer.match(/РЕКОМЕНДУЮ_(\d+)/g)?.map((id: string) => 
        id.replace("РЕКОМЕНДУЮ_", "")
      ) || [];
      
      onRecommend(recommendedIds);

    } catch (err: any) {
      console.error("AI Assistant error:", err);
      setError("Ошибка сети. Проверьте подключение к серверу или попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-assistant" style={{ 
      background: "rgba(99, 102, 241, 0.05)", 
      border: "1px solid rgba(99, 102, 241, 0.2)", 
      borderRadius: "16px", 
      padding: "16px", 
      marginBottom: "20px" 
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <Sparkles size={18} color="#818cf8" />
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "white" }}>
          AI-помощник
        </h3>
      </div>

      <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#a0a0b0" }}>
        Опишите, что вы ищете (например: "бесплатные события на выходные" или "мероприятия для волонтеров")
      </p>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Введите ваш запрос..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.05)",
            color: "white",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={handleAsk}
          disabled={isLoading || !query.trim()}
          style={{
            padding: "10px 14px",
            borderRadius: "12px",
            border: "none",
            background: isLoading ? "#4f46e5" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "white",
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>

      {error && (
        <div style={{ 
          marginTop: "12px", 
          padding: "10px", 
          background: "rgba(239, 68, 68, 0.1)", 
          border: "1px solid rgba(239, 68, 68, 0.3)", 
          borderRadius: "8px", 
          color: "#fca5a5", 
          fontSize: "13px" 
        }}>
          {error}
        </div>
      )}

      {response && (
        <div style={{ 
          marginTop: "12px", 
          padding: "12px", 
          background: "rgba(255, 255, 255, 0.05)", 
          borderRadius: "12px", 
          color: "#e2e8f0", 
          fontSize: "14px", 
          lineHeight: "1.5",
          whiteSpace: "pre-wrap"
        }}>
          {response}
        </div>
      )}
    </div>
  );
};