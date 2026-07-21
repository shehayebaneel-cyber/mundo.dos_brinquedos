export function Stars({ value, size = "text-sm" }: { value: number; size?: string }) {
  const full = Math.round(value);
  return (
    <span className={`${size} leading-none tracking-tight`} aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      <span className="text-sun">{"★".repeat(full)}</span>
      <span className="text-line">{"★".repeat(5 - full)}</span>
    </span>
  );
}
