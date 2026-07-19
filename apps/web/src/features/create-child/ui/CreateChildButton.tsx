'use client';

import { useState } from 'react';
import { CreateChildForm } from './CreateChildForm';

export function CreateChildButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="아동 추가"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white text-xl leading-none border-0 cursor-pointer"
      >
        +
      </button>
      <CreateChildForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
