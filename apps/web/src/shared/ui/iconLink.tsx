import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

type Props = ComponentPropsWithoutRef<typeof Link> & {
  label: string;
  hasDot?: boolean;
};

const CLS =
  'size-8 rounded-full bg-gray-100 inline-flex items-center justify-center text-gray-500 relative';

export function IconLink({ children, label, hasDot, ...linkProps }: Props) {
  return (
    <Link aria-label={label} className={CLS} {...linkProps}>
      {children}
      {hasDot && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger border-2 border-white" />
      )}
    </Link>
  );
}
