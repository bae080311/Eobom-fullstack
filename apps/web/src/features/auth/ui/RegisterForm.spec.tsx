import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/lib/api';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({ replace: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockSendCode = vi.fn();
const mockVerifyCode = vi.fn();
const mockSignup = vi.fn();

vi.mock('../model/useAuth', () => ({
  useSendVerificationCode: vi.fn(),
  useVerifyCode: vi.fn(),
  useSignup: vi.fn(),
}));

import { useSendVerificationCode, useVerifyCode, useSignup } from '../model/useAuth';
import { RegisterForm } from './RegisterForm';

function makeMutation(mutate = vi.fn()) {
  return { mutate, isPending: false, error: null } as unknown;
}

beforeEach(() => {
  vi.mocked(useSendVerificationCode).mockReturnValue(
    makeMutation(mockSendCode) as ReturnType<typeof useSendVerificationCode>,
  );
  vi.mocked(useVerifyCode).mockReturnValue(
    makeMutation(mockVerifyCode) as ReturnType<typeof useVerifyCode>,
  );
  vi.mocked(useSignup).mockReturnValue(makeMutation(mockSignup) as ReturnType<typeof useSignup>);
  mockSendCode.mockReset();
  mockVerifyCode.mockReset();
  mockSignup.mockReset();
});

describe('RegisterForm', () => {
  describe('Step 1 — 역할 선택', () => {
    it('renders therapist and parent role buttons', () => {
      render(<RegisterForm />);
      expect(screen.getByText('언어치료사')).toBeInTheDocument();
      expect(screen.getByText('학부모')).toBeInTheDocument();
    });

    it('shows email step after selecting 학부모', async () => {
      render(<RegisterForm />);
      await userEvent.click(screen.getByText('학부모'));
      expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument();
    });

    it('shows email step after selecting 언어치료사', async () => {
      render(<RegisterForm />);
      await userEvent.click(screen.getByText('언어치료사'));
      expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument();
    });
  });

  describe('Step 2 — 이메일 입력', () => {
    async function goToStep2() {
      render(<RegisterForm />);
      await userEvent.click(screen.getByText('학부모'));
    }

    it('calls sendCode on form submit with valid email', async () => {
      mockSendCode.mockImplementation((_dto, { onSuccess } = {}) => onSuccess?.());
      await goToStep2();
      await userEvent.type(screen.getByPlaceholderText('example@email.com'), 'user@test.com');
      await userEvent.click(screen.getByText('인증 코드 받기'));
      expect(mockSendCode).toHaveBeenCalledWith(
        { email: 'user@test.com' },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });

    it('shows field error when email field is empty', async () => {
      await goToStep2();
      await userEvent.click(screen.getByText('인증 코드 받기'));
      await waitFor(() => {
        expect(screen.getByText('올바른 이메일을 입력해주세요')).toBeInTheDocument();
      });
    });

    it('sets email field error on 409 conflict', async () => {
      mockSendCode.mockImplementation((_dto, { onError } = {}) =>
        onError?.(new ApiError('이미 사용 중인 이메일입니다.', 409)),
      );
      await goToStep2();
      await userEvent.type(screen.getByPlaceholderText('example@email.com'), 'taken@test.com');
      await userEvent.click(screen.getByText('인증 코드 받기'));
      await waitFor(() => {
        expect(screen.getByText('이미 사용 중인 이메일입니다.')).toBeInTheDocument();
      });
    });

    it('navigates back to step 1 on 이전 click', async () => {
      await goToStep2();
      await userEvent.click(screen.getByText('이전'));
      expect(screen.getByText('언어치료사')).toBeInTheDocument();
    });
  });

  describe('Step 2.5 — OTP 인증', () => {
    async function goToOtp() {
      render(<RegisterForm />);
      await userEvent.click(screen.getByText('학부모'));
      mockSendCode.mockImplementation((_dto, { onSuccess } = {}) => onSuccess?.());
      await userEvent.type(screen.getByPlaceholderText('example@email.com'), 'user@test.com');
      await userEvent.click(screen.getByText('인증 코드 받기'));
    }

    it('shows 6 OTP inputs after sendCode success', async () => {
      await goToOtp();
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThanOrEqual(6);
    });

    it('calls verifyCode when all 6 digits are entered', async () => {
      mockVerifyCode.mockImplementation((_dto, { onSuccess } = {}) =>
        onSuccess?.({ emailVerifiedToken: 'tok' }),
      );
      await goToOtp();
      const inputs = screen.getAllByRole('textbox');
      for (let i = 0; i < 6; i++) {
        fireEvent.change(inputs[i], { target: { value: String(i + 1) } });
      }
      await waitFor(() => {
        expect(mockVerifyCode).toHaveBeenCalledWith(
          { email: 'user@test.com', code: '123456' },
          expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
      });
    });

    it('moves to step 3 after successful OTP verification', async () => {
      mockVerifyCode.mockImplementation((_dto, { onSuccess } = {}) =>
        onSuccess?.({ emailVerifiedToken: 'tok' }),
      );
      await goToOtp();
      const inputs = screen.getAllByRole('textbox');
      for (let i = 0; i < 6; i++) {
        fireEvent.change(inputs[i], { target: { value: String(i + 1) } });
      }
      await waitFor(() => {
        expect(screen.getByPlaceholderText('홍길동')).toBeInTheDocument();
      });
    });

    it('clears digits on OTP verification failure', async () => {
      mockVerifyCode.mockImplementation((_dto, { onError } = {}) =>
        onError?.(new ApiError('잘못된 코드', 400)),
      );
      await goToOtp();
      const inputs = screen.getAllByRole('textbox');
      for (let i = 0; i < 6; i++) {
        fireEvent.change(inputs[i], { target: { value: String(i + 1) } });
      }
      await waitFor(() => {
        const allInputs = screen.getAllByRole('textbox') as HTMLInputElement[];
        const otpInputs = allInputs.filter((el) => el.maxLength === 1);
        const allEmpty = otpInputs.every((el) => el.value === '');
        expect(allEmpty).toBe(true);
      });
    });
  });

  describe('Step 3 — 이름 / 비밀번호', () => {
    async function goToStep3(role: '학부모' | '언어치료사' = '학부모') {
      render(<RegisterForm />);
      await userEvent.click(screen.getByText(role));
      mockSendCode.mockImplementation((_dto, { onSuccess } = {}) => onSuccess?.());
      await userEvent.type(screen.getByPlaceholderText('example@email.com'), 'user@test.com');
      await userEvent.click(screen.getByText('인증 코드 받기'));
      mockVerifyCode.mockImplementation((_dto, { onSuccess } = {}) =>
        onSuccess?.({ emailVerifiedToken: 'tok' }),
      );
      const inputs = screen.getAllByRole('textbox');
      for (let i = 0; i < 6; i++) {
        fireEvent.change(inputs[i], { target: { value: String(i + 1) } });
      }
      await waitFor(() => {
        expect(screen.getByPlaceholderText('홍길동')).toBeInTheDocument();
      });
    }

    it('shows validation error when name is empty', async () => {
      await goToStep3();
      await userEvent.click(screen.getByText('가입 완료'));
      await waitFor(() => {
        expect(screen.getByText('이름을 입력해주세요')).toBeInTheDocument();
      });
    });

    it('shows validation error when password is too short', async () => {
      await goToStep3();
      await userEvent.type(screen.getByPlaceholderText('홍길동'), 'Alice');
      await userEvent.type(screen.getByPlaceholderText('8자 이상'), 'short');
      await userEvent.click(screen.getByText('가입 완료'));
      await waitFor(() => {
        expect(screen.getByText('비밀번호는 8자 이상이어야 합니다')).toBeInTheDocument();
      });
    });

    it('PARENT role calls signup on step 3 submit', async () => {
      mockSignup.mockImplementation((_dto, _opts) => {});
      await goToStep3('학부모');
      await userEvent.type(screen.getByPlaceholderText('홍길동'), 'Alice');
      await userEvent.type(screen.getByPlaceholderText('8자 이상'), 'password123');
      await userEvent.type(
        screen.getByPlaceholderText('비밀번호를 다시 입력하세요'),
        'password123',
      );
      await userEvent.click(screen.getByText('가입 완료'));
      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Alice', role: 'PARENT' }),
          expect.anything(),
        );
      });
    });

    it('THERAPIST role moves to step 4 on step 3 submit', async () => {
      await goToStep3('언어치료사');
      await userEvent.type(screen.getByPlaceholderText('홍길동'), 'Alice');
      await userEvent.type(screen.getByPlaceholderText('8자 이상'), 'password123');
      await userEvent.type(
        screen.getByPlaceholderText('비밀번호를 다시 입력하세요'),
        'password123',
      );
      await userEvent.click(screen.getByText('다음'));
      await waitFor(() => {
        expect(screen.getByText('새 기관 만들기')).toBeInTheDocument();
      });
    });
  });

  describe('Step 4 — 기관 설정', () => {
    async function goToStep4() {
      render(<RegisterForm />);
      await userEvent.click(screen.getByText('언어치료사'));
      mockSendCode.mockImplementation((_dto, { onSuccess } = {}) => onSuccess?.());
      await userEvent.type(screen.getByPlaceholderText('example@email.com'), 'user@test.com');
      await userEvent.click(screen.getByText('인증 코드 받기'));
      mockVerifyCode.mockImplementation((_dto, { onSuccess } = {}) =>
        onSuccess?.({ emailVerifiedToken: 'tok' }),
      );
      const inputs = screen.getAllByRole('textbox');
      for (let i = 0; i < 6; i++) {
        fireEvent.change(inputs[i], { target: { value: String(i + 1) } });
      }
      await waitFor(() => expect(screen.getByPlaceholderText('홍길동')).toBeInTheDocument());
      await userEvent.type(screen.getByPlaceholderText('홍길동'), 'Alice');
      await userEvent.type(screen.getByPlaceholderText('8자 이상'), 'password123');
      await userEvent.type(
        screen.getByPlaceholderText('비밀번호를 다시 입력하세요'),
        'password123',
      );
      await userEvent.click(screen.getByText('다음'));
      await waitFor(() => expect(screen.getByText('새 기관 만들기')).toBeInTheDocument());
    }

    it('shows CREATE org input by default', async () => {
      await goToStep4();
      expect(screen.getByPlaceholderText('예: 행복 언어치료센터')).toBeInTheDocument();
    });

    it('toggles to JOIN mode and shows joinCode input', async () => {
      await goToStep4();
      await userEvent.click(screen.getByText('코드로 참여'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('ABCD1234')).toBeInTheDocument();
      });
    });

    it('calls signup with CREATE org on 가입 완료', async () => {
      mockSignup.mockImplementation(() => {});
      await goToStep4();
      await userEvent.type(screen.getByPlaceholderText('예: 행복 언어치료센터'), 'My Clinic');
      await userEvent.click(screen.getByText('가입 완료'));
      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'THERAPIST',
            organization: expect.objectContaining({ mode: 'CREATE', name: 'My Clinic' }),
          }),
          expect.anything(),
        );
      });
    });
  });
});
