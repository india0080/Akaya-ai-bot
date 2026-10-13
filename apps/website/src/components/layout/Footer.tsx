import { site } from '../../config/site';
import { content } from '../../services/content';
import { logoUrl } from '../ui/assets';

export function Footer() {
  const { footer } = content.getNav();
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="fgrid">
          <div>
            <a className="logo" href="/"><img src={logoUrl()} alt="" width={34} height={34} loading="lazy" />akaya</a>
            <p className="muted small">{site.slogan}</p>
          </div>
          {footer.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="fh">{col.title}</h2>
              {col.links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
            </nav>
          ))}
        </div>
        <div className="copy">
          <span>© {new Date().getFullYear()} Akaya. All rights reserved.</span>
          <button type="button" className="linklike" data-consent-open>Cookie settings</button>
        </div>
      </div>
    </footer>
  );
}
