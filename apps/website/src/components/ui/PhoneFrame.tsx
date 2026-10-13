import type { ReactNode } from 'react';
import { imageUrl } from './assets';

interface Props { screen?: string; alt?: string; eager?: boolean; className?: string; children?: ReactNode }

/** One phone mockup for the whole site: shows a real app screenshot (light + dark, swapped by CSS) or custom children. */
export function PhoneFrame({ screen, alt = 'Akaya app screen', eager, className = '', children }: Props) {
  const load = eager ? 'eager' : 'lazy';
  return (
    <div className={`phone ${className}`.trim()}>
      {screen ? (
        <>
          <img className="only-light" src={imageUrl(`light-${screen}`)} alt={alt} width={390} height={780} loading={load} decoding="async" fetchPriority={eager ? 'high' : 'auto'} />
          <img className="only-dark" src={imageUrl(`dark-${screen}`)} alt="" aria-hidden="true" width={390} height={780} loading="lazy" decoding="async" />
        </>
      ) : (
        <div className="phone-screen">{children}</div>
      )}
    </div>
  );
}
