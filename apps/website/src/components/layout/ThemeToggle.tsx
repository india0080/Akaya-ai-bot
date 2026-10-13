/** Static markup; the click handler is attached by the client islands script (src/main.tsx). */
export function ThemeToggle() {
  return (
    <button type="button" className="tgl" data-theme-toggle aria-label="Toggle light and dark theme">
      <span aria-hidden="true">◐</span>
    </button>
  );
}
