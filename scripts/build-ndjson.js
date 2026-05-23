/**
 * Aggregate all monthly archives + latest.json into a single gzipped NDJSON file.
 * Output: events/all.ndjson.gz  (~20MB, fits well under GitHub's 100MB limit)
 *
 * Output schema: one event JSON per line, sorted newest-first.
 * Browser decompresses with native DecompressionStream('gzip'), then parses line-by-line.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ARCHIVE_DIR = path.join(__dirname, '..', 'events', 'archive');
const LATEST = path.join(__dirname, '..', 'events', 'latest.json');
const OUT = path.join(__dirname, '..', 'events', 'all.ndjson.gz');

function loadEvents() {
  const all = [];
  if (fs.existsSync(ARCHIVE_DIR)) {
    for (const f of fs.readdirSync(ARCHIVE_DIR).filter(f => f.endsWith('.json'))) {
      const events = JSON.parse(fs.readFileSync(path.join(ARCHIVE_DIR, f), 'utf-8'));
      all.push(...events);
    }
  }
  if (fs.existsSync(LATEST)) {
    const latest = JSON.parse(fs.readFileSync(LATEST, 'utf-8'));
    all.push(...latest);
  }

  // Dedupe by id
  const seen = new Set();
  const deduped = all.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  // Sort newest first
  deduped.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  return deduped;
}

function main() {
  console.log('Loading events from archive + latest...');
  const events = loadEvents();
  console.log(`Total deduped events: ${events.length.toLocaleString()}`);

  // Write as NDJSON (one event per line) directly into gzip stream
  const gzip = zlib.createGzip({ level: 9 });
  const out = fs.createWriteStream(OUT);
  gzip.pipe(out);

  for (const e of events) {
    gzip.write(JSON.stringify(e) + '\n');
  }
  gzip.end();

  out.on('finish', () => {
    const size = fs.statSync(OUT).size;
    console.log(`Wrote ${OUT}`);
    console.log(`Size: ${(size / 1024 / 1024).toFixed(1)} MB`);
    console.log(`Avg per event: ${Math.round(size / events.length)} bytes`);
  });
}

main();
