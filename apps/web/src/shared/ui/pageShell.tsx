interface Props {
  children: React.ReactNode;
  noPb?: boolean;
}

export function PageShell({ children, noPb }: Props) {
  return (
    <div
      className={`bg-gray-50 min-h-screen pt-[calc(2.5rem+env(safe-area-inset-top))] font-sans antialiased ${noPb ? '' : 'pb-24'}`}
    >
      {children}
    </div>
  );
}
