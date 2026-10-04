import { useId } from "react";

type SyntrixMarkProps = {
  size?: number;
  color?: string;
  /** kept for backward-compat with older callers; unused by the new mark */
  strokeWidth?: number;
  className?: string;
  title?: string;
};

/**
 * Syntrix "S" mark — a disc split by a diagonal slash into two half-discs,
 * reading as an S. Kept as code so it stays razor-sharp at any size and needs
 * no image request. Cream on transparent by default (brand is black + cream).
 * The diagonal cut is a masked band, so it shows through to whatever is behind.
 */
export default function SyntrixMark({
  size = 30,
  color = "#f2efe6",
  className = "",
  title,
}: SyntrixMarkProps) {
  // Unique per logo: with one shared id, a hidden copy (e.g. the phone header on
  // desktop) breaks the mask for every other copy and they render as squares.
  const maskId = `syntrix-s-cut-${useId().replace(/:/g, "")}`;
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
      <mask id={maskId}>
        <rect width="200" height="200" fill="black" />
        <circle cx="100" cy="100" r="82" fill="white" />
        {/* diagonal "/" gap through the centre, splitting the disc into an S */}
        <rect x="-40" y="90.5" width="280" height="19" fill="black" transform="rotate(-45 100 100)" />
      </mask>
      <rect width="200" height="200" fill={color} mask={`url(#${maskId})`} />
    </svg>
  );
}
