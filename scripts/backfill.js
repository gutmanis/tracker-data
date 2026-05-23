/**
 * One-shot backfill of all Telegram channels from 2026-01-01 to now.
 * Walks t.me/s/CHANNEL?before=POST_ID pages backwards until reaching the cutoff.
 * Saves output to events/archive/YYYY-MM.json (split by month) so files stay small.
 *
 * Run: node scripts/backfill.js
 * Time: ~30-60 minutes depending on channel volume and network.
 */

const fs = require('fs');
const path = require('path');

const CUTOFF = new Date('2026-01-01T00:00:00Z').getTime();
const MAX_PAGES_PER_CHANNEL = 500;
const REQUEST_DELAY_MS = 600;
const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 3;

const CHANNELS = {
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
  DeepStateUA:          { name: 'DeepState UA',         bias: 'pro-ukrainian', weight: 1 },
  OperativnoZSU:        { name: 'Operativno ZSU',       bias: 'pro-ukrainian', weight: 1 },
  ssternenko:           { name: 'Sternenko',            bias: 'pro-ukrainian', weight: 1 },
  V_Zelenskiy_official: { name: 'Zelensky Official',    bias: 'pro-ukrainian', weight: 1 },
  ukrpravda_news:       { name: 'Ukrainska Pravda',     bias: 'pro-ukrainian', weight: 1 },
  GeoConfirmed:         { name: 'GeoConfirmed',         bias: 'neutral',       weight: 1 },
  vchkogpu:             { name: 'VChK-OGPU',            bias: 'neutral',       weight: 1 },
  meduzalive:           { name: 'Meduza',               bias: 'neutral',       weight: 1 },
};

const LOCATION_MAP = {
  'kyiv': { lat: 50.4501, lng: 30.5234, regionName: 'Kyiv' },
  'киев': { lat: 50.4501, lng: 30.5234, regionName: 'Kyiv' },
  'kharkiv': { lat: 49.9935, lng: 36.2304, regionName: 'Kharkiv Oblast' },
  'харьков': { lat: 49.9935, lng: 36.2304, regionName: 'Kharkiv Oblast' },
  'odesa': { lat: 46.4825, lng: 30.7233, regionName: 'Odesa Oblast' },
  'одесса': { lat: 46.4825, lng: 30.7233, regionName: 'Odesa Oblast' },
  'donetsk': { lat: 48.0159, lng: 37.8028, regionName: 'Donetsk Oblast' },
  'донецк': { lat: 48.0159, lng: 37.8028, regionName: 'Donetsk Oblast' },
  'luhansk': { lat: 48.5740, lng: 39.3078, regionName: 'Luhansk Oblast' },
  'луганск': { lat: 48.5740, lng: 39.3078, regionName: 'Luhansk Oblast' },
  'bakhmut': { lat: 48.5953, lng: 38.0003, regionName: 'Donetsk Oblast' },
  'бахмут': { lat: 48.5953, lng: 38.0003, regionName: 'Donetsk Oblast' },
  'pokrovsk': { lat: 48.2833, lng: 37.1833, regionName: 'Donetsk Oblast' },
  'покровск': { lat: 48.2833, lng: 37.1833, regionName: 'Donetsk Oblast' },
  'avdiivka': { lat: 48.1397, lng: 37.7481, regionName: 'Donetsk Oblast' },
  'авдеевка': { lat: 48.1397, lng: 37.7481, regionName: 'Donetsk Oblast' },
  'zaporizhzhia': { lat: 47.8388, lng: 35.1396, regionName: 'Zaporizhia Oblast' },
  'запорожье': { lat: 47.8388, lng: 35.1396, regionName: 'Zaporizhia Oblast' },
  'kherson': { lat: 46.6354, lng: 32.6169, regionName: 'Kherson Oblast' },
  'херсон': { lat: 46.6354, lng: 32.6169, regionName: 'Kherson Oblast' },
  'crimea': { lat: 44.9521, lng: 34.1024, regionName: 'Crimea' },
  'крым': { lat: 44.9521, lng: 34.1024, regionName: 'Crimea' },
  'sevastopol': { lat: 44.6166, lng: 33.5254, regionName: 'Sevastopol' },
  'mariupol': { lat: 47.0951, lng: 37.5494, regionName: 'Donetsk Oblast' },
  'мариуполь': { lat: 47.0951, lng: 37.5494, regionName: 'Donetsk Oblast' },
  'kupiansk': { lat: 49.7139, lng: 37.6167, regionName: 'Kharkiv Oblast' },
  'купянск': { lat: 49.7139, lng: 37.6167, regionName: 'Kharkiv Oblast' },
  'toretsk': { lat: 48.3947, lng: 37.8484, regionName: 'Donetsk Oblast' },
  'торецк': { lat: 48.3947, lng: 37.8484, regionName: 'Donetsk Oblast' },
  'sumy': { lat: 50.9077, lng: 34.7981, regionName: 'Sumy Oblast' },
  'сумы': { lat: 50.9077, lng: 34.7981, regionName: 'Sumy Oblast' },
  'kursk': { lat: 51.7373, lng: 36.1874, regionName: 'Kursk Oblast' },
  'курск': { lat: 51.7373, lng: 36.1874, regionName: 'Kursk Oblast' },
  'belgorod': { lat: 50.5945, lng: 36.5872, regionName: 'Belgorod Oblast' },
  'белгород': { lat: 50.5945, lng: 36.5872, regionName: 'Belgorod Oblast' },
  'dnipro': { lat: 48.4647, lng: 35.0462, regionName: 'Dnipropetrovsk Oblast' },
  'днепр': { lat: 48.4647, lng: 35.0462, regionName: 'Dnipropetrovsk Oblast' },
  'mykolaiv': { lat: 46.9750, lng: 31.9946, regionName: 'Mykolaiv Oblast' },
  'николаев': { lat: 46.9750, lng: 31.9946, regionName: 'Mykolaiv Oblast' },
  'melitopol': { lat: 46.8489, lng: 35.3653, regionName: 'Zaporizhia Oblast' },
  'мелитополь': { lat: 46.8489, lng: 35.3653, regionName: 'Zaporizhia Oblast' },
  'vuhledar': { lat: 47.7747, lng: 37.2519, regionName: 'Donetsk Oblast' },
  'угледар': { lat: 47.7747, lng: 37.2519, regionName: 'Donetsk Oblast' },
  'starobielsk': { lat: 49.2786, lng: 38.9069, regionName: 'Luhansk Oblast' },
  'старобельск': { lat: 49.2786, lng: 38.9069, regionName: 'Luhansk Oblast' },
  'lviv': { lat: 49.8397, lng: 24.0297, regionName: 'Lviv Oblast' },
  'львов': { lat: 49.8397, lng: 24.0297, regionName: 'Lviv Oblast' },
};

const WAR_KEYWORDS = ['front','attack','strike','missile','drone','advance','retreat','casualt','artillery','tank','brigade','battalion','defense','offensive','position','liberat','captur','destroy','intercept','kharkiv','donetsk','luhansk','zapori','kherson','crimea','bakhmut','avdiiv','pokrovsk','kupian','toretsk','удар','атак','ракет','дрон','фронт','наступ','оборон','артиллер','потер','бригад','батальон','позици','харьков','донецк','луганск','запорож','херсон','крым','бахмут','авдеев','покровск','купянск','всу','зсу'];

function isWarRelated(text) {
  const lower = text.toLowerCase();
  return WAR_KEYWORDS.some((kw) => lower.includes(kw));
}

function inferEventType(text) {
  const lower = text.toLowerCase();
  if (/missile|ракет|drone|дрон|shahed|калибр|caliber|iskander|glide bomb|каб-|fab-|удар/i.test(lower)) return 'strike';
  if (/battle|бой|assault|штурм|attack|атак|offensive|наступ/i.test(lower)) return 'battle';
  if (/civilian|мирн|гражд|residential|жил|школ|больниц/i.test(lower)) return 'civilian_attack';
  return 'strategic';
}

function inferLocation(text) {
  const lower = text.toLowerCase();
  for (const [keyword, hit] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(keyword)) return hit;
  }
  return { lat: 48.5, lng: 37.0, regionName: 'Unspecified' };
}

function extractWeapon(text) {
  const patterns = [
    [/искандер|iskander/i, 'Iskander'],
    [/калибр|kalibr/i, 'Kalibr'],
    [/шахед|shahed/i, 'Shahed drone'],
    [/ланцет|lancet/i, 'Lancet drone'],
    [/glide bomb|fab-?\d|каб-?\d/i, 'Glide bomb'],
    [/химарс|himars/i, 'HIMARS'],
    [/storm shadow|шторм/i, 'Storm Shadow'],
    [/атакмс?|atacm/i, 'ATACMS'],
    [/танк/i, 'Tank'],
    [/артиллер|artillery/i, 'Artillery'],
    [/дрон|drone|бпла|uav/i, 'Drone'],
  ];
  for (const [p, n] of patterns) if (p.test(text)) return n;
  return undefined;
}

function extractCasualties(text) {
  const patterns = [
    /(\d{1,5})\s*(?:убит|killed|kia|dead|loss)/i,
    /(?:уничтожен[оы]?|destroyed)\s*(\d{1,5})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = parseInt(m[1]);
      if (n > 0 && n < 100000) return n;
    }
  }
  return undefined;
}

function truncateTitle(text) {
  const firstLine = text.split('\n')[0].trim();
  const cleaned = firstLine.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}‼📝]/gu, '').trim();
  return cleaned.length <= 90 ? cleaned : cleaned.substring(0, 87) + '...';
}

function parsePage(html, channelId, channelInfo) {
  const messages = [];
  const messageRegex = /class="tgme_widget_message_wrap[^"]*"[\s\S]*?data-post="([^"]+)"([\s\S]*?)(?=class="tgme_widget_message_wrap|$)/g;

  let match;
  while ((match = messageRegex.exec(html)) !== null) {
    const postId = match[1];
    const block = match[2];

    const textMatch = block.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    let text = '';
    if (textMatch) {
      text = textMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
        .trim();
    }
    if (!text || text.length < 20) continue;

    const dateMatch = block.match(/datetime="([^"]+)"/);
    const date = dateMatch ? dateMatch[1] : null;
    if (!date) continue;

    const viewsMatch = block.match(/class="tgme_widget_message_views"[^>]*>([^<]+)/);
    const views = viewsMatch ? viewsMatch[1].trim() : '0';

    messages.push({ postId, text, date, views });
  }

  return messages;
}

function postsToEvents(posts, channelId, channelInfo) {
  return posts.filter(p => isWarRelated(p.text)).map(p => {
    const loc = inferLocation(p.text);
    return {
      id: `tg-${p.postId.replace('/', '-')}`,
      type: inferEventType(p.text),
      title: truncateTitle(p.text),
      description: p.text.substring(0, 800),
      location: { lat: loc.lat, lng: loc.lng },
      status: 'developing',
      severity: 5,
      startDate: p.date,
      source: `Telegram: ${channelInfo.name}`,
      casualties: extractCasualties(p.text),
      metadata: {
        telegramChannel: channelId,
        telegramChannelName: channelInfo.name,
        telegramPostId: p.postId,
        views: p.views,
        bias: channelInfo.bias,
        weight: channelInfo.weight || 1,
        telegramUrl: `https://t.me/${p.postId}`,
        weaponType: extractWeapon(p.text),
        region: loc.regionName,
      },
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url, attempt = 1) {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.text();
  } catch (err) {
    if (attempt >= MAX_RETRIES) throw err;
    await sleep(RETRY_DELAY_MS * attempt);
    return fetchWithRetry(url, attempt + 1);
  }
}

async function backfillChannel(channelId, info) {
  const allPosts = [];
  let beforeNum = null;
  let pages = 0;
  let reachedCutoff = false;

  while (pages < MAX_PAGES_PER_CHANNEL && !reachedCutoff) {
    const url = beforeNum
      ? `https://t.me/s/${channelId}?before=${beforeNum}`
      : `https://t.me/s/${channelId}`;

    let html;
    try {
      html = await fetchWithRetry(url);
    } catch (err) {
      console.log(`  [${channelId}] page ${pages+1} fetch failed: ${err.message}, stopping`);
      break;
    }

    const posts = parsePage(html, channelId, info);
    if (posts.length === 0) break;

    // Sort posts by ID (numeric, descending so first is newest)
    posts.sort((a, b) => {
      const aN = parseInt(a.postId.split('/')[1]);
      const bN = parseInt(b.postId.split('/')[1]);
      return bN - aN;
    });

    const oldest = posts[posts.length - 1];
    const oldestTime = new Date(oldest.date).getTime();
    const oldestNum = parseInt(oldest.postId.split('/')[1]);

    // Filter posts within cutoff
    const inRange = posts.filter(p => new Date(p.date).getTime() >= CUTOFF);
    allPosts.push(...inRange);

    if (oldestTime < CUTOFF) {
      reachedCutoff = true;
      break;
    }

    // Stop if pagination didn't move (channel doesn't have older posts)
    if (beforeNum && parseInt(beforeNum) === oldestNum) {
      break;
    }
    beforeNum = oldestNum;
    pages++;

    if (pages % 10 === 0) {
      console.log(`  [${channelId}] page ${pages}, ${allPosts.length} posts gathered, oldest ${oldest.date.substring(0,10)}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  return allPosts;
}

async function main() {
  const startTime = Date.now();
  const channelIds = Object.keys(CHANNELS);

  console.log(`Starting backfill from ${new Date(CUTOFF).toISOString()} for ${channelIds.length} channels`);
  console.log(`Max pages/channel: ${MAX_PAGES_PER_CHANNEL}, delay between requests: ${REQUEST_DELAY_MS}ms\n`);

  const allEvents = [];
  const stats = [];

  for (let i = 0; i < channelIds.length; i++) {
    const channelId = channelIds[i];
    const info = CHANNELS[channelId];
    console.log(`[${i+1}/${channelIds.length}] ${channelId} (${info.name})...`);

    const t0 = Date.now();
    const posts = await backfillChannel(channelId, info);
    const events = postsToEvents(posts, channelId, info);
    allEvents.push(...events);

    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`  → ${posts.length} posts (${events.length} war-related) in ${dt}s\n`);

    stats.push({ channel: channelId, posts: posts.length, warRelated: events.length, timeS: dt });
  }

  // Deduplicate by ID
  const seen = new Set();
  const deduped = allEvents.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  // Sort by date descending
  deduped.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  // Split by month for storage
  const byMonth = {};
  for (const event of deduped) {
    const month = event.startDate.substring(0, 7); // YYYY-MM
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(event);
  }

  const archiveDir = path.join(__dirname, '..', 'events', 'archive');
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

  for (const [month, events] of Object.entries(byMonth)) {
    const file = path.join(archiveDir, `${month}.json`);
    fs.writeFileSync(file, JSON.stringify(events));
    console.log(`Wrote ${events.length} events to events/archive/${month}.json`);
  }

  // Combined "all events from 2026" file the app can load in one fetch
  const allFile = path.join(__dirname, '..', 'events', 'all.json');
  fs.writeFileSync(allFile, JSON.stringify(deduped));
  console.log(`\nWrote ${deduped.length} total events to events/all.json`);

  const totalMs = Date.now() - startTime;
  console.log(`\nDone in ${(totalMs / 60000).toFixed(1)} minutes`);
  console.log(`Total events: ${deduped.length}`);
  console.log(`File size of all.json: ${(fs.statSync(allFile).size / 1024 / 1024).toFixed(1)} MB`);

  fs.writeFileSync(path.join(__dirname, '..', 'events', 'backfill-stats.json'), JSON.stringify({
    runAt: new Date().toISOString(),
    cutoff: new Date(CUTOFF).toISOString(),
    totalEvents: deduped.length,
    durationMinutes: (totalMs / 60000).toFixed(1),
    channels: stats,
  }, null, 2));
}

main().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
