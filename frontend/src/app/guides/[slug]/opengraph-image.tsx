import { getGuide, guides } from "@/lib/content/guides";
import { renderOgImage } from "@/lib/og-template";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Stellaroid Earn credential guide";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  return renderOgImage({
    eyebrow: guide?.audience ?? "Stellar credential guide",
    title: guide?.title ?? "Stellar credential verification guide",
  });
}
