/** A brand mark resolved by scripts/gen-logos.mjs. */
export interface BrandLogo {
  /** icon set it came from (simple-icons, logos, thesvg-color, …) */
  src: string;
  /** SPDX licence of the icon set */
  license: string;
  /** icon name within the set */
  name: string;
  /** SVG viewBox */
  vb: string;
  /** inner SVG markup */
  body: string;
  /** single-colour glyph: drawn in `hex` (or the app colour) */
  mono?: boolean;
  /** official brand hex (simple-icons only) */
  hex?: string;
}
