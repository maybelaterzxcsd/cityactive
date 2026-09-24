export interface Event {
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
  categoryRu: string; // НОВОЕ ПОЛЕ
  ageRestriction: number;
  needsVolunteers: boolean;
  distance: string;
  image: string | null;
}