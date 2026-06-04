'use client';

import { useState } from 'react';
import type { UpdateProfileDto } from '@eobom/shared';
import type { UserWithProfile } from '@/entities/user';
import { useUpdateProfile } from '../model/useUpdateProfile';

interface Props {
  open: boolean;
  user: UserWithProfile;
  onClose: () => void;
}

export function EditProfileDialog({ open, user, onClose }: Props) {
  const isTherapist = user.role === 'THERAPIST';
  const [name, setName] = useState(user.name);
  const [phoneNumber, setPhoneNumber] = useState(user.parentProfile?.phoneNumber ?? '');
  const [licenseNumber, setLicenseNumber] = useState(user.therapistProfile?.licenseNumber ?? '');
  const { mutate, isPending, error } = useUpdateProfile();

  if (!open) return null;

  const inputCls =
    'rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto: UpdateProfileDto = { name };
    if (isTherapist) dto.licenseNumber = licenseNumber;
    else dto.phoneNumber = phoneNumber;
    mutate(dto, { onSuccess: onClose });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-5 pb-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 flex flex-col gap-4"
      >
        <h2 className="text-title3 font-bold tracking-tighter text-gray-900 m-0">프로필 수정</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-500 font-semibold">이름</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </label>

        {isTherapist ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-label text-gray-500 font-semibold">면허번호</span>
            <input
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className={inputCls}
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-label text-gray-500 font-semibold">전화번호</span>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              inputMode="tel"
              className={inputCls}
            />
          </label>
        )}

        {error && <p className="text-body2 text-danger m-0">{(error as Error).message}</p>}

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 bg-gray-100 text-gray-900 rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-brand text-white rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50"
          >
            {isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
