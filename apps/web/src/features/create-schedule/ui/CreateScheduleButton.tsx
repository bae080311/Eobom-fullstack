'use client';

import { useState } from 'react';
import { useChildrenQuery } from '../model/useChildrenQuery';
import { CreateScheduleForm } from './CreateScheduleForm';

export function CreateScheduleButton() {
  const [open, setOpen] = useState(false);
  const { data: childList = [], isLoading } = useChildrenQuery(open);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="일정 추가"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white text-xl leading-none border-0 cursor-pointer"
      >
        +
      </button>
      <CreateScheduleForm
        open={open}
        childList={childList}
        childrenLoading={isLoading}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
