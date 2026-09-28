import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { maxBridge } from './utils/maxBridge';

// Импортируй свои экраны здесь (проверь, что пути правильные!)
import { HomeScreen } from './screens/HomeScreen'; 
import { EventDetailScreen } from './screens/EventDetailScreen';
// import { ProfileScreen } from './screens/ProfileScreen'; // Раскомментируй, если есть

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/event/:id" element={<EventDetailScreen />} />
      {/* <Route path="/profile" element={<ProfileScreen />} /> */}
    </Routes>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Безопасный вызов внутри try-catch. Если MAX нет, приложение ВСЁ РАВНО ЗАРАБОТАЕТ.
    try {
      maxBridge.ready();
      maxBridge.expand();
    } catch (error) {
      console.warn('MAX Bridge не доступен, работаем в обычном режиме');
    }
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;