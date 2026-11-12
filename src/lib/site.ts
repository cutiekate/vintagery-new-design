/**
 * The site's public address, for absolute links such as link-preview images (Telegram,
 * Facebook and co. ignore relative ones). On Vercel it comes from the production domain at
 * build time — a custom domain added later is picked up automatically.
 */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://vintagery-new-design.vercel.app"
).replace(/\/$/, "");

/** Poster shown when a link to the site is shared (1200 × 630, made from the hero). */
export const SHARE_IMAGE = {
  url: `${SITE_URL}/og-image.jpg`,
  width: 1200,
  height: 630,
  alt: "Vintagery — вінтажний одяг з історією: вішак з одягом 70-х в арці з веселкою",
};
