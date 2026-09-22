export interface EventType {
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