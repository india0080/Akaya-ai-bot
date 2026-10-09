/**
 * Open a store / travel / food / ride link the way people expect on a phone.
 *
 * Android / iOS (Capacitor):
 *   1. the platform's app scheme (swiggy://, uber://, …) when it has one and no affiliate ID must survive;
 *   2. the https link as a VIEW intent: App Links hand it to the installed app (Amazon, Flipkart, Booking.com,
 *      MakeMyTrip…) or to the default browser;
 *   3. last resort: an in-app browser tab.
 * Web: a new tab.
 * Affiliate links always open the https URL so the network can record the click.
 */
import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { Browser } from '@capacitor/browser';
import type { BuiltLink } from '@akaya/affiliate';

export type OpenedVia = 'app' | 'external' | 'in-app-browser' | 'tab';

async function launch(url: string): Promise<boolean> {
  try {
    return (await AppLauncher.openUrl({ url })).completed;
  } catch {
    return false;
  }
}

export async function openExternal(link: Pick<BuiltLink, 'appUri' | 'trackedUrl' | 'affiliate'>): Promise<OpenedVia> {
  if (!Capacitor.isNativePlatform()) {
    window.open(link.trackedUrl, '_blank', 'noopener,noreferrer');
    return 'tab';
  }
  if (link.appUri && !link.affiliate.active && (await launch(link.appUri))) return 'app';
  if (await launch(link.trackedUrl)) return 'external';
  await Browser.open({ url: link.trackedUrl });
  return 'in-app-browser';
}
