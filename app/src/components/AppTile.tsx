import type { IntegrationApp } from '../integrations/types';

/** Neutral monogram tile in the brand colour (placeholder for official logos). */
export function AppTile({ app, size = 44 }: { app: IntegrationApp; size?: number }) {
  const len = app.mono.length;
  return (
    <span
      className="app-tile"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: app.color,
        color: app.darkText ? '#1b1530' : '#fff',
        fontSize: size * (len >= 3 ? 0.3 : len === 2 ? 0.38 : 0.48),
      }}
    >
      {app.mono}
    </span>
  );
}
