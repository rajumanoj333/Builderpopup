export default function BrandMark({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  const foreground = inverse ? "#FFFFFF" : "#00754A";
  const background = inverse ? "#00754A" : "#FFFFFF";

  return (
    <span className={`brand-mark${compact ? " brand-mark--compact" : ""}`}>
      <svg
        aria-hidden="true"
        className="brand-mark__icon"
        viewBox="0 0 48 48"
        fill="none"
      >
        <circle cx="24" cy="24" r="23" fill={background} stroke={foreground} strokeWidth="2" />
        <path
          d="M16 29.5h15.5a5.5 5.5 0 0 0 0-11H30"
          stroke={foreground}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M16 17.5v15.25A3.25 3.25 0 0 0 19.25 36h7.5A3.25 3.25 0 0 0 30 32.75V17.5H16Z"
          fill={foreground}
        />
        <path d="M20 12c0-2 1.6-2.8 1.6-4.6M25 12c0-2 1.6-2.8 1.6-4.6" stroke={foreground} strokeWidth="2" strokeLinecap="round" />
        <path d="M19 22.5c3.5-2.5 6.5-2.5 9 0-3.25 3-6.25 3-9 0Z" fill={background} />
      </svg>
      {!compact ? (
        <span className="brand-mark__word">
          brew<span>mate</span>
        </span>
      ) : null}
    </span>
  );
}
