'use client';

import { useState } from 'react';
import { IconRefresh } from '@/shared/ui';
import { EditOrganizationForm } from './EditOrganizationForm';

interface Props {
  orgId: string;
  name: string;
}

export function EditOrganizationButton({ orgId, name }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-caption font-semibold text-gray-700 border-0 cursor-pointer font-sans"
      >
        <IconRefresh size={14} /> 수정
      </button>

      <EditOrganizationForm open={open} orgId={orgId} name={name} onClose={() => setOpen(false)} />
    </>
  );
}
