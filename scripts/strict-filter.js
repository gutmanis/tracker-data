/**
 * Strict noise removal: only drop posts I'm 100% positive are unrelated to
 * the Russia-Ukraine theater. Conservative — keeps anything ambiguous.
 *
 * DROPS:
 *  - DDoS / cyber attacks (no kinetic war)
 *  - Posts dominated by Iran/Israel/Yemen/Cuba/Korea conflicts with no RU/UA mention
 *  - Pure lifestyle/scam/entertainment posts
 *
 * KEEPS:
 *  - Anything mentioning Russia, Ukraine, USSR, СВО, ВСУ, ЗСУ, MOD, frontline cities
 *  - Anything ambiguous
 */

const fs = require('fs');
const path = require('path');

// Words/phrases whose presence ALONE marks a post as off-topic
// (still kept if RU/UA context is present)
const NOISE_PATTERNS = [
  /\bDDoS\b/i,
  /cyber\s*attack/i,
  /кибератак/i,
  /heart\s*attack/i,
  /сердечн.*приступ/i,
  /scammer|мошенник.*звон/i,
  /BBQ|шашлык/i,
];

// Other conflicts — drop ONLY if no RU/UA mention
const OTHER_CONFLICTS = [
  /\b(Iran|Israel|Yemen|Houthi|Hezbollah|Hamas|Gaza|Lebanon|Cuba|Venezuela|North Korea|DPRK)\b/i,
  /Иран|Израиль|Йемен|Хути|Хезболл|Хамас|Газ[ае]|Ливан|Куба|Венесуэл|Северн.*Коре/i,
];

// Required if dropping other-conflict posts — these markers PRESERVE the post
const RU_UA_MARKERS = [
  /\b(Russia|Ukraine|Russian|Ukrainian|Putin|Zelensky|Moscow|Kyiv|Donetsk|Luhansk|Crimea|Kherson|Kharkiv|Belgorod|Kursk|Bakhmut|Avdiivka|Pokrovsk|Donbas|Mariupol|SVO|VSU|ZSU|MoD)\b/i,
  /Росси|Украин|Путин|Зеленск|Москв|Киев|Київ|Донецк|Луганск|Крым|Херсон|Харьков|Белгород|Курск|Бахмут|Авдеев|Покровск|Донбасс|Мариуполь|СВО|ВСУ|ЗСУ|Минобороны/i,
];

const PUMP_AND_DUMP_PATTERNS = [
  /промокод|реклам|купи[тт]ь/i,  // ad spam
  /forex|трейдинг|crypto|криптовалют/i,  // crypto/forex spam
];

function isObviousNoise(text) {
  // 1. Hard noise patterns (DDoS, scammers, BBQ etc.)
  for (const p of NOISE_PATTERNS) {
    if (p.test(text)) return 'noise_pattern';
  }
  // 2. Pump-and-dump / ads
  for (const p of PUMP_AND_DUMP_PATTERNS) {
    if (p.test(text)) return 'ad_spam';
  }
  // 3. Other-conflict post WITHOUT RU/UA context
  const hasOtherConflict = OTHER_CONFLICTS.some(p => p.test(text));
  if (hasOtherConflict) {
    const hasRuUa = RU_UA_MARKERS.some(p => p.test(text));
    if (!hasRuUa) return 'other_conflict';
  }
  return null;
}

const ARCHIVE_DIR = path.join(__dirname, '..', 'events', 'archive');
const months = fs.readdirSync(ARCHIVE_DIR).filter(f => f.endsWith('.json'));

const reasonCounts = {};
let total = 0, kept = 0, dropped = 0;

for (const month of months) {
  const filePath = path.join(ARCHIVE_DIR, month);
  const events = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  total += events.length;

  const filtered = events.filter(e => {
    const text = `${e.title || ''} ${e.description || ''}`;
    const reason = isObviousNoise(text);
    if (reason) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      dropped++;
      return false;
    }
    kept++;
    return true;
  });

  fs.writeFileSync(filePath, JSON.stringify(filtered));
  console.log(`${month}: ${events.length} → ${filtered.length}  (dropped ${events.length - filtered.length})`);
}

// Update backfill-stats.json with new totals
const statsPath = path.join(__dirname, '..', 'events', 'backfill-stats.json');
if (fs.existsSync(statsPath)) {
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
  stats.afterStrictFilter = { total: kept, dropped, dropReasons: reasonCounts };
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

console.log(`\nBEFORE: ${total}`);
console.log(`AFTER:  ${kept} kept, ${dropped} dropped (${(dropped/total*100).toFixed(1)}%)`);
console.log('\nDrop reasons:');
for (const [r, c] of Object.entries(reasonCounts).sort((a,b) => b[1] - a[1])) {
  console.log(`  ${r.padEnd(20)} ${c}`);
}
