import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

export default function BrandLogo({
  href = "/",
  compact = false,
  className = "",
  markClassName = "",
  textClassName = "",
}: BrandLogoProps) {
  const content = (
    <>
      <img
        src="/brand/syntrix-mark.jpg"
        alt=""
        aria-hidden="true"
        className={`h-10 w-10 rounded-xl object-cover ring-1 ring-white/10 shadow-lg shadow-blue-500/20 ${markClassName}`}
      />
      {!compact && (
        <span className={`font-bold tracking-[0.18em] text-sm text-white ${textClassName}`}>
          SYNTRIX LABS
        </span>
      )}
      <span className="sr-only">Syntrix Labs</span>
    </>
  );

  return (
    <Link href={href} className={`inline-flex items-center gap-3 ${className}`} aria-label="Syntrix Labs home">
      {content}
    </Link>
  );
}
