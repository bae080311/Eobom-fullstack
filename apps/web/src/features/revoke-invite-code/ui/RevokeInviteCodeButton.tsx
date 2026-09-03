'use client';

import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/shared/ui';
import { useRevokeInviteCodeAction } from '../model/useRevokeInviteCodeAction';

interface Props {
  id: string;
}

export function RevokeInviteCodeButton({ id }: Props) {
  const t = useTranslations('features.revokeInviteCode');
  const { open, isPending, openDialog, closeDialog, confirm } = useRevokeInviteCodeAction(id);

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-full bg-danger-soft px-3 py-1.5 text-caption font-semibold text-danger-strong border-0 cursor-pointer font-sans"
      >
        {t('triggerButton')}
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
