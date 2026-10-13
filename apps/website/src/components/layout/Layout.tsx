import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

export function Layout({ path, children }: { path: string; children: ReactNode }) {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="page-fx" aria-hidden="true" />
      <Header path={path} />
      <main id="main" className="wrap">{children}</main>
      <Footer />
      <div id="consent-root" />
    </>
  );
}
