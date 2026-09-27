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
} from "lucide-react";
import "./ProfileScreen.css";

const API_URL = "http://127.0.0.1:8000/api";

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const [myEventsCount, setMyEventsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/my-events`)
      .then((res) => res.json())
      .then((data) => {
        setMyEventsCount(data.length);
      })
      .catch((err) => console.error("Error fetching profile data:", err))
      .finally(() => setLoading(false));
  }, []);

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
            <div
              className="stat-icon"
              style={{
                background: "rgba(99, 102, 241, 0.1)",
                color: "var(--color-accent)",
              }}
            >
              <Calendar size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{myEventsCount}</span>
              <span className="stat-label">Записано событий</span>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                color: "var(--color-warning)",
              }}
            >
              <Star size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">0</span>
              <span className="stat-label">Посещено</span>
            </div>
          </div>
        </div>

        <div className="profile-menu">
          <button className="menu-item" onClick={() => navigate("/my-events")}>
            <div className="menu-item-left">
              <Calendar size={20} />
              <span>Мои события</span>
            </div>
            <ChevronRight size={20} className="menu-arrow" />
          </button>

          <button className="menu-item">
            <div className="menu-item-left">
              <User size={20} />
              <span>Настройки аккаунта</span>
            </div>
            <ChevronRight size={20} className="menu-arrow" />
          </button>

          <button
            className="menu-item menu-item--danger"
            onClick={handleLogout}
          >
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
