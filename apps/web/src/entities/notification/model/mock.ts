import type { Notification } from './types';

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'pn1', type: 'note', group: '오늘',
    title: '정유진 치료사가 수업 노트를 보냈어요',
    sub: '5월 19일 (월) 수업 · 발음 연습 가이드 첨부',
    time: '30분 전', unread: true,
  },
  {
    id: 'pn2', type: 'reschedule', group: '오늘',
    title: '다음 주 일정이 조정되었어요',
    sub: '5월 28일 (수) 14:00 → 5월 28일 (수) 15:00',
    time: '1시간 전', unread: true,
  },
  {
    id: 'pn3', type: 'confirm', group: '오늘',
    title: '오늘 일정 확인이 완료되었어요',
    sub: '도윤 · 오늘 14:00 · 개별 언어치료',
    time: '3시간 전', unread: false,
  },
  {
    id: 'pn4', type: 'confirm', group: '어제',
    title: '5월 21일 일정 확인을 요청했어요',
    sub: '지호 · 5월 21일 (수) 15:30 · 유창성 치료',
    time: '어제', unread: false,
  },
  {
    id: 'pn5', type: 'note', group: '이전',
    title: '정유진 치료사가 수업 노트를 보냈어요',
    sub: '5월 19일 (월) 수업 · 발음 교정 피드백',
    time: '2일 전', unread: false,
  },
  {
    id: 'pn6', type: 'confirm', group: '이전',
    title: '5월 19일 일정 확인이 완료되었어요',
    sub: '도윤 · 5월 19일 (월) 14:00 · 개별 언어치료',
    time: '3일 전', unread: false,
  },
];

export const MOCK_PARENT_NOTIFICATIONS = MOCK_NOTIFICATIONS.slice(0, 3);
