import Image from "next/image";

export function Logo({ wh }: { wh: number }) {
  return (
    <Image
      alt="spreader logo"
      src="/images/spreader-logo.png"
      width={wh}
      height={wh}
    />
  );
}

export function LogoText({ className }: { className: string }) {
  return (
    <span className={`${className}`} style={{ fontFamily: "Poppins" }}>
      spreader.ai
    </span>
  );
}
