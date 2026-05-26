interface Props {
  title: string;
  right?: React.ReactNode;
}

export function SectionHeader({ title, right }: Props) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="text-title3 font-bold tracking-tighter m-0">{title}</h2>
      {right}
    </div>
  );
}
