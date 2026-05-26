import type { Schedule, UpcomingSession, WeekDay, NextSession } from './types';

export const MOCK_NEXT_SESSION: NextSession = {
  childName:     '도윤',
  therapistName: '정유진 치료사',
  dateLabel:     '오늘 5월 22일 (목)',
  timeLabel:     '오후 2:00',
  timeUntil:     '2시간 18분 뒤',
  location:      '1치료실 · 마포구 서교동',
  type:          '개별 언어치료',
};

export const MOCK_SCHEDULES: Record<string, Schedule> = {
  s1: {
    id: 's1', child: '도윤', childAge: '만 5세', therapist: '정유진 치료사',
    type: '개별 언어치료', dateLabel: '5월 22일 (목)', timeLabel: '오후 2:00 – 2:40',
    duration: '40분', location: '마포구 서교동', room: '1치료실', status: 'today',
    notes: '지난 시간에는 어두운 받침의 발음을 중점적으로 연습했어요. 도윤이가 집중을 잘 해서 의외로 빠르게 진전이 있었습니다. 이번 시간에는 ㄱ·ㅂ 받침을 단어 단위로 확장해 볼게요.',
  },
  s2: {
    id: 's2', child: '지호', childAge: '만 4세', therapist: '정유진 치료사',
    type: '유창성 치료', dateLabel: '5월 23일 (금)', timeLabel: '오후 3:30 – 4:10',
    duration: '40분', location: '마포구 서교동', room: '1치료실', status: 'upcoming',
  },
  s3: {
    id: 's3', child: '서아', childAge: '만 6세', therapist: '정유진 치료사',
    type: '개별 언어치료', dateLabel: '5월 24일 (토)', timeLabel: '오전 10:00 – 10:50',
    duration: '50분', location: '마포구 서교동', room: '2치료실', status: 'upcoming',
  },
  s4: {
    id: 's4', child: '하린', childAge: '만 5세', therapist: '정유진 치료사',
    type: '개별 언어치료', dateLabel: '5월 26일 (월)', timeLabel: '오전 11:00 – 11:40',
    duration: '40분', location: '마포구 서교동', room: '1치료실', status: 'upcoming',
  },
  s5: {
    id: 's5', child: '도윤', childAge: '만 5세', therapist: '정유진 치료사',
    type: '개별 언어치료', dateLabel: '5월 28일 (수)', timeLabel: '오후 2:00 – 2:40',
    duration: '40분', location: '마포구 서교동', room: '1치료실', status: 'upcoming',
  },
  s6: {
    id: 's6', child: '도윤', childAge: '만 5세', therapist: '정유진 치료사',
    type: '개별 언어치료', dateLabel: '5월 19일 (월)', timeLabel: '오후 2:00 – 2:40',
    duration: '40분', location: '마포구 서교동', room: '1치료실', status: 'past',
  },
  s7: {
    id: 's7', child: '지호', childAge: '만 4세', therapist: '정유진 치료사',
    type: '유창성 치료', dateLabel: '5월 21일 (수)', timeLabel: '오후 3:30 – 4:10',
    duration: '40분', location: '마포구 서교동', room: '1치료실', status: 'past',
  },
};

export const MOCK_UPCOMING: UpcomingSession[] = [
  { id: 's1', day: '목', date: '22', time: '14:00', type: '개별 언어치료', child: '도윤', therapist: '정유진 치료사', status: 'today' },
  { id: 's2', day: '금', date: '23', time: '15:30', type: '유창성 치료',   child: '지호', therapist: '정유진 치료사', status: 'upcoming' },
  { id: 's3', day: '토', date: '24', time: '10:00', type: '개별 언어치료', child: '서아', therapist: '정유진 치료사', status: 'upcoming' },
  { id: 's4', day: '월', date: '26', time: '11:00', type: '개별 언어치료', child: '하린', therapist: '정유진 치료사', status: 'upcoming' },
  { id: 's5', day: '수', date: '28', time: '14:00', type: '개별 언어치료', child: '도윤', therapist: '정유진 치료사', status: 'upcoming' },
  { id: 's6', day: '월', date: '19', time: '14:00', type: '개별 언어치료', child: '도윤', therapist: '정유진 치료사', status: 'past' },
  { id: 's7', day: '수', date: '21', time: '15:30', type: '유창성 치료',   child: '지호', therapist: '정유진 치료사', status: 'past' },
];

export const MOCK_WEEK: WeekDay[] = [
  { dow: '월', num: 19, hasSession: true,  today: false },
  { dow: '화', num: 20, hasSession: false, today: false },
  { dow: '수', num: 21, hasSession: true,  today: false },
  { dow: '목', num: 22, hasSession: true,  today: true  },
  { dow: '금', num: 23, hasSession: false, today: false },
  { dow: '토', num: 24, hasSession: true,  today: false },
  { dow: '일', num: 25, hasSession: false, today: false },
];
