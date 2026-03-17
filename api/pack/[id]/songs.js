import axios from 'axios';

const EO_API = 'https://api.etternaonline.com/api';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const first = await axios.get(`${EO_API}/packs/${id}/songs?page=1`, { headers: HEADERS, timeout: 15000 });
    const meta = first.data.meta || {};
    const lastPage = meta.last_page || 1;
    let allSongs = first.data.data || [];

    if (lastPage > 1) {
      const rest = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, i) =>
          axios.get(`${EO_API}/packs/${id}/songs?page=${i + 2}`, { headers: HEADERS, timeout: 15000 })
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
}
