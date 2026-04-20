import { cn } from "@/lib/utils";

type Option<T extends string> = {
  value: T;
  label: React.ReactNode;
  title?: string;
};

type Props<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  className?: string;
  fullWidth?: boolean;
};

export default function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  fullWidth,
}: Props<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md bg-surface-2 border border-border p-0.5",
        fullWidth && "w-full",
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.title}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-2.5 py-1 rounded text-xs font-medium transition-colors",
            fullWidth && "flex-1",
            value === opt.value ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
