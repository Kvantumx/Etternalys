import axios from 'axios';

const EO_API = 'https://api.etternaonline.com/api';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

export default async function handler(req, res) {
  try {
    const { username } = req.query;
    const firstPage = await axios.get(`${EO_API}/users/${username}/scores?page=1`, { headers: HEADERS, timeout: 10000 });
    const data = firstPage.data.data || [];
    const meta = firstPage.data.meta || {};
    const lastPage = meta.last_page || 1;

    if (lastPage > 1) {
      const restPages = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, i) =>
          axios.get(`${EO_API}/users/${username}/scores?page=${i + 2}`, { headers: HEADERS, timeout: 10000 })
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
}
