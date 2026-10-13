/** Brand-level constants used by SEO and layout. Copy that changes often lives in src/content. */
export const site = {
  name: 'Akaya',
  legalName: 'Akaya',
  alternateName: ['Akaya AI', 'Akaya Assistant'],
  slogan: 'Voice → Akaya → Action',
  description:
    'Akaya is a personal AI assistant for chat, voice, documents, translation and everyday actions, with online AI and supported offline AI.',
  locale: 'en_US',
  twitter: '',
  /** Official profiles for Organization.sameAs. Fill when the accounts are live (empty = omitted). */
  sameAs: [] as string[],
  supportEmail: '',
  logoPath: '/icon-512.png',
} as const;
