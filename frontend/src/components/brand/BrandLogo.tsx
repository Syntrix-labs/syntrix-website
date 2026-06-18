import Link from "next/link";
import SyntrixMark from "@/components/brand/SyntrixMark";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

/** Seed of Life mark (inline SVG) + wordmark. */
export default function BrandLogo({
  href = "/",
  compact = false,
  className = "",
  textClassName = "",
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      aria-label="Syntrix Labs home"
      className={`inline-flex items-center gap-2.5 ${className}`}
    >
      <SyntrixMark
        size={compact ? 26 : 22}
        className="shrink-0 drop-shadow-[0_0_12px_rgba(120,210,160,0.45)]"
      />
      {!compact && (
        <span
          className={`text-sm font-light tracking-[0.3em] text-white ${textClassName}`}
          style={{ textShadow: "0 0 16px rgba(120,210,160,0.5)" }}
        >
          SYNTRIX<span style={{ color: "#a9ba9d" }}>&nbsp;LABS</span>
        </span>
      )}
      <span className="sr-only">Syntrix Labs</span>
    </Link>
  );
}
