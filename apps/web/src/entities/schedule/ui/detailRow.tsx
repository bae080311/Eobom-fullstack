interface Props {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function DetailRow({ icon, label, value }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-[10px] bg-gray-100 text-gray-500 inline-flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div>
        <div className="text-label text-gray-500 font-semibold">{label}</div>
        <div className="text-callout text-gray-900 font-semibold mt-0.5 tracking-tight">{value}</div>
      </div>
    </div>
  );
}
