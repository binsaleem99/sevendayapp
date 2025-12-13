export interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  isLocked?: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface User {
  name: string;
  email: string;
  hasPurchased: boolean;
  hasUpsell: boolean; // The 60 KWD meeting
  completedLessons: string[]; // IDs of completed lessons
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}