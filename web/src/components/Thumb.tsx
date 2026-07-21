import { parseImg } from "../lib/img";

// Renders a prototype placeholder (emoji on tinted ground) or a real photo.
export function Thumb({
  url,
  alt,
  className = "",
  emojiSize = "text-5xl",
}: {
  url?: string;
  alt?: string;
  className?: string;
  emojiSize?: string;
}) {
  const img = parseImg(url);
  if ("url" in img) {
    return <img src={img.url} alt={alt ?? ""} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${emojiSize} ${className}`}
      style={{ background: img.bg }}
      role="img"
      aria-label={alt ?? ""}
    >
      <span>{img.emoji}</span>
    </div>
  );
}
