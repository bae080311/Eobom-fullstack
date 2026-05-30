interface Props {
  children: React.ReactNode;
  noPb?: boolean;
}

export function PageShell({ children, noPb }: Props) {
  return (
    <div className={`bg-gray-50 min-h-screen pt-10 font-sans antialiased ${noPb ? '' : 'pb-24'}`}>
      {children}
    </div>
  );
}
