type SyntrixMarkProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  title?: string;
};

// Seed of Life geometry: a centre circle plus six circles whose centres sit
// one radius away at 60deg steps. This is the canonical Syntrix mark — kept as
// code so it stays razor-sharp at any size and needs no image request.
const R = 34;
const CENTERS: [number, number][] = [[100, 100]];
for (let i = 0; i < 6; i++) {
  const a = (Math.PI / 180) * (60 * i - 90);
  CENTERS.push([100 + Math.cos(a) * R, 100 + Math.sin(a) * R]);
}

export default function SyntrixMark({
  size = 30,
  color = "#a9ba9d",
  strokeWidth = 1.4,
  className = "",
  title,
}: SyntrixMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <g fill="none" stroke={color} strokeWidth={strokeWidth} strokeOpacity={0.95}>
        {CENTERS.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={R} />
        ))}
      </g>
    </svg>
  );
}
