interface EventType {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  distance: string;
  price: number;
  ageRestriction: number;
  needsVolunteers: boolean;
  participantsCount: number;
  maxParticipants: number;
  image: string;
  description: string;
  organizer: string;
}

export const mockEvents: EventType[] = [
  {
    id: '1',
    title: 'Аниме-сходка: Обсуждение нового сезона',
    category: 'anime',
    date: 'Сегодня, 18:00',
    location: 'Парк Горького, у фонтана',
    distance: '500м',
    price: 0,
    ageRestriction: 16,
    needsVolunteers: true,
    participantsCount: 12,
    maxParticipants: 30,
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80',
    description: 'Собираемся обсудить новый сезон аниме. Будет косплей-зона и викторина.',
    organizer: 'AnimeClub_KZN'
  },
  {
    id: '2',
    title: 'Турнир по настольным играм',
    category: 'boardgames',
    date: 'Завтра, 15:00',
    location: 'Коворкинг "Точка"',
    distance: '1.2км',
    price: 300,
    ageRestriction: 12,
    needsVolunteers: false,
    participantsCount: 8,
    maxParticipants: 10,
    image: 'https://images.unsplash.com/photo-1610890716171-6b1c9f2bd40c?w=800&q=80',
    description: 'Играем в Catan, Каркассон и Мафию. Для новичков — обучение.',
    organizer: 'BoardGame_KZN'
  },
  {
    id: '3',
    title: 'Помощь приюту для животных',
    category: 'volunteering',
    date: 'Суббота, 10:00',
    location: 'Приют "Хвостатый друг"',
    distance: '3.5км',
    price: 0,
    ageRestriction: 14,
    needsVolunteers: true,
    participantsCount: 5,
    maxParticipants: 20,
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
    description: 'Гуляем с собаками, помогаем с уборкой. Волонтёрские часы фиксируются!',
    organizer: 'Хвостатый друг'
  }
];

export type { EventType };