'use client';

import { useCallback, useEffect, useId, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface Options {
  open: boolean;
  /** Escape·바깥 클릭으로 닫는 경로. */
  onClose: () => void;
  /** 처리 중이라 닫으면 안 되는 상태 (isPending·loading). */
  locked?: boolean;
}

/**
 * 모달 셸의 포커스 수명주기를 한곳에서 담당한다.
 *
 * 열릴 때 첫 요소로 포커스 이동 · Tab을 모달 안에 가둠 · Escape로 닫기 ·
 * 닫힐 때 열었던 요소로 포커스 복귀. `titleId`는 제목 `<h2>`와
 * 래퍼의 `aria-labelledby`를 이어 다이얼로그에 접근성 이름을 준다.
 */
export function useModalDialog({ open, onClose, locked = false }: Options) {
  const ref = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    // 모달을 연 요소를 기억해 두었다가 닫힐 때 그 자리로 돌려준다.
    restoreRef.current = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    return () => restoreRef.current?.focus();
  }, [open]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!locked) onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!items?.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [locked, onClose],
  );

  return { ref, titleId, onKeyDown };
}
