import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  className?: string;
};

export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label ? (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">{label}</span>
          <span className="text-fg tabular-nums">
            {Math.round(value)}
            {unit}
          </span>
        </div>
      ) : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
