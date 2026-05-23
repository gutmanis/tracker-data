/**
 * Emits a backfill status snapshot every 15 minutes until completion.
 * Designed to be run inside the Monitor tool — each emit becomes a notification.
 */

const fs = require('fs');

const LOG = 'C:\\Users\\alan\\AppData\\Local\\Temp\\claude\\D--Claude-Code\\ac8a60b5-febd-4073-8cf0-fd6321c79491\\tasks\\ba3783tqq.output';
const INTERVAL_MS = 15 * 60 * 1000;
const TOTAL_CHANNELS = 58;
const START_TIME = Date.now();

function emit() {
  let log = '';
  try { log = fs.readFileSync(LOG, 'utf-8'); } catch { return; }

  // Parse completed channels and their war counts
  const completedRegex = /^\[(\d+)\/\d+\]\s+(\S+).*?→\s+(\d+)\s+posts\s+\((\d+)\s+war-related\)\s+in\s+([\d.]+)s/gms;
  const completed = [];
  let m;
  while ((m = completedRegex.exec(log)) !== null) {
    completed.push({
      idx: parseInt(m[1]),
      channel: m[2],
      totalPosts: parseInt(m[3]),
      warPosts: parseInt(m[4]),
      seconds: parseFloat(m[5]),
    });
  }

  // Find currently-running channel (last [N/58] line without a → after it)
  const channelStarts = [...log.matchAll(/^\[(\d+)\/\d+\]\s+(\S+)/gm)];
  const lastStart = channelStarts[channelStarts.length - 1];
  const currentIdx = lastStart ? parseInt(lastStart[1]) : 0;
  const currentChannel = lastStart ? lastStart[2] : '';
  const isComplete = log.includes('Done in') || log.includes('Wrote ');

  // Find latest progress line for current channel
  const progressLines = [...log.matchAll(/\[\S+\]\s+page\s+(\d+),\s+(\d+)\s+posts\s+gathered,\s+oldest\s+(\S+)/g)];
  const lastProgress = progressLines[progressLines.length - 1];

  // Sum up totals
  const totalWar = completed.reduce((s, c) => s + c.warPosts, 0);
  const totalPosts = completed.reduce((s, c) => s + c.totalPosts, 0);
  const totalSecs = completed.reduce((s, c) => s + c.seconds, 0);
  const avgSecs = completed.length > 0 ? totalSecs / completed.length : 0;

  // ETA — weighted: tier-2 channels remaining likely heavy, tier-1 light
  const remaining = TOTAL_CHANNELS - currentIdx;
  // Heuristic: first half avg ~5min, back half ~1.5min
  const remainingTier2 = Math.min(remaining, Math.max(0, 32 - completed.length));
  const remainingTier1 = remaining - remainingTier2;
  const etaSecs = remainingTier2 * 240 + remainingTier1 * 90;
  const etaMin = Math.round(etaSecs / 60);

  const elapsed = ((Date.now() - START_TIME) / 60000).toFixed(0);

  if (isComplete) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  BACKFILL COMPLETE · ${completed.length} channels · ${totalWar.toLocaleString()} war events`);
    console.log(`  Total posts scraped: ${totalPosts.toLocaleString()}`);
    console.log(`  Top 5 by war events: ${completed.sort((a,b) => b.warPosts - a.warPosts).slice(0,5).map(c => `${c.channel} (${c.warPosts})`).join(', ')}`);
    console.log('═══════════════════════════════════════════════════════════════');
    return true;
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  BACKFILL STATUS · monitor +${elapsed}m · ${new Date().toISOString().substring(11,16)}Z`);
  console.log(`  Channels: ${currentIdx}/${TOTAL_CHANNELS} (${Math.round(currentIdx/TOTAL_CHANNELS*100)}%)`);
  console.log(`  War events so far: ${totalWar.toLocaleString()}`);
  console.log(`  Currently scraping: ${currentChannel}${lastProgress ? ` (page ${lastProgress[1]}, oldest ${lastProgress[3].substring(0,10)})` : ''}`);
  console.log(`  Avg per completed channel: ${avgSecs.toFixed(0)}s`);
  console.log(`  ETA: ~${etaMin}m remaining`);
  console.log('═══════════════════════════════════════════════════════════════');
  return false;
}

(async function main() {
  // Wait 15 min, then emit, then loop. Don't emit immediately to space out updates.
  while (true) {
    await new Promise(r => setTimeout(r, INTERVAL_MS));
    const done = emit();
    if (done) process.exit(0);
  }
})();
