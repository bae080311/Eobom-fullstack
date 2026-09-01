import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockMutate = vi.fn();
vi.mock('@/entities/child', () => ({
  useSetPrimaryTherapist: () => ({ mutate: mockMutate, isPending: false }),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}));

import { ApiError } from '@/lib/api';
import { useSetPrimaryTherapistAction } from './useSetPrimaryTherapistAction';

describe('useSetPrimaryTherapistAction', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
  });

  it('submit 호출 시 childId·primaryTherapistId로 mutate가 호출된다', () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSetPrimaryTherapistAction('c1', onSuccess));

    act(() => result.current.submit('tp2'));

    expect(mockMutate.mock.calls[0][0]).toEqual({
      id: 'c1',
      dto: { primaryTherapistId: 'tp2' },
    });
  });

  it('성공 시 토스트를 보여주고 onSuccess를 호출한다', () => {
    mockMutate.mockImplementation((_, { onSuccess }) => onSuccess());
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSetPrimaryTherapistAction('c1', onSuccess));

    act(() => result.current.submit('tp2'));

    expect(mockToastSuccess).toHaveBeenCalledWith('담당 치료사가 변경되었습니다');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('실패 시 서버 에러 메시지를 toast로 보여준다', () => {
    mockMutate.mockImplementation((_, { onError }) =>
      onError(new ApiError('같은 기관 소속 치료사만 담당자로 지정할 수 있습니다.', 400)),
    );
    const { result } = renderHook(() => useSetPrimaryTherapistAction('c1', vi.fn()));

    act(() => result.current.submit('tp2'));

    expect(mockToastError).toHaveBeenCalledWith(
      '같은 기관 소속 치료사만 담당자로 지정할 수 있습니다.',
    );
  });

  it('ApiError가 아닌 에러는 기본 실패 메시지를 toast로 보여준다', () => {
    mockMutate.mockImplementation((_, { onError }) => onError(new Error('network down')));
    const { result } = renderHook(() => useSetPrimaryTherapistAction('c1', vi.fn()));

    act(() => result.current.submit('tp2'));

    expect(mockToastError).toHaveBeenCalledWith('담당 치료사 변경에 실패했습니다');
  });
});
