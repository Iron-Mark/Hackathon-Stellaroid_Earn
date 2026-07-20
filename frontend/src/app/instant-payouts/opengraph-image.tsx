import { instantPayouts as content } from "@/lib/content/landing-pages";
import { renderOgImage } from "@/lib/og-template";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = content.metaTitle;

export default function Image() {
  return renderOgImage({ eyebrow: content.eyebrow, title: content.metaTitle });
}
