import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import { EventDetailScreen } from './screens/EventDetailScreen';
import { MyEventsScreen } from './screens/MyEventsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { maxBridge } from './utils/maxBridge';

// Компонент-обёртка для обработки диплинков
const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Инициализация MAX Bridge
    maxBridge.ready();
    maxBridge.expand();

    // Проверяем диплинк из MAX (start_param)
    const startParam = maxBridge.getStartParam();
    if (startParam) {
      console.log('📡 MAX Bridge: открыто по диплинку с параметром:', startParam);
      // Если start_param = "event_123", переходим на событие
      if (startParam.startsWith('event_')) {
        const eventId = startParam.replace('event_', '');
        navigate(`/event/${eventId}`, { replace: true });
      }
    }

    // Также проверяем обычный URL-параметр ?event_id=
    const params = new URLSearchParams(location.search);
    const eventId = params.get('event_id');
    if (eventId) {
      navigate(`/event/${eventId}`, { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/event/:id" element={<EventDetailScreen />} />
      <Route path="/my-events" element={<MyEventsScreen />} />
      <Route path="/profile" element={<ProfileScreen />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;