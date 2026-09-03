'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { MemberResponseDto } from '@eobom/shared';
import { FormModal } from '@/shared/ui';
import { useSetPrimaryTherapistAction } from '../model/useSetPrimaryTherapistAction';

interface Props {
  open: boolean;
  childId: string;
  currentPrimaryTherapistId: string | null;
  members: MemberResponseDto[];
  onClose: () => void;
}

function resolveInitialSelection(
  currentPrimaryTherapistId: string | null,
  members: MemberResponseDto[],
): string {
  if (!currentPrimaryTherapistId) return '';
  const stillActive = members.some(
    (member) => member.therapistProfileId === currentPrimaryTherapistId,
  );
  return stillActive ? currentPrimaryTherapistId : '';
}

export function SetPrimaryTherapistForm({
  open,
  childId,
  currentPrimaryTherapistId,
  members,
  onClose,
}: Props) {
  const tRole = useTranslations('entities.organization.role');
  const t = useTranslations('features.manageChild.primaryTherapistForm');
  const [selected, setSelected] = useState(() =>
    resolveInitialSelection(currentPrimaryTherapistId, members),
  );
  const { submit, isPending } = useSetPrimaryTherapistAction(childId, onClose);

  useEffect(() => {
    if (open) {
      setSelected(resolveInitialSelection(currentPrimaryTherapistId, members));
    }
  }, [open, currentPrimaryTherapistId, members]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    submit(selected);
  }

  return (
    <FormModal
      open={open}
      title={t('title')}
      isPending={isPending}
      submitDisabled={!selected}
      submitLabel={t('submitLabel')}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-label text-gray-600 font-semibold">{t('therapistLabel')}</span>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand"
        >
          <option value="" disabled>
            {t('selectPlaceholder')}
          </option>
          {members.map((member) => (
            <option key={member.therapistProfileId} value={member.therapistProfileId}>
              {member.user.name} ({tRole(member.role)})
            </option>
          ))}
        </select>
      </label>
    </FormModal>
  );
}
