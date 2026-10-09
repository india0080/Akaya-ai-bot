/**
 * @akaya/affiliate: the one place for store/travel/food/ride/messaging deep links, affiliate tags and UTM.
 * Used by the app, the shopping agent, the grocery agent, the Future Message service and link-redirect.
 */
export * from './types.js';
export { PLATFORMS, PLATFORM_IDS, getPlatform, platformsBy, findPlatform, type PlatformId } from './platforms.js';
export { NETWORKS, networkEnvVars, type NetworkDef } from './networks.js';
export { buildLink, tryBuildLink, paramEnvName } from './build.js';
export { withUtm, cleanTag, type Utm } from './utm.js';
export { disclosureText, needsDisclosure, hasProgramme, AMAZON_ASSOCIATE_STATEMENT, type Lang } from './disclosure.js';
export { envVarsFor, allEnvVars, affiliateEnvFrom } from './config.js';
export { detectIntent, type DetectedIntent } from './intent.js';
export * from './message.js';
export * from './reports.js';
