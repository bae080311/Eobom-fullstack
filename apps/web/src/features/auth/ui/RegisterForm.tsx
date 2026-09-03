'use client';

import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { signupSchema, type SignupDto, UserRole } from '@eobom/shared';
import { useSendVerificationCode, useVerifyCode, useSignup } from '../model/useAuth';
import { ApiError } from '@/lib/api';
import type { Translate } from '@/shared/lib/i18n';

function createStep2Schema(t: Translate) {
  return z.object({
    email: z.email(t('invalidEmail')),
  });
}
type Step2Data = z.infer<ReturnType<typeof createStep2Schema>>;

function createStep3Schema(t: Translate) {
  return z
    .object({
      name: z.string().min(1, t('nameRequired')),
      password: z.string().min(8, t('passwordMinLength')),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t('passwordMismatch'),
      path: ['confirmPassword'],
    });
}
type Step3Data = z.infer<ReturnType<typeof createStep3Schema>>;

function createStep4Schema(t: Translate) {
  return z.discriminatedUnion('mode', [
    z.object({ mode: z.literal('CREATE'), name: z.string().min(1, t('orgNameRequired')) }),
    z.object({ mode: z.literal('JOIN'), joinCode: z.string().min(1, t('joinCodeRequired')) }),
  ]);
}
type Step4Data = z.infer<ReturnType<typeof createStep4Schema>>;

const TOTAL_STEPS = 4;

export function RegisterForm() {
  const t = useTranslations('features.auth');
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

  const step2Schema = useMemo(() => createStep2Schema(t), [t]);
  const step3Schema = useMemo(() => createStep3Schema(t), [t]);
  const step4Schema = useMemo(() => createStep4Schema(t), [t]);

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
            step2Form.setError('email', { message: t('emailAlreadyInUse') });
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
          step2Form.setError('email', { message: t('emailAlreadyInUse') });
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
          <p className="text-sm text-gray-600 text-center">{t('roleQuestion')}</p>
          <button
            type="button"
            onClick={() => handleRoleSelect(UserRole.THERAPIST)}
            className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-[#3D7A6B] active:scale-[0.98] transition-all text-left"
          >
            <p className="font-semibold text-gray-900">{t('roleTherapist')}</p>
            <p className="text-sm text-gray-600 mt-0.5">{t('roleTherapistDesc')}</p>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect(UserRole.PARENT)}
            className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-[#3D7A6B] active:scale-[0.98] transition-all text-left"
          >
            <p className="font-semibold text-gray-900">{t('roleParent')}</p>
            <p className="text-sm text-gray-600 mt-0.5">{t('roleParentDesc')}</p>
          </button>
        </div>
      )}

      {/* Step 2: 이메일 입력 */}
      {step === 2 && (
        <form onSubmit={step2Form.handleSubmit(handleStep2)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('emailLabel')}
            </label>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              {...step2Form.register('email')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
              placeholder="example@email.com"
            />
            {step2Form.formState.errors.email && (
              <p className="mt-1 text-xs text-danger-strong">
                {step2Form.formState.errors.email.message}
              </p>
            )}
          </div>

          {sendError && (
            <p className="text-sm text-danger-strong bg-danger-soft rounded-xl px-4 py-3">
              {sendError.message}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
            >
              {t('back')}
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="flex-[2] py-3 bg-[#3D7A6B] text-white rounded-xl font-medium text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
            >
              {isSending ? t('sendingCode') : t('sendCodeButton')}
            </button>
          </div>
        </form>
      )}

      {/* Step 2.5: OTP 인증 */}
      {step === 2.5 && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-600">{t('otpSentTo')}</p>
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
            <p className="text-sm text-danger-strong bg-danger-soft rounded-xl px-4 py-3 text-center">
              {verifyError.message}
            </p>
          )}
          {isVerifying && <p className="text-sm text-center text-gray-600">{t('verifying')}</p>}

          <button
            type="button"
            onClick={() => {
              setStep(2);
              setDigits(['', '', '', '', '', '']);
            }}
            className="w-full text-sm text-gray-600 text-center"
          >
            {t('reenterEmail')}
          </button>
        </div>
      )}

      {/* Step 3: 이름 / 비밀번호 */}
      {step === 3 && (
        <form onSubmit={step3Form.handleSubmit(handleStep3)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('nameLabel')}</label>
            <input
              type="text"
              autoComplete="name"
              {...step3Form.register('name')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
              placeholder={t('namePlaceholder')}
            />
            {step3Form.formState.errors.name && (
              <p className="mt-1 text-xs text-danger-strong">
                {step3Form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('passwordLabel')}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              {...step3Form.register('password')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
              placeholder={t('passwordPlaceholderHint')}
            />
            {step3Form.formState.errors.password && (
              <p className="mt-1 text-xs text-danger-strong">
                {step3Form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('confirmPasswordLabel')}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              {...step3Form.register('confirmPassword')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
              placeholder={t('confirmPasswordPlaceholder')}
            />
            {step3Form.formState.errors.confirmPassword && (
              <p className="mt-1 text-xs text-danger-strong">
                {step3Form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {signupError && role === UserRole.PARENT && (
            <p className="text-sm text-danger-strong bg-danger-soft rounded-xl px-4 py-3">
              {signupError.message}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
            >
              {t('back')}
            </button>
            <button
              type="submit"
              disabled={isSigningUp}
              className="flex-[2] py-3 bg-[#3D7A6B] text-white rounded-xl font-medium text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
            >
              {isSigningUp
                ? t('processing')
                : role === UserRole.THERAPIST
                  ? t('next')
                  : t('completeSignup')}
            </button>
          </div>
        </form>
      )}

      {/* Step 4: 기관 설정 (THERAPIST만) */}
      {step === 4 && (
        <form onSubmit={step4Form.handleSubmit(handleStep4)} className="space-y-4">
          <p className="text-sm text-gray-600 text-center">{t('setupOrgPrompt')}</p>

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
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {mode === 'CREATE' ? t('createOrgMode') : t('joinOrgMode')}
              </button>
            ))}
          </div>

          {orgMode === 'CREATE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orgNameLabel')}
              </label>
              <input
                type="text"
                {...step4Form.register('name' as 'mode')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm"
                placeholder={t('orgNamePlaceholder')}
              />
              {'name' in step4Form.formState.errors && (
                <p className="mt-1 text-xs text-danger-strong">
                  {(step4Form.formState.errors as { name?: { message?: string } }).name?.message}
                </p>
              )}
            </div>
          )}

          {orgMode === 'JOIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('joinCodeLabel')}
              </label>
              <input
                type="text"
                {...step4Form.register('joinCode' as 'mode')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D7A6B] text-sm uppercase"
                placeholder="ABCD1234"
              />
              {'joinCode' in step4Form.formState.errors && (
                <p className="mt-1 text-xs text-danger-strong">
                  {
                    (step4Form.formState.errors as { joinCode?: { message?: string } }).joinCode
                      ?.message
                  }
                </p>
              )}
            </div>
          )}

          {signupError && (
            <p className="text-sm text-danger-strong bg-danger-soft rounded-xl px-4 py-3">
              {signupError.message}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
            >
              {t('back')}
            </button>
            <button
              type="submit"
              disabled={isSigningUp}
              className="flex-[2] py-3 bg-[#3D7A6B] text-white rounded-xl font-medium text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
            >
              {isSigningUp ? t('signingUp') : t('completeSignup')}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-gray-600">
        {t('haveAccount')}{' '}
        <Link href="/login" className="text-[#3D7A6B] font-medium">
          {t('loginLink')}
        </Link>
      </p>
    </div>
  );
}
