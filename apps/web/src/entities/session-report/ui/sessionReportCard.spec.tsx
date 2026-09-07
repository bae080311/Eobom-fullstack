import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { SessionReportResponseDto } from '@eobom/shared';

import { SessionReportCard } from './sessionReportCard';
import { createTestTranslator } from '@/test/createTestTranslator';
import ko from '../../../../messages/ko.json';

const t = createTestTranslator(ko.entities.sessionReport);

// KST 14:00 = UTC 05:00
function makeReport(overrides: Partial<SessionReportResponseDto> = {}): SessionReportResponseDto {
  return {
    id: 'r1',
    scheduleId: 's1',
    rawMemo: '/ㄹ/ 조음 훈련 10분, 종성 탈락 잔존',
    summary: '오늘은 ㄹ 발음 연습을 중심으로 진행했어요',
    activities: ['ㄹ 발음 연습', '문장 따라말하기'],
    progress: '초성 정확도가 지난주보다 올라왔어요.',
    homework: '하루 5분씩 그림카드로 연습해주세요',
    nextGoal: '두 음절 단어에서 ㄹ 발음 안정화',
    tone: 'positive',
    promptVersion: 'report-v1',
    createdAt: '2026-06-19T05:00:00.000Z',
    updatedAt: '2026-06-19T05:00:00.000Z',
    ...overrides,
  };
}

describe('SessionReportCard', () => {
  it('요약·진행 상황·다음 목표를 표시한다', () => {
    render(<SessionReportCard report={makeReport()} t={t} />);
    expect(screen.getByText('오늘은 ㄹ 발음 연습을 중심으로 진행했어요')).toBeInTheDocument();
    expect(screen.getByText('초성 정확도가 지난주보다 올라왔어요.')).toBeInTheDocument();
    expect(screen.getByText('두 음절 단어에서 ㄹ 발음 안정화')).toBeInTheDocument();
  });

  it('활동 목록을 항목별로 표시한다', () => {
    render(<SessionReportCard report={makeReport()} t={t} />);
    expect(screen.getByText('ㄹ 발음 연습')).toBeInTheDocument();
    expect(screen.getByText('문장 따라말하기')).toBeInTheDocument();
  });

  it('치료사 원본 메모(rawMemo)는 노출하지 않는다', () => {
    render(<SessionReportCard report={makeReport()} t={t} />);
    expect(screen.queryByText(/조음 훈련 10분/)).not.toBeInTheDocument();
  });

  it('톤 배지를 한국어 라벨로 표시한다', () => {
    render(<SessionReportCard report={makeReport({ tone: 'needs_attention' })} t={t} />);
    expect(screen.getByText('관심이 필요해요')).toBeInTheDocument();
  });

  it('계약에 없는 톤 값이 와도 neutral 라벨로 렌더링한다', () => {
    render(<SessionReportCard report={makeReport({ tone: 'unexpected' })} t={t} />);
    expect(screen.getByText('무난해요')).toBeInTheDocument();
  });

  it('homework가 있으면 가정 연습 섹션을 표시한다', () => {
    render(<SessionReportCard report={makeReport()} t={t} />);
    expect(screen.getByText('집에서 함께 해보세요')).toBeInTheDocument();
    expect(screen.getByText('하루 5분씩 그림카드로 연습해주세요')).toBeInTheDocument();
  });

  it('homework가 null이면 가정 연습 섹션을 렌더링하지 않는다', () => {
    render(<SessionReportCard report={makeReport({ homework: null })} t={t} />);
    expect(screen.queryByText('집에서 함께 해보세요')).not.toBeInTheDocument();
  });

  it('activities가 비어 있으면 활동 섹션을 렌더링하지 않는다', () => {
    render(<SessionReportCard report={makeReport({ activities: [] })} t={t} />);
    expect(screen.queryByText('오늘 한 활동')).not.toBeInTheDocument();
  });

  it('작성 시각을 KST 기준으로 표시한다', () => {
    render(<SessionReportCard report={makeReport()} t={t} />);
    expect(screen.getByText('6월 19일 (금) 14:00 작성')).toBeInTheDocument();
  });
});
