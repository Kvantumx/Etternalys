import axios from 'axios';

const EO_API = 'https://api.etternaonline.com/api';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

export default async function handler(req, res) {
  const rank = parseInt(req.query.rank, 10);
  if (isNaN(rank) || rank < 1) return res.status(400).json({ error: 'Invalid rank' });

  const perPage = 25;
  const targetPage = Math.ceil(rank / perPage);

  try {
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
    const firstRank = (pagesToFetch[0] - 1) * perPage + 1;
    const ranked = allEntries.map((e, i) => ({ ...e, rank: firstRank + i }));

    res.json({ data: ranked, total: meta.total || 0, last_page: meta.last_page || 0 });
  } catch (e) {
    console.error('Leaderboard at rank error:', e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
}
