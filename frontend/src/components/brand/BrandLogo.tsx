import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

/** Text-only wordmark — no image logo anywhere. */
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
      className={`inline-flex items-center ${className}`}
    >
      {compact ? (
        <span
          className="text-lg font-light tracking-[0.2em] text-white"
          style={{ textShadow: "0 0 16px rgba(120,210,160,0.5)" }}
        >
          S
        </span>
      ) : (
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
