/**
 * Pull latest Russian-controlled territory GeoJSON from DeepStateMap GitHub
 */
const fs = require('fs');
const path = require('path');

const BASE = 'https://raw.githubusercontent.com/cyterat/deepstate-map-data/main/data';

function formatDate(d) {
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

async function main() {
  const { default: fetch } = await import('node-fetch');
  const today = new Date();

  for (let i = 0; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const url = `${BASE}/deepstatemap_data_${dateStr}.geojson`;

    console.log(`Trying: ${url}`);
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.text();
      const outDir = path.join(__dirname, '..', 'territory');
      fs.writeFileSync(path.join(outDir, 'latest.geojson'), data);
      fs.writeFileSync(path.join(outDir, `${dateStr}.geojson`), data);
      console.log(`Saved territory data for ${dateStr}`);
      return;
    }
  }

  console.error('Could not find recent territory data');
  process.exit(1);
}

main().catch(console.error);
