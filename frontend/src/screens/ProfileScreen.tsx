import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Calendar,
  LogOut,
  ChevronRight,
  Star,
  ArrowLeft,
  Award,
  Clock,
} from "lucide-react";
import { maxBridge } from "../utils/maxBridge";
import "./ProfileScreen.css";

const API_URL = "http://127.0.0.1:8000/api";

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const userId = maxBridge.getUserId(); // Берем ID через MAX Bridge
  const [myEventsCount, setMyEventsCount] = useState(0);
  const [volunteerHours, setVolunteerHours] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем данные (пока мок, пока Егор не сделает эндпоинт /profile)
    Promise.all([
      fetch(`${API_URL}/my-events`).then((res) => res.json()),
    ])
      .then(([eventsData]) => {
        setMyEventsCount(eventsData.length || 0);
        // ЗАГЛУШКА ДЛЯ ДЕМО:
        setVolunteerHours(12);
        setBadges(["🫶 Волонтёр", "🔥 Активист", "🎨 Творец"]);
      })
      .catch((err) => console.error("Error fetching profile data:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleLogout = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="profile-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="profile-screen"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button className="profile-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        <span>Назад</span>
      </button>

      <div className="profile-content">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            <span className="avatar-initials">А</span>
          </div>
          <h1 className="profile-name">Алинка</h1>
          <p className="profile-status">Активный участник ГородАктива</p>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--color-accent, #6366f1)" }}>
              <Calendar size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{myEventsCount}</span>
              <span className="stat-label">Записано событий</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "rgba(20, 184, 166, 0.1)", color: "#14b8a6" }}>
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{volunteerHours}</span>
              <span className="stat-label">Часов волонтёрства</span>
            </div>
          </div>
        </div>

        {badges.length > 0 && (
          <motion.div className="badges-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="badges-title"><Award size={20} /> Мои достижения</h2>
            <div className="badges-grid">
              {badges.map((badge, index) => (
                <motion.div key={index} className="badge-card" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + index * 0.1 }}>
                  <span className="badge-icon">{badge.split(" ")[0]}</span>
                  <span className="badge-name">{badge.split(" ").slice(1).join(" ")}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="profile-menu">
          <button className="menu-item" onClick={() => navigate("/my-events")}>
            <div className="menu-item-left">
              <Calendar size={20} />
              <span>Мои события</span>
            </div>
            <ChevronRight size={20} className="menu-arrow" />
          </button>

          <button className="menu-item menu-item--danger" onClick={handleLogout}>
            <div className="menu-item-left">
              <LogOut size={20} />
              <span>Выйти из аккаунта</span>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};