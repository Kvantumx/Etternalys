const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const EO_API = 'https://api.etternaonline.com/api';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

// User profile (includes skillset ratings AND ranks)
app.get('/api/user/:username', async (req, res) => {
  try {
    const r = await axios.get(`${EO_API}/users/${req.params.username}`, { headers: HEADERS, timeout: 10000 });
    res.json(r.data);
  } catch (e) {
    console.error('User fetch error:', e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
});

// Global leaderboard top 100 (for initial display)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const pages = await Promise.all([1, 2, 3, 4].map(page =>
      axios.get(`${EO_API}/leaderboards/global?page=${page}`, { headers: HEADERS, timeout: 10000 })
        .then(r => r.data.data || [])
        .catch(() => [])
    ));
    res.json({ data: pages.flat() });
  } catch (e) {
    console.error('Leaderboard fetch error:', e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
});

// Leaderboard entries around a specific rank (on-demand)
app.get('/api/leaderboard/at/:rank', async (req, res) => {
  const rank = parseInt(req.params.rank, 10);
  if (isNaN(rank) || rank < 1) return res.status(400).json({ error: 'Invalid rank' });

  const perPage = 25;
  const targetPage = Math.ceil(rank / perPage);

  try {
    // Fetch the target page + adjacent pages to have context
    const pagesToFetch = [...new Set([
      Math.max(1, targetPage - 1),
      targetPage,
      targetPage + 1,
    ])];

    const results = await Promise.all(
      pagesToFetch.map(page =>
        axios.get(`${EO_API}/leaderboards/global?page=${page}`, { headers: HEADERS, timeout: 10000 })
          .then(r => ({ data: r.data.data || [], meta: r.data.meta || {} }))
          .catch(() => ({ data: [], meta: {} }))
      )
    );

    const allEntries = results.flatMap(r => r.data);
    const meta = results[1]?.meta || results[0]?.meta || {};

    // Add rank numbers based on position
    const firstRank = (pagesToFetch[0] - 1) * perPage + 1;
    const ranked = allEntries.map((e, i) => ({ ...e, rank: firstRank + i }));

    res.json({ data: ranked, total: meta.total || 0, last_page: meta.last_page || 0 });
  } catch (e) {
    console.error('Leaderboard at rank error:', e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
});

// Pack listing (with search/sort/pagination)
app.get('/api/packs', async (req, res) => {
  try {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (value !== undefined && value !== '') params.set(key, String(value));
    }
    const r = await axios.get(`${EO_API}/packs?${params}`, { headers: HEADERS, timeout: 10000 });
    res.json(r.data);
  } catch (e) {
    console.error('Packs fetch error:', e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
});

// Pack info
app.get('/api/pack/:id', async (req, res) => {
  try {
    const r = await axios.get(`${EO_API}/packs/${req.params.id}`, { headers: HEADERS, timeout: 10000 });
    res.json(r.data);
  } catch (e) {
    console.error('Pack fetch error:', e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
});

// Pack songs (with chart MSD data) — fetches ALL pages
app.get('/api/pack/:id/songs', async (req, res) => {
  try {
    const first = await axios.get(`${EO_API}/packs/${req.params.id}/songs?page=1`, { headers: HEADERS, timeout: 15000 });
    const meta = first.data.meta || {};
    const lastPage = meta.last_page || 1;
    let allSongs = first.data.data || [];

    if (lastPage > 1) {
      const rest = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, i) =>
          axios.get(`${EO_API}/packs/${req.params.id}/songs?page=${i + 2}`, { headers: HEADERS, timeout: 15000 })
            .then(r => r.data.data || [])
            .catch(() => [])
        )
      );
      allSongs = [...allSongs, ...rest.flat()];
    }

    res.json({ data: allSongs });
  } catch (e) {
    console.error('Pack songs fetch error:', e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
});

// User scores — fetches ALL pages
app.get('/api/user/:username/scores', async (req, res) => {
  try {
    const firstPage = await axios.get(`${EO_API}/users/${req.params.username}/scores?page=1`, { headers: HEADERS, timeout: 10000 });
    const data = firstPage.data.data || [];
    const meta = firstPage.data.meta || {};
    const lastPage = meta.last_page || 1;

    if (lastPage > 1) {
      const restPages = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, i) =>
          axios.get(`${EO_API}/users/${req.params.username}/scores?page=${i + 2}`, { headers: HEADERS, timeout: 10000 })
            .then(r => r.data.data || [])
            .catch(() => [])
        )
      );
      res.json({ data: [...data, ...restPages.flat()] });
    } else {
      res.json({ data });
    }
  } catch (e) {
    console.error('Scores fetch error:', e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n  Etterna Proxy Server running on http://localhost:${PORT}`);
  console.log(`  API: ${EO_API}\n`);
});
