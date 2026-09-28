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

  const handleAsk = async () => {
    if (!query.trim() || events.length === 0) return;

    setIsLoading(true);
    setResponse("");
    setError("");

    try {
      const res = await fetch(`${API_URL}/ai/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, events }),
      });

      const data = await res.json();

      // ИСПРАВЛЕНО: Сначала проверяем статус ответа
      if (!res.ok) {
        setError(data.detail || data.error || "Ошибка сервера при обработке запроса");
        return; // Прерываем выполнение, чтобы не вызывать .replace() у undefined
      }

      // ИСПРАВЛЕНО: Безопасная работа с ответом
      if (data.answer) {
        // Убираем служебные метки из текста для красивого отображения
        const cleanAnswer = data.answer.replace(/РЕКОМЕНДУЮ_\d+/g, "");
        setResponse(cleanAnswer);

        // Извлекаем ID рекомендованных событий (если бэкенд их вернул в таком формате)
        const recommendedIds = data.answer.match(/РЕКОМЕНДУЮ_(\d+)/g)?.map((id: string) => 
          id.replace("РЕКОМЕНДУЮ_", "")
        ) || [];
        
        onRecommend(recommendedIds);
      } else {
        setError("Не удалось получить ответ от AI-ассистента");
      }
    } catch (err) {
      console.error("AI Assistant error:", err);
      setError("Ошибка сети. Проверьте подключение к серверу.");
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
        Опишите, что вы ищете (например: "бесплатные события на выходные" или "мероприятия для волонтёров")
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