type Props = {
  value: string;
  onChange: (v: string) => void;
  label?: string;
};

export default function ColorInput({ value, onChange, label }: Props) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span
        className="inline-block w-7 h-7 rounded-md border border-border overflow-hidden relative"
        style={{ background: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </span>
      <span className="flex-1">
        {label ? <span className="block text-muted mb-1">{label}</span> : null}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-surface-2 border border-border rounded px-2 py-1 font-mono text-[11px]"
          spellCheck={false}
        />
      </span>
    </label>
  );
}
