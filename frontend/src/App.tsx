import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import { EventDetailScreen } from './screens/EventDetailScreen';
import { MyEventsScreen } from './screens/MyEventsScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/event/:id" element={<EventDetailScreen />} />
        <Route path="/my-events" element={<MyEventsScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;