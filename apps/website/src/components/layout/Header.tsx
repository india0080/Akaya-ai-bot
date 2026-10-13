import { content } from '../../services/content';
import { ButtonLink } from '../ui/Button';
import { logoUrl } from '../ui/assets';
import { ThemeToggle } from './ThemeToggle';

export function Header({ path }: { path: string }) {
  const { nav, authCtas } = content.getNav();
  return (
    <header className="nav">
      <div className="nav-in">
        <a className="logo" href="/" aria-label="Akaya home">
          <img src={logoUrl()} alt="" width={34} height={34} />
          akaya
        </a>
        <nav className="nav-links" aria-label="Main">
          {nav.map((l) => (
            <a key={l.href} href={l.href} aria-current={path === l.href || path.startsWith(l.href + '/') ? 'page' : undefined}>{l.label}</a>
          ))}
        </nav>
        <div className="nav-r">
          <ThemeToggle />
          {authCtas.map((c) => <ButtonLink key={c.href} {...c} size="sm" className={c.primary ? '' : 'hide-m'} />)}
        </div>
      </div>
    </header>
  );
}
