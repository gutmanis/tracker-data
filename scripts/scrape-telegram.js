/**
 * Scrape public Telegram channels via t.me/s/ web preview
 * No account, no API key, no ban risk
 */

const fs = require('fs');
const path = require('path');

const CHANNELS = {
  // ===== Tier 1 — Top Russian channels (1M+ subs) =====
  rybar:                { name: 'Rybar',                bias: 'pro-russian',   weight: 3 },
  WarGonzo:             { name: 'WarGonzo',             bias: 'pro-russian',   weight: 3 },
  readovkanews:         { name: 'Readovka',             bias: 'pro-russian',   weight: 3 },
  mash:                 { name: 'Mash',                 bias: 'pro-russian',   weight: 3 },
  mod_russia:           { name: 'Russian MOD',          bias: 'pro-russian',   weight: 3 },
  yurasumy:             { name: 'Yuriy Podolyaka',      bias: 'pro-russian',   weight: 3 },
  shot_shot:            { name: 'SHOT',                 bias: 'pro-russian',   weight: 3 },
  intelslava:           { name: 'Intel Slava Z',        bias: 'pro-russian',   weight: 3 },
  tass_agency:          { name: 'TASS',                 bias: 'pro-russian',   weight: 3 },
  rian_ru:              { name: 'RIA Novosti',          bias: 'pro-russian',   weight: 3 },

  // ===== Tier 2 — Major milbloggers =====
  boris_rozhin:         { name: 'Colonel Cassad',       bias: 'pro-russian',   weight: 2 },
  dva_majors:           { name: 'Two Majors',           bias: 'pro-russian',   weight: 2 },
  RVvoenkor:            { name: 'Operation Z (RV)',     bias: 'pro-russian',   weight: 2 },
  voenkorKotenok:       { name: 'Voenkor Kotenok',      bias: 'pro-russian',   weight: 2 },
  milinfolive:          { name: 'Military Informant',   bias: 'pro-russian',   weight: 2 },
  swodki:               { name: 'SWODKI',               bias: 'pro-russian',   weight: 2 },
  sashakots:            { name: 'Kotsnews',             bias: 'pro-russian',   weight: 2 },
  epoddubny:            { name: 'Poddubny ZOV',         bias: 'pro-russian',   weight: 2 },
  SolovievLive:         { name: 'Solovyov Live',        bias: 'pro-russian',   weight: 2 },
  Sladkov_plus:         { name: 'Sladkov +',            bias: 'pro-russian',   weight: 2 },
  voenacher:            { name: 'Turned on Z War',      bias: 'pro-russian',   weight: 2 },
  zakharprilepin:       { name: 'Zakhar Prilepin',      bias: 'pro-russian',   weight: 2 },
  warfakes:             { name: 'War on Fakes',         bias: 'pro-russian',   weight: 2 },
  SergeyKolyasnikov:    { name: 'Zergulio',             bias: 'pro-russian',   weight: 2 },
  rsotmdivision:        { name: 'RSOTM',                bias: 'pro-russian',   weight: 2 },
  strelkovii:           { name: 'Strelkov',             bias: 'pro-russian',   weight: 2 },
  rt_russian:           { name: 'RT Russian',           bias: 'pro-russian',   weight: 2 },
  margaritasimonyan:    { name: 'Margarita Simonyan',   bias: 'pro-russian',   weight: 2 },
  medvedev_telegram:    { name: 'Dmitry Medvedev',      bias: 'pro-russian',   weight: 2 },
  rusbrief:             { name: 'BRIEF',                bias: 'pro-russian',   weight: 2 },
  tassagency_en:        { name: 'TASS English',         bias: 'pro-russian',   weight: 2 },

  // ===== Tier 3 — Smaller specialized =====
  rusvesnasu:           { name: 'Russian Spring',       bias: 'pro-russian',   weight: 1 },
  anna_news:            { name: 'Anna News',            bias: 'pro-russian',   weight: 1 },
  grey_zone:            { name: 'Grey Zone',            bias: 'pro-russian',   weight: 1 },
  oldminer:             { name: 'Old Miner',            bias: 'pro-russian',   weight: 1 },
  ukraina_ru:           { name: 'Ukraina.ru',           bias: 'pro-russian',   weight: 1 },
  rusich_army:          { name: 'Archangel SpN Z',      bias: 'pro-russian',   weight: 1 },
  vrogov:               { name: 'Vladimir Rogov',       bias: 'pro-russian',   weight: 1 },
  aleksandr_skif:       { name: 'Khodakovsky',          bias: 'pro-russian',   weight: 1 },
  vysokygovorit:        { name: 'Older than Edda',      bias: 'pro-russian',   weight: 1 },
  smotri_z:             { name: 'Come and See',         bias: 'pro-russian',   weight: 1 },
  rlz_the_kraken:       { name: 'Release the Kraken',   bias: 'pro-russian',   weight: 1 },
  talipovonline:        { name: 'TalipoV Online',       bias: 'pro-russian',   weight: 1 },
  brussinf:             { name: 'Call Sign Bruce',      bias: 'pro-russian',   weight: 1 },
  ramzayiegokomanda:    { name: 'Ramzai',               bias: 'pro-russian',   weight: 1 },
  RtrDonetsk:           { name: 'Reporter Rudenko',     bias: 'pro-russian',   weight: 1 },
  dshrg2:               { name: 'DSHRG Rusich',         bias: 'pro-russian',   weight: 1 },
  southfronteng:        { name: 'SouthFront',           bias: 'pro-russian',   weight: 1 },
  SputnikLive:          { name: 'Sputnik Live',         bias: 'pro-russian',   weight: 1 },
  lifenews_media:       { name: 'Life News',            bias: 'pro-russian',   weight: 1 },

  // ===== Ukrainian (cross-reference) =====
  DeepStateUA:          { name: 'DeepState UA',         bias: 'pro-ukrainian', weight: 1 },
  OperativnoZSU:        { name: 'Operativno ZSU',       bias: 'pro-ukrainian', weight: 1 },
  ssternenko:           { name: 'Sternenko',            bias: 'pro-ukrainian', weight: 1 },
  V_Zelenskiy_official: { name: 'Zelensky Official',    bias: 'pro-ukrainian', weight: 1 },
  ukrpravda_news:       { name: 'Ukrainska Pravda',     bias: 'pro-ukrainian', weight: 1 },

  // ===== Neutral / Independent =====
  GeoConfirmed:         { name: 'GeoConfirmed',         bias: 'neutral',       weight: 1 },
  vchkogpu:             { name: 'VChK-OGPU',            bias: 'neutral',       weight: 1 },
  meduzalive:           { name: 'Meduza',               bias: 'neutral',       weight: 1 },
};

const LOCATION_MAP = {
  'kyiv': { lat: 50.4501, lng: 30.5234 }, 'київ': { lat: 50.4501, lng: 30.5234 }, 'киев': { lat: 50.4501, lng: 30.5234 },
  'kharkiv': { lat: 49.9935, lng: 36.2304 }, 'харків': { lat: 49.9935, lng: 36.2304 }, 'харьков': { lat: 49.9935, lng: 36.2304 },
  'odesa': { lat: 46.4825, lng: 30.7233 }, 'одеса': { lat: 46.4825, lng: 30.7233 }, 'одесса': { lat: 46.4825, lng: 30.7233 },
  'donetsk': { lat: 48.0159, lng: 37.8028 }, 'донецк': { lat: 48.0159, lng: 37.8028 }, 'донецьк': { lat: 48.0159, lng: 37.8028 },
  'luhansk': { lat: 48.5740, lng: 39.3078 }, 'луганск': { lat: 48.5740, lng: 39.3078 }, 'луганськ': { lat: 48.5740, lng: 39.3078 },
  'bakhmut': { lat: 48.5953, lng: 38.0003 }, 'бахмут': { lat: 48.5953, lng: 38.0003 }, 'артемовск': { lat: 48.5953, lng: 38.0003 },
  'pokrovsk': { lat: 48.2833, lng: 37.1833 }, 'покровск': { lat: 48.2833, lng: 37.1833 },
  'avdiivka': { lat: 48.1397, lng: 37.7481 }, 'авдіївка': { lat: 48.1397, lng: 37.7481 }, 'авдеевка': { lat: 48.1397, lng: 37.7481 },
  'zaporizhzhia': { lat: 47.8388, lng: 35.1396 }, 'запоріжжя': { lat: 47.8388, lng: 35.1396 }, 'запорожье': { lat: 47.8388, lng: 35.1396 },
  'kherson': { lat: 46.6354, lng: 32.6169 }, 'херсон': { lat: 46.6354, lng: 32.6169 },
  'crimea': { lat: 44.9521, lng: 34.1024 }, 'крим': { lat: 44.9521, lng: 34.1024 }, 'крым': { lat: 44.9521, lng: 34.1024 },
  'mariupol': { lat: 47.0951, lng: 37.5494 }, 'маріуполь': { lat: 47.0951, lng: 37.5494 }, 'мариуполь': { lat: 47.0951, lng: 37.5494 },
  'kupiansk': { lat: 49.7139, lng: 37.6167 }, 'купянск': { lat: 49.7139, lng: 37.6167 },
  'toretsk': { lat: 48.3947, lng: 37.8484 }, 'торецк': { lat: 48.3947, lng: 37.8484 },
  'sumy': { lat: 50.9077, lng: 34.7981 }, 'суми': { lat: 50.9077, lng: 34.7981 }, 'сумы': { lat: 50.9077, lng: 34.7981 },
  'kursk': { lat: 51.7373, lng: 36.1874 }, 'курск': { lat: 51.7373, lng: 36.1874 },
  'dnipro': { lat: 48.4647, lng: 35.0462 }, 'дніпро': { lat: 48.4647, lng: 35.0462 },
  'melitopol': { lat: 46.8489, lng: 35.3653 }, 'мелітополь': { lat: 46.8489, lng: 35.3653 },
  'vuhledar': { lat: 47.7747, lng: 37.2519 }, 'вугледар': { lat: 47.7747, lng: 37.2519 },
};

function inferLocation(text) {
  const lower = text.toLowerCase();
  for (const [kw, coords] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(kw)) return coords;
  }
  return { lat: 48.5, lng: 37.0 }; // Default: center of conflict zone
}

function inferEventType(text) {
  const lower = text.toLowerCase();
  if (/missile|ракет|drone|дрон|shahed|калибр|iskander|glide bomb/i.test(lower)) return 'strike';
  if (/battle|бой|assault|штурм|attack|атак|offensive|наступ/i.test(lower)) return 'battle';
  if (/civilian|мирн|гражд|residential/i.test(lower)) return 'civilian_attack';
  return 'strategic';
}

function isWarRelated(text) {
  const keywords = ['front','attack','strike','missile','drone','advance','retreat',
    'casualt','artillery','tank','brigade','battalion','defense','offensive','position',
    'liberat','captur','destroy','intercept','kharkiv','donetsk','luhansk','zapori',
    'kherson','crimea','bakhmut','avdiiv','pokrovsk','kupian','toretsk',
    'удар','атак','ракет','дрон','фронт','наступ','оборон','артиллер','потер',
    'харьков','донецк','луганск','запорож','херсон','крым','бахмут','покровск'];
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function fetchChannel(channelId, channelInfo) {
  try {
    const { default: fetch } = await import('node-fetch');
    const resp = await fetch(`https://t.me/s/${channelId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!resp.ok) return [];
    const html = await resp.text();

    const events = [];
    const msgRegex = /data-post="([^"]+)"([\s\S]*?)(?=class="tgme_widget_message_wrap|$)/g;
    let match;

    while ((match = msgRegex.exec(html)) !== null) {
      const postId = match[1];
      const block = match[2];

      const textMatch = block.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      if (!textMatch) continue;

      const text = textMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
        .trim();

      if (!text || text.length < 20 || !isWarRelated(text)) continue;

      const dateMatch = block.match(/datetime="([^"]+)"/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString();

      events.push({
        id: `tg-${postId.replace('/', '-')}`,
        type: inferEventType(text),
        title: text.split('\n')[0].substring(0, 80),
        description: text.substring(0, 500),
        location: inferLocation(text),
        status: 'developing',
        severity: 5,
        startDate: date,
        source: `Telegram: ${channelInfo.name}`,
        metadata: {
          telegramChannel: channelId,
          telegramChannelName: channelInfo.name,
          telegramPostId: postId,
          bias: channelInfo.bias,
          weight: channelInfo.weight || 1,
          telegramUrl: `https://t.me/${postId}`,
        },
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    return events;
  } catch (err) {
    console.error(`Error fetching ${channelId}:`, err.message);
    return [];
  }
}

async function main() {
  console.log('Scraping Telegram channels...');
  const allEvents = [];

  for (const [channelId, info] of Object.entries(CHANNELS)) {
    console.log(`  Fetching ${info.name} (${channelId})...`);
    const events = await fetchChannel(channelId, info);
    console.log(`    Got ${events.length} war-related events`);
    allEvents.push(...events);
    await new Promise(r => setTimeout(r, 1500)); // polite delay
  }

  console.log(`\nTotal events: ${allEvents.length}`);

  // Save today's snapshot
  const today = new Date().toISOString().split('T')[0];
  const eventsDir = path.join(__dirname, '..', 'events');

  // Load existing events to deduplicate
  const latestPath = path.join(eventsDir, 'latest.json');
  let existing = [];
  if (fs.existsSync(latestPath)) {
    existing = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
  }

  const existingIds = new Set(existing.map(e => e.id));
  const newEvents = allEvents.filter(e => !existingIds.has(e.id));

  // Keep last 7 days of events in latest.json
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const combined = [...newEvents, ...existing].filter(e => e.startDate >= cutoff);

  fs.writeFileSync(latestPath, JSON.stringify(combined, null, 2));
  fs.writeFileSync(path.join(eventsDir, `${today}.json`), JSON.stringify(allEvents, null, 2));

  console.log(`Saved ${combined.length} events to latest.json (${newEvents.length} new)`);
}

main().catch(console.error);
