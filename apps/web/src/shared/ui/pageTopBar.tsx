interface Props {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  back?: React.ReactNode;
}

function TitleBlock({
  title,
  subtitle,
  flex,
}: Pick<Props, 'title' | 'subtitle'> & { flex?: boolean }) {
  return (
    <div className={flex ? 'flex-1' : undefined}>
      {title && (
        <h1 className="text-title font-bold tracking-tighter leading-tight m-0 text-gray-900">
          {title}
        </h1>
      )}
      {subtitle && <div className="text-body2 text-gray-600 font-medium mt-1">{subtitle}</div>}
    </div>
  );
}

export function PageTopBar({ title, subtitle, action, back }: Props) {
  if (back) {
    return (
      <div className="flex items-center gap-3 px-5 pb-3">
        {back}
        <TitleBlock title={title} subtitle={subtitle} flex />
        {action}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-5 pb-3">
      <TitleBlock title={title} subtitle={subtitle} />
      {action}
    </div>
  );
}
