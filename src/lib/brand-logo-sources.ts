/** Source attribution for local brand assets. A logo is not an availability signal. */
export type LogoProvenance = {provider: string; url: string; licenseUrl?: string};
/** Additional SVGs copied from Simple Icons' CC0 graphic library. */
export const ADDITIONAL_SIMPLE_ICONS = new Set(["ea-app","aliexpress","ebay","tumblr","youtube-music","binance","messenger","hbo-max","digitalocean","cloudinary","riot-games","quora","revolut","western-union","cash-app","venmo","lyft","uber-eats","doordash","openrouter","poe","google-docs","icloud-mail","counter-strike-2","battle-net","gmx-mail","ubisoft-connect"]);
/** Curated source icons from Dashboard Icons (Apache-2.0 repository, trademarks excluded). */
export const DASHBOARD_ICONS = new Set(["amazon","minecraft","overwatch-2","facebook","tiktok","telegram","linkedin","netflix","disney-plus","prime-video","paramount-plus","spotify","youtube","xbox","proton-mail","microsoft-365","microsoft-teams","google-meet","dropbox","slack","notion","amazon-web-services","microsoft-azure","gitlab","netlify","supabase","firebase","npm-registry","oracle-cloud","microsoft-copilot","perplexity","deepseek","grok","league-of-legends","genshin-impact","apex-legends","snapchat","pinterest","threads","kick","akamai","fly-io","hugging-face","zoho-mail","fastmail","tuta-mail","proton-drive","box","tidal","apple-tv-plus","plex","outlook","onedrive","rocket-league","pubg-battlegrounds","warframe","x-twitter","playstation-network","nintendo-switch-online","google-search","hetzner-cloud","redis-cloud","docker-hub","ovhcloud","yahoo-mail","google-workspace","bolt","chatgpt"]);
const DASHBOARD_ALIASES: Record<string, string> = {
  "npm-registry": "npm",
  "zoho-mail": "zohomail",
  "outlook": "microsoft-outlook",
  "onedrive": "microsoft-onedrive",
  "rocket-league": "rocket-league-icon",
  "pubg-battlegrounds": "pubg-battlegrounds-icon-mono",
  "warframe": "warframe-icon",
  "x-twitter": "x",
  "google-search": "google",
  "google-workspace": "google",
  "bolt": "boltnew",
  "yahoo-mail": "yahoo"
};
const CUSTOM_SOURCES: Record<string, LogoProvenance> = {
  'cashea': {provider: 'Lawnicons (ilustración comunitaria)', url: 'https://github.com/LawnchairLauncher/lawnicons/blob/develop/svgs/cashea.svg', licenseUrl: 'https://github.com/LawnchairLauncher/lawnicons/blob/develop/LICENSE'},
  'bnc': {provider: 'Arcticons (ilustración comunitaria)', url: 'https://github.com/deathrashed/iconography/blob/main/iconify/arcticons/bnc.svg', licenseUrl: 'https://github.com/deathrashed/iconography/blob/main/LICENSE'},
  'ridery': {provider: 'Arcticons (ilustración comunitaria)', url: 'https://github.com/deathrashed/iconography/blob/main/iconify/arcticons/ridery.svg', licenseUrl: 'https://github.com/deathrashed/iconography/blob/main/LICENSE'},
  'zinli': {provider: 'Arcticons (ilustración comunitaria)', url: 'https://github.com/deathrashed/iconography/blob/main/iconify/arcticons/zinli.svg', licenseUrl: 'https://github.com/deathrashed/iconography/blob/main/LICENSE'},
  'zupper': {provider: 'Arcticons (ilustración comunitaria)', url: 'https://github.com/deathrashed/iconography/blob/main/iconify/arcticons/zupper.svg', licenseUrl: 'https://github.com/deathrashed/iconography/blob/main/LICENSE'},
  'aol-mail': {provider: 'Arcticons (ilustración comunitaria)', url: 'https://github.com/deathrashed/iconography/blob/main/iconify/arcticons/aol.svg', licenseUrl: 'https://github.com/deathrashed/iconography/blob/main/LICENSE'},
  'bbva-provincial': {provider: 'Lawnicons (marca matriz BBVA, ilustración comunitaria)', url: 'https://github.com/LawnchairLauncher/lawnicons/blob/develop/svgs/bbva.svg', licenseUrl: 'https://github.com/LawnchairLauncher/lawnicons/blob/develop/LICENSE'},
  'mobile-legends': {provider: 'Arcticons (ilustración comunitaria)', url: 'https://github.com/deathrashed/iconography/blob/main/iconify/arcticons/mobile-legends-bang-bang.svg', licenseUrl: 'https://github.com/deathrashed/iconography/blob/main/LICENSE'},
  'pokemon-go': {provider: "Material Design Icons", url: 'https://github.com/Templarian/MaterialDesign/blob/master/svg/pokemon-go.svg', licenseUrl: "https://github.com/Templarian/MaterialDesign/blob/master/LICENSE"},
  'gta-online': {provider: "Recurso de comunidad GTA", url: 'https://github.com/devemdobro/projeto-gta/blob/main/src/imagens/logo-gta-online.svg'},
  'among-us': {provider: "Tabler Icons", url: 'https://github.com/tabler/tabler-icons/blob/main/icons/outline/brand-among-us.svg', licenseUrl: "https://github.com/tabler/tabler-icons/blob/main/LICENSE"},
  'brawl-stars': {provider: "Iconografía SVG de terceros", url: 'https://github.com/fakhrul62/free-awesome/blob/main/freeawesome/line/504182-Brawl-stars.svg'},
  'canva': {provider: "CoreUI Icons", url: 'https://github.com/coreui/coreui-icons/blob/main/svg/brand/cib-canva.svg', licenseUrl: "https://github.com/coreui/coreui-icons/blob/main/LICENSE"},
  'heroku': {provider: "CoreUI Icons", url: 'https://github.com/coreui/coreui-icons/blob/main/svg/brand/cib-heroku.svg', licenseUrl: "https://github.com/coreui/coreui-icons/blob/main/LICENSE"},
  'walmart': {provider: "Logo editorial en Formik", url: 'https://github.com/jaredpalmer/formik/blob/main/website/public/images/logos/walmart.svg'},
  'temu': {provider: "Lawnicons", url: 'https://github.com/LawnchairLauncher/lawnicons/blob/develop/svgs/temu.svg', licenseUrl: "https://github.com/LawnchairLauncher/lawnicons/blob/develop/LICENSE"},
  'shein': {provider: "Lawnicons", url: 'https://github.com/LawnchairLauncher/lawnicons/blob/develop/svgs/shein.svg', licenseUrl: "https://github.com/LawnchairLauncher/lawnicons/blob/develop/LICENSE"},
  'character-ai': {provider: "Runeicons", url: 'https://github.com/Runeicons/runeicons/blob/main/public/brand-logos/character-ai.svg'},
  'pluto-tv': {provider: "Iconografía SVG de terceros", url: 'https://github.com/fakhrul62/free-awesome/blob/main/freeawesome/line/518719-Pluto-tv.svg'},
  'geforce-now': {provider: "Raycast Extensions", url: 'https://github.com/raycast/extensions/blob/main/extensions/gg-deals/assets/platform-icons/svg-platform-geforce-now.svg'},
  'mercado-libre': {provider: "SVGL", url: 'https://github.com/pheralb/svgl/blob/main/static/library/mercado-libre.svg'},
  'free-fire': {provider: "Arcticons", url: 'https://github.com/deathrashed/iconography/blob/main/iconify/arcticons/free-fire.svg'},
  'fall-guys': {provider: "Papirus Icon Theme", url: 'https://github.com/PapirusDevelopmentTeam/papirus-icon-theme/blob/main/Papirus/64x64/apps/fall-guys.svg', licenseUrl: "https://github.com/PapirusDevelopmentTeam/papirus-icon-theme/blob/master/LICENSE"},
  'destiny-2': {provider: "Icons Plus", url: 'https://github.com/chouhan-rahul/icons_plus/blob/main/assets/images/logos/video-games/destiny-2.svg'},
  'clash-of-clans': {provider: "Arcticons", url: 'https://github.com/deathrashed/iconography/blob/main/iconify/arcticons/clash-of-clans.svg'},
  'world-of-warcraft': {provider: "Icons Plus", url: 'https://github.com/HemantKArya/BloomeeTunes/blob/main/packages/icons_plus/assets/images/logos/video-games/world-of-warcraft.svg'},
  'efootball': {provider: "Lawnicons", url: 'https://github.com/LawnchairLauncher/lawnicons/blob/develop/svgs/efootball.svg', licenseUrl: "https://github.com/LawnchairLauncher/lawnicons/blob/develop/LICENSE"},
  'pedidosya': {provider: "Lawnicons (representación comunitaria)", url: 'https://github.com/LawnchairLauncher/lawnicons/blob/develop/svgs/pedidosya.svg', licenseUrl: "https://github.com/LawnchairLauncher/lawnicons/blob/develop/LICENSE"},
  'yango': {provider: "Lawnicons (representación comunitaria)", url: 'https://github.com/LawnchairLauncher/lawnicons/blob/develop/svgs/yango.svg', licenseUrl: "https://github.com/LawnchairLauncher/lawnicons/blob/develop/LICENSE"},
  'honkai-star-rail': {provider: "Arcticons", url: 'https://github.com/deathrashed/iconography/blob/main/iconify/arcticons/honkai-star-rail.svg'},
};
const WIKIMEDIA_URLS: Record<string, string> = {
  "cantv": "https://commons.wikimedia.org/wiki/File:CANTV_logo.svg",
  "movistar": "https://commons.wikimedia.org/wiki/File:Movistar_2020_logo.svg",
  "digitel": "https://commons.wikimedia.org/wiki/File:Digitel_(2014).svg",
  "movilnet": "https://commons.wikimedia.org/wiki/File:Movilnet-logo_0.png",
  "corpoelec": "https://commons.wikimedia.org/wiki/File:Logo_CORPOELEC_(Venezuela).jpg",
  "banco-de-venezuela": "https://commons.wikimedia.org/wiki/File:Bdv2022logo.png",
  "banesco": "https://commons.wikimedia.org/wiki/File:Banesco_Nuevo_Logo.svg"
};
/**
 * SVGs from the original allowlist were Simple Icons; the new additions have
 * explicit provenance instead of being misattributed to that library.
 * Brand trademarks remain with their owners irrespective of icon licensing.
 */
export function brandLogoSource(slug: string, assetPath: string): LogoProvenance {
  const custom = CUSTOM_SOURCES[slug];
  if (custom) return custom;
  if (DASHBOARD_ICONS.has(slug)) {
    const file = DASHBOARD_ALIASES[slug] ?? slug;
    return {
      provider: 'Dashboard Icons',
      url: 'https://github.com/homarr-labs/dashboard-icons/blob/main/svg/' + file + '.svg',
      licenseUrl: 'https://github.com/homarr-labs/dashboard-icons/blob/main/LICENSE',
    };
  }
  if (ADDITIONAL_SIMPLE_ICONS.has(slug)) {
    const file = slug === 'ea-app' ? 'ea' : slug.replaceAll('-', '').replace('battlenet', 'battledotnet');
    return {
      provider: 'Simple Icons',
      url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/' + (slug === 'battle-net' ? 'battledotnet' : file) + '.svg',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    };
  }
  if (assetPath.endsWith('.png')) {
    return {provider: 'Wikimedia Commons', url: WIKIMEDIA_URLS[slug] ?? 'https://commons.wikimedia.org/'};
  }
  return {
    provider: 'Simple Icons',
    url: 'https://github.com/simple-icons/simple-icons/tree/develop/icons',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  };
}

/** Distinguish this extension from the original 50 credited assets. */
export function isAdditionalLogo(slug: string): boolean {
  return DASHBOARD_ICONS.has(slug) || ADDITIONAL_SIMPLE_ICONS.has(slug) ||
    Object.prototype.hasOwnProperty.call(CUSTOM_SOURCES, slug);
}
