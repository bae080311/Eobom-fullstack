interface Props {
  children: React.ReactNode;
  label: string;
  hasDot?: boolean;
  onClick?: () => void;
}

export function IconButton({ children, label, hasDot, onClick }: Props) {
  return (
    <button
      className="w-[38px] h-[38px] rounded-full bg-gray-100 inline-flex items-center justify-center text-gray-700 border-0 cursor-pointer relative"
      aria-label={label}
      onClick={onClick}
    >
      {children}
      {hasDot && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger border-2 border-white" />
      )}
    </button>
  );
}
