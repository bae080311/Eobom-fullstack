'use client';

import { useTranslations } from 'next-intl';
import { ConfirmDialog, IconRefresh } from '@/shared/ui';
import { useRotateJoinCodeAction } from '../model/useRotateJoinCodeAction';

interface Props {
  orgId: string;
}

export function RotateJoinCodeButton({ orgId }: Props) {
  const t = useTranslations('features.rotateJoinCode');
  const { open, isPending, openDialog, closeDialog, confirm } = useRotateJoinCodeAction(orgId);

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-caption font-semibold text-gray-700 border-0 cursor-pointer font-sans"
      >
        <IconRefresh size={14} /> {t('triggerButton')}
      </button>

      <ConfirmDialog
        open={open}
        title={t('confirmTitle')}
        description={t('confirmDescription')}
        confirmLabel={t('confirmLabel')}
        destructive
        loading={isPending}
        onConfirm={confirm}
        onCancel={closeDialog}
      />
    </>
  );
}
