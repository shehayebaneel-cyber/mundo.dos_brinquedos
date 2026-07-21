import type { Product } from "./types";

// Prototype images are "emoji|background". Real photos are plain URLs.
export type Placeholder = { emoji: string; bg: string } | { url: string };

export function parseImg(url: string | undefined): Placeholder {
  if (!url) return { emoji: "🧸", bg: "#fff0f2" };
  if (url.includes("|")) {
    const [emoji, bg] = url.split("|");
    return { emoji, bg: bg || "#fff0f2" };
  }
  return { url };
}

export function firstImg(p: Pick<Product, "images">): Placeholder {
  return parseImg(p.images?.[0]?.url);
}
