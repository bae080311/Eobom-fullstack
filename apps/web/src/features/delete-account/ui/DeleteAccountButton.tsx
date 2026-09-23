'use client';

import { useTranslations } from 'next-intl';
import { useDeleteAccountAction } from '../model/useDeleteAccountAction';
import { DeleteAccountDialog } from './DeleteAccountDialog';

interface Props {
  /** 치료사에게는 소유 기관을 넘기라는 안내가 하나 더 붙는다. */
  isTherapist: boolean;
}

export function DeleteAccountButton({ isTherapist }: Props) {
  const t = useTranslations('features.deleteAccount');
  const { open, password, error, isPending, openDialog, closeDialog, changePassword, submit } =
    useDeleteAccountAction();

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="w-full text-left px-5 py-3.5 text-callout font-bold text-danger-strong cursor-pointer font-sans bg-transparent border-0 transition-colors active:bg-gray-50"
      >
        {t('menu')}
      </button>
      <DeleteAccountDialog
        open={open}
        password={password}
        error={error}
        isPending={isPending}
        isTherapist={isTherapist}
        onPasswordChange={changePassword}
        onSubmit={submit}
        onCancel={closeDialog}
      />
    </>
  );
}
