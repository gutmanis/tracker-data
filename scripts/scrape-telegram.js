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

// Each entry has lat/lng + regionName so the app can show oblast labels & map filtering works
const LOCATION_MAP = {
  // Kyiv
  'kyiv': { lat: 50.4501, lng: 30.5234, regionName: 'Kyiv' },
  'київ': { lat: 50.4501, lng: 30.5234, regionName: 'Kyiv' },
  'киев': { lat: 50.4501, lng: 30.5234, regionName: 'Kyiv' },
  'киева': { lat: 50.4501, lng: 30.5234, regionName: 'Kyiv' },
  'киеву': { lat: 50.4501, lng: 30.5234, regionName: 'Kyiv' },
  // Kharkiv
  'kharkiv': { lat: 49.9935, lng: 36.2304, regionName: 'Kharkiv Oblast' },
  'харків': { lat: 49.9935, lng: 36.2304, regionName: 'Kharkiv Oblast' },
  'харьков': { lat: 49.9935, lng: 36.2304, regionName: 'Kharkiv Oblast' },
  // Odesa
  'odesa': { lat: 46.4825, lng: 30.7233, regionName: 'Odesa Oblast' },
  'одеса': { lat: 46.4825, lng: 30.7233, regionName: 'Odesa Oblast' },
  'одесса': { lat: 46.4825, lng: 30.7233, regionName: 'Odesa Oblast' },
  // Donetsk
  'donetsk': { lat: 48.0159, lng: 37.8028, regionName: 'Donetsk Oblast' },
  'донецк': { lat: 48.0159, lng: 37.8028, regionName: 'Donetsk Oblast' },
  'донецьк': { lat: 48.0159, lng: 37.8028, regionName: 'Donetsk Oblast' },
  // Luhansk
  'luhansk': { lat: 48.5740, lng: 39.3078, regionName: 'Luhansk Oblast' },
  'луганск': { lat: 48.5740, lng: 39.3078, regionName: 'Luhansk Oblast' },
  'луганськ': { lat: 48.5740, lng: 39.3078, regionName: 'Luhansk Oblast' },
  // Bakhmut
  'bakhmut': { lat: 48.5953, lng: 38.0003, regionName: 'Donetsk Oblast' },
  'бахмут': { lat: 48.5953, lng: 38.0003, regionName: 'Donetsk Oblast' },
  'артемовск': { lat: 48.5953, lng: 38.0003, regionName: 'Donetsk Oblast' },
  // Pokrovsk
  'pokrovsk': { lat: 48.2833, lng: 37.1833, regionName: 'Donetsk Oblast' },
  'покровск': { lat: 48.2833, lng: 37.1833, regionName: 'Donetsk Oblast' },
  // Avdiivka
  'avdiivka': { lat: 48.1397, lng: 37.7481, regionName: 'Donetsk Oblast' },
  'авдіївка': { lat: 48.1397, lng: 37.7481, regionName: 'Donetsk Oblast' },
  'авдеевка': { lat: 48.1397, lng: 37.7481, regionName: 'Donetsk Oblast' },
  // Zaporizhzhia
  'zaporizhzhia': { lat: 47.8388, lng: 35.1396, regionName: 'Zaporizhia Oblast' },
  'запоріжжя': { lat: 47.8388, lng: 35.1396, regionName: 'Zaporizhia Oblast' },
  'запорожье': { lat: 47.8388, lng: 35.1396, regionName: 'Zaporizhia Oblast' },
  'запорож': { lat: 47.8388, lng: 35.1396, regionName: 'Zaporizhia Oblast' },
  // Kherson
  'kherson': { lat: 46.6354, lng: 32.6169, regionName: 'Kherson Oblast' },
  'херсон': { lat: 46.6354, lng: 32.6169, regionName: 'Kherson Oblast' },
  // Crimea
  'crimea': { lat: 44.9521, lng: 34.1024, regionName: 'Crimea' },
  'крим': { lat: 44.9521, lng: 34.1024, regionName: 'Crimea' },
  'крым': { lat: 44.9521, lng: 34.1024, regionName: 'Crimea' },
  // Sevastopol
  'sevastopol': { lat: 44.6166, lng: 33.5254, regionName: 'Sevastopol' },
  'севастопол': { lat: 44.6166, lng: 33.5254, regionName: 'Sevastopol' },
  // Mariupol
  'mariupol': { lat: 47.0951, lng: 37.5494, regionName: 'Donetsk Oblast' },
  'маріуполь': { lat: 47.0951, lng: 37.5494, regionName: 'Donetsk Oblast' },
  'мариуполь': { lat: 47.0951, lng: 37.5494, regionName: 'Donetsk Oblast' },
  // Kupiansk
  'kupiansk': { lat: 49.7139, lng: 37.6167, regionName: 'Kharkiv Oblast' },
  'купянск': { lat: 49.7139, lng: 37.6167, regionName: 'Kharkiv Oblast' },
  'купʼянськ': { lat: 49.7139, lng: 37.6167, regionName: 'Kharkiv Oblast' },
  // Toretsk
  'toretsk': { lat: 48.3947, lng: 37.8484, regionName: 'Donetsk Oblast' },
  'торецк': { lat: 48.3947, lng: 37.8484, regionName: 'Donetsk Oblast' },
  // Sumy
  'sumy': { lat: 50.9077, lng: 34.7981, regionName: 'Sumy Oblast' },
  'суми': { lat: 50.9077, lng: 34.7981, regionName: 'Sumy Oblast' },
  'сумы': { lat: 50.9077, lng: 34.7981, regionName: 'Sumy Oblast' },
  // Kursk
  'kursk': { lat: 51.7373, lng: 36.1874, regionName: 'Kursk Oblast' },
  'курск': { lat: 51.7373, lng: 36.1874, regionName: 'Kursk Oblast' },
  // Belgorod
  'belgorod': { lat: 50.5945, lng: 36.5872, regionName: 'Belgorod Oblast' },
  'белгород': { lat: 50.5945, lng: 36.5872, regionName: 'Belgorod Oblast' },
  // Dnipro
  'dnipro': { lat: 48.4647, lng: 35.0462, regionName: 'Dnipropetrovsk Oblast' },
  'дніпро': { lat: 48.4647, lng: 35.0462, regionName: 'Dnipropetrovsk Oblast' },
  'днепр': { lat: 48.4647, lng: 35.0462, regionName: 'Dnipropetrovsk Oblast' },
  // Mykolaiv
  'mykolaiv': { lat: 46.9750, lng: 31.9946, regionName: 'Mykolaiv Oblast' },
  'миколаїв': { lat: 46.9750, lng: 31.9946, regionName: 'Mykolaiv Oblast' },
  'николаев': { lat: 46.9750, lng: 31.9946, regionName: 'Mykolaiv Oblast' },
  // Melitopol
  'melitopol': { lat: 46.8489, lng: 35.3653, regionName: 'Zaporizhia Oblast' },
  'мелітополь': { lat: 46.8489, lng: 35.3653, regionName: 'Zaporizhia Oblast' },
  'мелитополь': { lat: 46.8489, lng: 35.3653, regionName: 'Zaporizhia Oblast' },
  // Vuhledar
  'vuhledar': { lat: 47.7747, lng: 37.2519, regionName: 'Donetsk Oblast' },
  'вугледар': { lat: 47.7747, lng: 37.2519, regionName: 'Donetsk Oblast' },
  'угледар': { lat: 47.7747, lng: 37.2519, regionName: 'Donetsk Oblast' },
  // Starobielsk
  'starobielsk': { lat: 49.2786, lng: 38.9069, regionName: 'Luhansk Oblast' },
  'старобельск': { lat: 49.2786, lng: 38.9069, regionName: 'Luhansk Oblast' },
  // Lviv
  'lviv': { lat: 49.8397, lng: 24.0297, regionName: 'Lviv Oblast' },
  'львов': { lat: 49.8397, lng: 24.0297, regionName: 'Lviv Oblast' },
  // Bila Tserkva (in Kyiv Oblast)
  'белой церкви': { lat: 49.7967, lng: 30.1126, regionName: 'Kyiv Oblast' },
  'бєлой церкви': { lat: 49.7967, lng: 30.1126, regionName: 'Kyiv Oblast' },
  'bila tserkva': { lat: 49.7967, lng: 30.1126, regionName: 'Kyiv Oblast' },
};

function inferLocation(text) {
  const lower = text.toLowerCase();
  for (const [kw, hit] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(kw)) return hit;
  }
  return { lat: 48.5, lng: 37.0, regionName: 'Unspecified' };
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

      const loc = inferLocation(text);
      events.push({
        id: `tg-${postId.replace('/', '-')}`,
        type: inferEventType(text),
        title: text.split('\n')[0].substring(0, 80),
        description: text.substring(0, 500),
        location: { lat: loc.lat, lng: loc.lng },
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
          region: loc.regionName,
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
