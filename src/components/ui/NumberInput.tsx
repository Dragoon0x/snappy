type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  label?: string;
};

export default function NumberInput({ value, onChange, min, max, step = 1, suffix, label }: Props) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      {label ? <span className="text-muted">{label}</span> : null}
      <div className="flex items-center bg-surface-2 border border-border rounded">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(n);
          }}
          className="flex-1 bg-transparent px-2 py-1 tabular-nums outline-none"
        />
        {suffix ? <span className="pr-2 text-muted">{suffix}</span> : null}
      </div>
    </label>
  );
}
