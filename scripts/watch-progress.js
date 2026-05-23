/**
 * Live progress monitor for the backfill.
 * Run alongside backfill.js: node scripts/watch-progress.js
 */
const fs = require('fs');
const path = require('path');

const LOG_FILE = process.argv[2] || 'C:\\Users\\alan\\AppData\\Local\\Temp\\claude\\D--Claude-Code\\ac8a60b5-febd-4073-8cf0-fd6321c79491\\tasks\\ba3783tqq.output';
const START_TIME = Date.now();
const TOTAL_CHANNELS = 58;

const bar = (pct, width = 30) => {
  const filled = Math.round(width * pct);
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + ']';
};

const fmtDuration = (ms) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
};

function tick() {
  let log = '';
  try { log = fs.readFileSync(LOG_FILE, 'utf-8'); } catch { return; }

  const lines = log.split('\n');

  // Find the last channel started
  let currentChannel = null;
  let currentIndex = 0;
  let totalEvents = 0;
  let pagesDone = 0;
  let oldestDate = null;
  let completedChannels = 0;

  for (const line of lines) {
    const startMatch = line.match(/\[(\d+)\/\d+\]\s+(\S+)/);
    if (startMatch) {
      currentIndex = parseInt(startMatch[1]);
      currentChannel = startMatch[2];
      completedChannels = currentIndex - 1;
    }
    const progMatch = line.match(/\[\S+\]\s+page\s+(\d+),\s+(\d+)\s+posts\s+gathered,\s+oldest\s+(\S+)/);
    if (progMatch) {
      pagesDone = parseInt(progMatch[1]);
      totalEvents = parseInt(progMatch[2]);
      oldestDate = progMatch[3];
    }
    const doneMatch = line.match(/→\s+(\d+)\s+posts/);
    if (doneMatch) {
      completedChannels = currentIndex;
    }
  }

  const elapsedMs = Date.now() - START_TIME;
  const channelPct = currentIndex / TOTAL_CHANNELS;
  const remainingMs = elapsedMs / Math.max(channelPct, 0.01) - elapsedMs;

  // Clear screen + redraw
  console.clear();
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TRACKER · BACKFILL PROGRESS · 2026-01-01 → NOW         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`  Channels:  ${bar(channelPct)}  ${currentIndex}/${TOTAL_CHANNELS}`);
  console.log(`  Current:   ${currentChannel || '...'}`);
  if (oldestDate) {
    console.log(`  Page ${pagesDone}, ${totalEvents} posts gathered, reaching back to ${oldestDate}`);
  }
  console.log();
  console.log(`  Elapsed:   ${fmtDuration(elapsedMs)}`);
  console.log(`  ETA:       ${fmtDuration(remainingMs)}`);
  console.log();
  console.log('  (Refreshing every 2s. Ctrl+C to exit.)\n');
}

tick();
setInterval(tick, 2000);
