import { logoUri, luminance, useLogoTable } from '../integrations/logos';
import type { IntegrationApp } from '../integrations/types';

/**
 * App icon tile: the brand's own logo on a white tile (like a real app icon).
 * Falls back to a monogram in the brand colour when no permissively licensed logo exists.
 */
export function AppTile({ app, size = 44 }: { app: IntegrationApp; size?: number }) {
  const logos = useLogoTable();
  const logo = logos?.[app.id];
  const radius = size * 0.28;

  if (logo) {
    const tint = logo.hex ?? app.color;
    // a very light single-colour mark (e.g. a yellow glyph) would vanish on white: invert the tile
    const lightMono = !!logo.mono && luminance(tint) > 0.82;
    const fill = lightMono ? '#111111' : tint;
    return (
      <span
        className="app-tile logo"
        aria-hidden="true"
        data-logo-src={logo.src}
        style={{ width: size, height: size, borderRadius: radius, background: lightMono ? tint : '#fff' }}
      >
        <img src={logoUri(app.id, logo, fill)} alt="" draggable={false} style={{ width: '64%', height: '64%' }} />
      </span>
    );
  }

  const len = app.mono.length;
  return (
    <span
      className="app-tile"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: app.color,
        color: app.darkText ? '#1b1530' : '#fff',
        fontSize: size * (len >= 3 ? 0.3 : len === 2 ? 0.38 : 0.48),
      }}
    >
      {app.mono}
    </span>
  );
}
