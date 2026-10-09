import { platformName, appLink } from './links';
import { Disclosure, OpenButton, PlatformTile } from './LinkParts';
import { actionSummary, type LinkAction } from './chatIntent';

/** Chat card under Akaya's reply: platform, what it opens, "Open in X", disclosure when it can earn. */
export function LinkCard({ action }: { action: LinkAction }) {
  const link = appLink({ ...action, campaign: 'chat', content: action.intent });
  return (
    <div className="link-card">
      <div className="link-card-head">
        <PlatformTile id={action.platform} size={36} />
        <span>
          <b>{platformName(action.platform)}</b>
          <small>{actionSummary(action)}</small>
        </span>
      </div>
      <OpenButton link={link} className="btn-block" />
      <Disclosure platforms={[action.platform]} />
    </div>
  );
}
