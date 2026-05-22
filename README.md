# tracker-data

Auto-updated data store for the [Tracker](https://github.com/gutmanis/tracker) app.

Updated every 6 hours by GitHub Actions.

## Structure

```
events/
  latest.json          — most recent scraped events (last 48h)
  YYYY-MM-DD.json      — daily snapshots
territory/
  latest.geojson       — Russian-controlled territory (from DeepStateMap)
```

## Sources

| Source | Bias | Method |
|--------|------|--------|
| Telegram: Rybar | Pro-Russian | Web preview |
| Telegram: Colonel Cassad | Pro-Russian | Web preview |
| Telegram: Two Majors | Pro-Russian | Web preview |
| Telegram: RVvoenkor | Pro-Russian | Web preview |
| Telegram: GeoConfirmed | Neutral | Web preview |
| Telegram: DeepStateUA | Pro-Ukrainian | Web preview |
| DeepStateMap GeoJSON | Pro-Ukrainian | GitHub raw |

Data from all sides is included and tagged with source bias.
