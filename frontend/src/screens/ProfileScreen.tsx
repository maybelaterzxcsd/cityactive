import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Award, Calendar, User, Clock, MapPin } from "lucide-react";
import { maxBridge } from "../utils/maxBridge";
import { Avatar, Button } from "@maxhub/max-ui";
import "./ProfileScreen.css";

const API_URL = "http://127.0.0.1:8000/api";

interface MyEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  role: "participant" | "volunteer" | string;
  badge_earned?: string;
  hours_earned?: number;
}

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Пользователь");
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);
  const [stats, setStats] = useState({
    eventsCount: 0,
    badgesCount: 0,
    hoursCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = maxBridge.getUserId();
    const name = maxBridge.getUserName();
    setUserName(name);

    const calculateStatsFromEvents = (events: MyEvent[]) => {
      setStats({
        eventsCount: events.length,
        badgesCount: events.filter((e) => e.badge_earned).length,
        hoursCount: events.reduce((sum, e) => sum + (e.hours_earned || 0), 0),
      });
    };

    fetch(`${API_URL}/profile?user_id=${encodeURIComponent(userId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Profile endpoint failed");
        return res.json();
      })
      .then((data) => {
        setStats({
          eventsCount: data.events_count ?? 0,
          badgesCount: data.badges?.length ?? 0,
          hoursCount: data.volunteer_hours ?? 0,
        });
        if (Array.isArray(data.events) && data.events.length > 0) {
          setMyEvents(data.events);
        } else {
          throw new Error("No events in profile, trying my-events");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Эндпоинт /profile недоступен, используем /my-events:", err);

        fetch(`${API_URL}/my-events?user_id=${encodeURIComponent(userId)}`)
          .then((res) => {
            if (!res.ok) throw new Error("My-events endpoint failed");
            return res.json();
          })
          .then((data) => {
            const events = data.events || data.my_events || data;
            if (Array.isArray(events) && events.length > 0) {
              setMyEvents(events);
              calculateStatsFromEvents(events);
            } else {
              throw new Error("No data");
            }
            setLoading(false);
          })
          .catch((err2) => {
            console.warn("Бэкенд недоступен, используем демо-данные:", err2);
            const demoEvents: MyEvent[] = [
              {
                id: "1",
                title: "Аниме-сходка: Обсуждение нового сезона",
                date: "Сегодня, 18:00",
                location: "Парк Горького",
                role: "participant",
                badge_earned: "Анимешник",
              },
              {
                id: "2",
                title: "Утренняя пробежка в парке",
                date: "Завтра, 08:00",
                location: "Центральный парк",
                role: "volunteer",
                badge_earned: "Волонтер",
                hours_earned: 2,
              },
              {
                id: "3",
                title: "Мастер-класс по керамике",
                date: "15 октября, 14:00",
                location: "Арт-пространство",
                role: "participant",
              },
            ];
            setMyEvents(demoEvents);
            calculateStatsFromEvents(demoEvents);
            setLoading(false);
          });
      });
  }, []);

  return (
    <div className="profile-screen">
      {/* ИСПРАВЛЕНО: profile-content теперь обертывает все, включая кнопку */}
      <div className="profile-content">
        
        <button className="profile-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Назад
        </button>

        <div className="profile-avatar-section">
          <Avatar.Container size={72} form="squircle">
            <Avatar.Image src="https://sun9-21.userapi.com/1N-rJz6-7hoTDW7MhpWe19e_R_TdGV6Wu5ZC0A/67o6-apnAks.jpg" />
          </Avatar.Container>
          <h2 className="profile-name">{userName}</h2>
          <p className="profile-status">ID: {maxBridge.getUserId()}</p>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)" }}>
              <Calendar size={24} color="#6366f1" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.eventsCount}</div>
              <div className="stat-label">Событий</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "rgba(245, 158, 11, 0.15)" }}>
              <Award size={24} color="#f59e0b" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.badgesCount}</div>
              <div className="stat-label">Бейджей</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "rgba(20, 184, 166, 0.15)" }}>
              <Clock size={24} color="#14b8a6" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.hoursCount}</div>
              <div className="stat-label">Часов</div>
            </div>
          </div>
        </div>

        <h3 className="profile-section-title">
          <Calendar size={20} /> Мои события
        </h3>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Загрузка...</p>
          </div>
        ) : myEvents.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} className="empty-state-icon" />
            <p className="empty-state-text">Вы пока не записаны ни на одно событие</p>
            <Button mode="primary" size="l" onClick={() => navigate("/")}>
              Найти событие
            </Button>
          </div>
        ) : (
          <div className="events-list">
            {myEvents.map((event) => {
              const isVolunteer = event.role?.toLowerCase() === "volunteer";

              return (
                <div
                  key={event.id}
                  className="event-card-profile"
                  onClick={() => navigate(`/event/${event.id}`)}
                >
                  <div className="event-card-header">
                    <h4 className="event-card-title">{event.title}</h4>
                    <span
                      className={`event-role-badge ${
                        isVolunteer
                          ? "event-role-badge--volunteer"
                          : "event-role-badge--participant"
                      }`}
                    >
                      {isVolunteer ? "🤝 Волонтер" : "👤 Участник"}
                    </span>
                  </div>

                  <div className="event-card-meta">
                    <div className="event-meta-row">
                      <Calendar size={14} />
                      <span>{event.date}</span>
                    </div>
                    <div className="event-meta-row">
                      <MapPin size={14} />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {(event.badge_earned || event.hours_earned) && (
                    <div className="event-badges">
                      {event.badge_earned && (
                        <div className="badge-item badge-item--earned">
                          <Award size={14} /> {event.badge_earned}
                        </div>
                      )}
                      {event.hours_earned && (
                        <div className="badge-item badge-item--hours">
                          <Clock size={14} /> +{event.hours_earned} ч
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};