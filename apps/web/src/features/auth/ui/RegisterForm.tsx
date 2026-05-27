'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { z } from 'zod';
import { signupSchema, type SignupDto, UserRole } from '@eobom/shared';
import { useSendVerificationCode, useVerifyCode, useSignup } from '../model/useAuth';
import { ApiError } from '@/lib/api';

const step2Schema = z.object({
  email: z.email('올바른 이메일을 입력해주세요'),
});
type Step2Data = z.infer<typeof step2Schema>;

const step3Schema = z
  .object({
    name: z.string().min(1, '이름을 입력해주세요'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });
type Step3Data = z.infer<typeof step3Schema>;

const step4Schema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('CREATE'), name: z.string().min(1, '기관 이름을 입력해주세요') }),
  z.object({ mode: z.literal('JOIN'), joinCode: z.string().min(1, '참여 코드를 입력해주세요') }),
]);
type Step4Data = z.infer<typeof step4Schema>;

const TOTAL_STEPS = 4;

export function RegisterForm() {
  const [step, setStep] = useState<1 | 2 | 2.5 | 3 | 4>(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [emailVerifiedToken, setEmailVerifiedToken] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [orgMode, setOrgMode] = useState<'CREATE' | 'JOIN'>('CREATE');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { mutate: sendCode, isPending: isSending, error: sendError } = useSendVerificationCode();
  const { mutate: verifyCode, isPending: isVerifying, error: verifyError } = useVerifyCode();
  const { mutate: signup, isPending: isSigningUp, error: signupError } = useSignup();

  const step2Form = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });
  const step3Form = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });
  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: { mode: 'CREATE', name: '' },
  });

  const displayStep = step === 2.5 ? 2 : Number(step);
  const totalDisplaySteps = role === UserRole.THERAPIST ? TOTAL_STEPS : TOTAL_STEPS - 1;

  function handleRoleSelect(selected: UserRole) {
    setRole(selected);
    setStep(2);
  }

  function handleStep2(data: Step2Data) {
    sendCode(
      { email: data.email },
      {
        onSuccess() {
          setVerifiedEmail(data.email);
          setStep(2.5);
        },
        onError(err) {
          if (err instanceof ApiError && err.status === 409) {
            step2Form.setError('email', { message: '이미 사용 중인 이메일입니다.' });
          }
        },
      },
    );
  }

  function handleOtpChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < 5) inputRefs.current[index + 1]?.focus();

    const code = next.join('');
    if (code.length === 6) {
      verifyCode(
        { email: verifiedEmail, code },
        {
          onSuccess(data) {
            setEmailVerifiedToken(data.emailVerifiedToken);
            setStep(3);
          },
          onError() {
            setDigits(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
          },
        },
      );
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) {
      verifyCode(
        { email: verifiedEmail, code: pasted },
        {
          onSuccess(data) {
            setEmailVerifiedToken(data.emailVerifiedToken);
            setStep(3);
          },
          onError() {
            setDigits(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
          },
        },
      );
    }
  }

  function handleStep3(data: Step3Data) {
    if (role === UserRole.THERAPIST) {
      setStep(4);
    } else {
      submitSignup(data, undefined);
    }
  }

  function handleStep4(data: Step4Data) {
    if (!step3Form.getValues()) return;
    submitSignup(step3Form.getValues(), data);
  }

  function submitSignup(s3: Step3Data, org: Step4Data | undefined) {
    if (!role) return;
    const dto: SignupDto = {
      emailVerifiedToken,
      password: s3.password,
      name: s3.name,
      role,
      ...(org ? { organization: org } : {}),
    };
    const parsed = signupSchema.safeParse(dto);
    if (!parsed.success) return;
    signup(parsed.data, {
      onError(err) {
        if (err instanceof ApiError && err.status === 409) {
          step2Form.setError('email', { message: '이미 사용 중인 이메일입니다.' });
          setStep(2);
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      {step !== 1 && (
        <div className="flex items-center gap-2">
          {Array.from({ length: totalDisplaySteps }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full transition-colors ${
                n <= displayStep ? 'bg-[#3D7A6B]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* Step 1: 역할 선택 */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 text-center">어떤 역할로 가입하시나요?</p>
          <button
            type="button"
            onClick={() => handleRoleSelect(UserRole.THERAPIST)}
            className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-[#3D7A6B] active:scale-[0.98] transition-all text-left"
          >
            <p className="font-semibold text-gray-900">언어치료사</p>
            <p className="text-sm text-gray-500 mt-0.5">기관을 만들거나 기존 기관에 참여합니다</p>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect(UserRole.PARENT)}
            className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-[#3D7A6B] active:scale-[0.98] transition-all text-left"
          >
            <p className="font-semibold text-gray-900">학부모</p>
            <p className="text-sm text-gray-500 mt-0.5">치료사의 초대 코드로 연결됩니다</p>
          </button>
        </div>
      )}

      {/* Step 2: 이메일 입력 */}
      {step === 2 && (
        <form onSubmit={step2Form.handleSubmit(handleStep2)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              {...step2Form.register('email')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
              placeholder="example@email.com"
            />
            {step2Form.formState.errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {step2Form.formState.errors.email.message}
              </p>
            )}
          </div>

          {sendError && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
              {sendError.message}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
            >
              이전
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="flex-[2] py-3 bg-[#3D7A6B] text-white rounded-xl font-medium text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
            >
              {isSending ? '발송 중...' : '인증 코드 받기'}
            </button>
          </div>
        </form>
      )}

      {/* Step 2.5: OTP 인증 */}
      {step === 2.5 && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-500">아래 주소로 인증 코드를 발송했습니다</p>
            <p className="text-sm font-medium text-gray-900">{verifiedEmail}</p>
          </div>

          <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                autoFocus={i === 0}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#3D7A6B] transition-colors"
              />
            ))}
          </div>

          {verifyError && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 text-center">
              {verifyError.message}
            </p>
          )}
          {isVerifying && <p className="text-sm text-center text-gray-400">인증 중...</p>}

          <button
            type="button"
            onClick={() => {
              setStep(2);
              setDigits(['', '', '', '', '', '']);
            }}
            className="w-full text-sm text-gray-500 text-center"
          >
            이메일 다시 입력하기
          </button>
        </div>
      )}

      {/* Step 3: 이름 / 비밀번호 */}
      {step === 3 && (
        <form onSubmit={step3Form.handleSubmit(handleStep3)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              type="text"
              autoComplete="name"
              {...step3Form.register('name')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
              placeholder="홍길동"
            />
            {step3Form.formState.errors.name && (
              <p className="mt-1 text-xs text-red-500">{step3Form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              autoComplete="new-password"
              {...step3Form.register('password')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
              placeholder="8자 이상"
            />
            {step3Form.formState.errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {step3Form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
            <input
              type="password"
              autoComplete="new-password"
              {...step3Form.register('confirmPassword')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
              placeholder="비밀번호를 다시 입력하세요"
            />
            {step3Form.formState.errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {step3Form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {signupError && role === UserRole.PARENT && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
              {signupError.message}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
            >
              이전
            </button>
            <button
              type="submit"
              disabled={isSigningUp}
              className="flex-[2] py-3 bg-[#3D7A6B] text-white rounded-xl font-medium text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
            >
              {isSigningUp ? '처리 중...' : role === UserRole.THERAPIST ? '다음' : '가입 완료'}
            </button>
          </div>
        </form>
      )}

      {/* Step 4: 기관 설정 (THERAPIST만) */}
      {step === 4 && (
        <form onSubmit={step4Form.handleSubmit(handleStep4)} className="space-y-4">
          <p className="text-sm text-gray-500 text-center">기관을 설정해주세요</p>

          <div className="flex gap-2">
            {(['CREATE', 'JOIN'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setOrgMode(mode);
                  step4Form.reset(
                    mode === 'CREATE'
                      ? { mode: 'CREATE', name: '' }
                      : { mode: 'JOIN', joinCode: '' },
                  );
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                  orgMode === mode
                    ? 'border-[#3D7A6B] text-[#3D7A6B] bg-[#3D7A6B]/5'
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                {mode === 'CREATE' ? '새 기관 만들기' : '코드로 참여'}
              </button>
            ))}
          </div>

          {orgMode === 'CREATE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">기관 이름</label>
              <input
                type="text"
                {...step4Form.register('name' as 'mode')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
                placeholder="예: 행복 언어치료센터"
              />
              {'name' in step4Form.formState.errors && (
                <p className="mt-1 text-xs text-red-500">
                  {(step4Form.formState.errors as { name?: { message?: string } }).name?.message}
                </p>
              )}
            </div>
          )}

          {orgMode === 'JOIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">참여 코드</label>
              <input
                type="text"
                {...step4Form.register('joinCode' as 'mode')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm uppercase"
                placeholder="ABCD1234"
              />
              {'joinCode' in step4Form.formState.errors && (
                <p className="mt-1 text-xs text-red-500">
                  {
                    (step4Form.formState.errors as { joinCode?: { message?: string } }).joinCode
                      ?.message
                  }
                </p>
              )}
            </div>
          )}

          {signupError && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
              {signupError.message}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
            >
              이전
            </button>
            <button
              type="submit"
              disabled={isSigningUp}
              className="flex-[2] py-3 bg-[#3D7A6B] text-white rounded-xl font-medium text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
            >
              {isSigningUp ? '가입 중...' : '가입 완료'}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-[#3D7A6B] font-medium">
          로그인
        </Link>
      </p>
    </div>
  );
}
