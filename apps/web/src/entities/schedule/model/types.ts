export type SessionStatus = 'today' | 'upcoming' | 'past';

export interface Schedule {
  id: string;
  child: string;
  childAge: string;
  therapist: string;
  type: string;
  dateLabel: string;
  timeLabel: string;
  duration: string;
  location?: string;
  room: string;
  status: SessionStatus;
  notes?: string;
}

export interface UpcomingSession {
  id: string;
  day: string;
  date: string;
  time: string;
  type: string;
  child: string;
  therapist: string;
  status?: SessionStatus;
}

export interface WeekDay {
  dow: string;
  num: number;
  hasSession: boolean;
  today: boolean;
}

export interface NextSession {
  childName: string;
  therapistName: string;
  dateLabel: string;
  timeLabel: string;
  timeUntil: string;
  location?: string;
  type: string;
}
