'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { UserWithProfile } from '@/entities/user';
import { useLogout } from '@/features/auth';
import { EditProfileDialog } from '@/features/edit-profile';
import { ConfirmDialog, IconChevronRight, IconShield, IconFileText } from '@/shared/ui';
import { formatDateLabel } from '@/shared/lib/date';

interface Props {
  user: UserWithProfile;
  isOwner?: boolean;
}

const CARD = 'rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <span className="text-body text-gray-600 font-medium">{label}</span>
      <span className="text-body text-gray-900 font-semibold tracking-tight text-right">
        {value}
      </span>
    </div>
  );
}

export function MyInfoView({ user, isOwner }: Props) {
  const t = useTranslations('widgets.myInfo');
  const [editOpen, setEditOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { mutate: logout, isPending } = useLogout();

  const isTherapist = user.role === 'THERAPIST';
  const roleLabel = isTherapist ? t('roleTherapist') : t('roleParent');
  const profileLabel = isTherapist ? t('licenseNumberLabel') : t('phoneNumberLabel');
  const profileValue = isTherapist
    ? (user.therapistProfile?.licenseNumber ?? t('unregistered'))
    : (user.parentProfile?.phoneNumber ?? t('unregistered'));

  return (
    <>
      <section className="px-5 mt-1">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4C8C7A] to-brand-press px-5 pt-5 pb-6 shadow-[0_10px_28px_-14px_rgba(31,74,65,0.7)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-white/[0.06]"
          />
          <p className="relative text-body2 text-white/70 m-0">{t('greeting')}</p>
          <h2 className="relative mt-1 text-title font-bold tracking-tight text-white m-0 truncate">
            <span>{user.name}</span>{' '}
            <span className="text-subhead font-semibold text-white/65">{roleLabel}</span>
            <span className="text-subhead font-semibold text-white/65">{t('nameSuffix')}</span>
          </h2>
          <p className="relative mt-2 text-body2 text-white/70 truncate m-0">{user.email}</p>
        </div>
      </section>

      <section className="px-5 mt-7">
        <p className="mb-2 px-1 text-label font-bold text-gray-600 m-0">{t('accountInfoTitle')}</p>
        <div className={`${CARD} px-5`}>
          <InfoRow label={profileLabel} value={profileValue} />
          <hr className="border-0 border-t border-gray-100 m-0" />
          <InfoRow label={t('joinedAtLabel')} value={formatDateLabel(user.createdAt)} />
        </div>
      </section>

      {/* 메뉴 */}
      <section className="px-5 mt-4">
        <div className={`${CARD} overflow-hidden`}>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="w-full flex items-center justify-between px-5 py-3.5 cursor-pointer font-sans bg-transparent border-0 transition-colors active:bg-gray-50"
          >
            <span className="text-callout text-gray-900 font-semibold">{t('editProfileMenu')}</span>
            <span className="text-gray-300">
              <IconChevronRight size={18} />
            </span>
          </button>
          <hr className="border-0 border-t border-gray-100 m-0" />
          {!isTherapist && (
            <>
              <Link
                href="/redeem"
                className="w-full flex items-center justify-between px-5 py-3.5 no-underline"
              >
                <span className="flex items-center gap-2 text-callout text-gray-900 font-semibold">
                  <IconFileText size={16} /> {t('redeemMenu')}
                </span>
                <span className="text-gray-300">
                  <IconChevronRight size={18} />
                </span>
              </Link>
              <hr className="border-0 border-t border-gray-100 m-0" />
            </>
          )}
          {isOwner && (
            <>
              <Link
                href="/organization"
                className="w-full flex items-center justify-between px-5 py-3.5 no-underline"
              >
                <span className="flex items-center gap-2 text-callout text-gray-900 font-semibold">
                  <IconShield size={16} /> {t('orgManageMenu')}
                </span>
                <span className="text-gray-300">
                  <IconChevronRight size={18} />
                </span>
              </Link>
              <hr className="border-0 border-t border-gray-100 m-0" />
            </>
          )}
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="w-full text-left px-5 py-3.5 text-callout font-bold text-danger-strong cursor-pointer font-sans bg-transparent border-0 transition-colors active:bg-gray-50"
          >
            {t('logoutMenu')}
          </button>
        </div>
        <p className="mt-5 text-center text-caption text-gray-600 m-0">{t('appFooter')}</p>
      </section>

      <EditProfileDialog open={editOpen} user={user} onClose={() => setEditOpen(false)} />
      <ConfirmDialog
        open={logoutOpen}
        title={t('logoutConfirmTitle')}
        description={t('logoutConfirmDescription')}
        confirmLabel={t('logoutConfirmLabel')}
        destructive
        loading={isPending}
        onConfirm={() => logout()}
        onCancel={() => setLogoutOpen(false)}
      />
    </>
  );
}
