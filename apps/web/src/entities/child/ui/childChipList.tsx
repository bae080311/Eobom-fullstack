'use client';

import { useState } from 'react';
import type { Child } from '../model/types';

interface Props {
  children: Child[];
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
}

export function ChildChipList({ children, defaultSelectedId, onSelect }: Props) {
  const [selectedId, setSelectedId] = useState(defaultSelectedId ?? children[0]?.id);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelect?.(id);
  };

  return (
    <div className="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
      {children.map((child) => (
        <button
          key={child.id}
          onClick={() => handleSelect(child.id)}
          className={`rounded-pill px-[14px] py-2 text-body2 font-semibold whitespace-nowrap border transition-colors ${
            selectedId === child.id
              ? 'bg-brand border-brand text-white'
              : 'bg-white border-gray-200 text-gray-600'
          }`}
        >
          {child.name} · {child.age}
        </button>
      ))}
      <button
        className="bg-white border border-gray-200 rounded-pill px-3 py-2 text-body2 font-semibold text-gray-600"
        aria-label="아동 추가"
      >
        +
      </button>
    </div>
  );
}
