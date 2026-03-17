import axios from 'axios';
import type { UserData, UserRanks, LeaderboardEntry, TrackedPack } from '../types';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

export const api = {
  async getUser(username: string): Promise<{ userData: UserData; userRanks: UserRanks }> {
    const { data: resp } = await axios.get(`${BASE}/user/${username}`);
    const d = resp.data;

    const userData: UserData = {
      username: d.username,
      avatar_url: d.avatar_thumb || d.avatar || '',
      country_code: d.country || '',
      player_rating: parseFloat(d.overall) || 0,
      rank: d.rank || 0,
      rating: {
        overall:    parseFloat(d.overall)    || 0,
        stream:     parseFloat(d.stream)     || 0,
        jumpstream: parseFloat(d.jumpstream) || 0,
        handstream: parseFloat(d.handstream) || 0,
        stamina:    parseFloat(d.stamina)    || 0,
        jacks:      parseFloat(d.jacks)      || 0,
        chordjacks: parseFloat(d.chordjacks) || 0,
        technical:  parseFloat(d.technical)  || 0,
      },
    };

    const sr = d.skillset_ranks || {};
    const userRanks: UserRanks = {
      overall:    d.rank        || 0,
      stream:     sr.stream     || 0,
      jumpstream: sr.jumpstream || 0,
      handstream: sr.handstream || 0,
      stamina:    sr.stamina    || 0,
      jacks:      sr.jacks      || 0,
      chordjacks: sr.chordjacks || 0,
      technical:  sr.technical  || 0,
    };

    return { userData, userRanks };
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data: resp } = await axios.get(`${BASE}/leaderboard`);
    const entries: Array<Record<string, unknown>> = Array.isArray(resp) ? resp : (resp.data || []);
    return entries.map((e, i) => ({
      rank: i + 1,
      username: String(e.username || ''),
      rating: parseFloat(String(e.overall || 0)),
      avatar: String(e.avatar_thumb || ''),
      country: String(e.country || ''),
    }));
  },

  async getPack(packId: number, username: string): Promise<TrackedPack> {
    // Fetch pack info, songs, and user scores in parallel
    const [packResp, songsResp, scoresResp] = await Promise.all([
      axios.get(`${BASE}/pack/${packId}`),
      axios.get(`${BASE}/pack/${packId}/songs`),
      axios.get(`${BASE}/user/${username}/scores?pages=10`).catch(() => ({ data: { data: [] } })),
    ]);

    const packData = packResp.data.data || packResp.data;
    const songsData: Array<Record<string, unknown>> = songsResp.data.data || [];
    const scoresData: Array<Record<string, unknown>> = scoresResp.data.data || [];

    // Build a map of song_id → best wife score
    const scoresBySongId = new Map<number, number>();
    for (const score of scoresData) {
      if (!score.valid) continue;
      const song = score.song as Record<string, unknown> | undefined;
      const songId = Number(song?.id || 0);
      const wife = typeof score.wife === 'number' ? score.wife : parseFloat(String(score.wife || 0));
      if (songId && wife > 0) {
        const existing = scoresBySongId.get(songId) || 0;
        if (wife > existing) scoresBySongId.set(songId, wife);
      }
    }

    // Build pack songs list
    const songs = songsData.map((song) => {
      const charts = (song.charts as Array<Record<string, unknown>>) || [];
      const maxMsd = charts.reduce((max, c) => {
        const msd = parseFloat(String(c.msd || c.overall || 0));
        return msd > max ? msd : max;
      }, 0);
      const songId = Number(song.id || 0);
      return {
        id: songId,
        name: String(song.name || ''),
        artist: String(song.artist || ''),
        chartkey: '',
        msd: maxMsd,
        wifeScore: scoresBySongId.get(songId),
      };
    });

    return {
      id: packId,
      name: String(packData.name || packData.packname || `Pack ${packId}`),
      songs,
      packOverall: parseFloat(String(packData.overall || packData.average || 0)) || 0,
      addedAt: Date.now(),
      lastFetched: Date.now(),
    };
  },
};
