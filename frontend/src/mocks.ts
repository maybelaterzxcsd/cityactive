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

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Аниме-сходка: Обсуждение нового сезона',
    description: 'Собираемся обсудить новый сезон аниме. Будет косплей-зона и викторина.',
    date: 'Сегодня, 18:00',
    location: 'Парк Горького, у фонтана',
    price: 0,
    maxParticipants: 30,
    participantsCount: 12,
    organizer: 'AnimeClub_KZN',
    category: 'anime',
    categoryRu: 'Аниме',
    ageRestriction: 16,
    needsVolunteers: false,
    distance: '1.2 км',
    image: null,
  },
  {
    id: '2',
    title: 'Вечер настольных игр',
    description: 'Играем в Catan, Мафию и другие настолки. Приносите свои игры!',
    date: 'Завтра, 19:00',
    location: 'Антикафе "Время"',
    price: 300,
    maxParticipants: 15,
    participantsCount: 8,
    organizer: 'BoardGameClub',
    category: 'boardgames',
    categoryRu: 'Настольные игры',
    ageRestriction: 12,
    needsVolunteers: true,
    distance: '3.5 км',
    image: null,
  },
  {
    id: '3',
    title: 'Волонтёрство в приюте для животных',
    description: 'Помогаем кормить и выгуливать собак. Нужны ответственные люди!',
    date: 'Суббота, 10:00',
    location: 'Приют "Дружок"',
    price: 0,
    maxParticipants: 20,
    participantsCount: 15,
    organizer: 'AnimalHelp',
    category: 'volunteering',
    categoryRu: 'Волонтёрство',
    ageRestriction: 14,
    needsVolunteers: true,
    distance: '5.2 км',
    image: null,
  },
];