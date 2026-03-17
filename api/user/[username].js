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
    const r = await axios.get(`${EO_API}/users/${username}`, { headers: HEADERS, timeout: 10000 });
    res.json(r.data);
  } catch (e) {
    console.error('User fetch error:', e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
}
