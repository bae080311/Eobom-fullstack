interface Props {
  title: string;
  subtitle?: string;
  action: React.ReactNode;
}

export function PageTopBar({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-center justify-between px-5 pb-5">
      <div>
        <h1 className="text-title font-bold tracking-tighter leading-tight m-0 text-gray-900">
          {title}
        </h1>
        {subtitle && (
          <div className="text-body2 text-gray-600 font-medium mt-1">{subtitle}</div>
        )}
      </div>
      {action}
    </div>
  );
}
