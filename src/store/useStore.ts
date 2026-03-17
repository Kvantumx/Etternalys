import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { UserData, UserRanks, DataSnapshot, LeaderboardEntry, TrackedPack } from '../types';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

const MAX_SNAPSHOTS = 200;

interface AppState {
  // Auth
  user: User | null;
  authLoading: boolean;

  // App data
  username: string;
  userData: UserData | null;
  userRanks: UserRanks | null;
  snapshots: DataSnapshot[];
  leaderboard: LeaderboardEntry[];
  packs: TrackedPack[];
  lastRefresh: number;
  isLoading: boolean;
  error: string | null;

  // Auth actions
  initAuth: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, ettUsername: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Data actions
  loadUserData: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
  addPack: (packId: number) => Promise<void>;
  refreshPack: (packId: number) => Promise<void>;
  removePack: (packId: number) => Promise<void>;
  setUsername: (username: string) => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  user: null,
  authLoading: true,
  username: '',
  userData: null,
  userRanks: null,
  snapshots: [],
  leaderboard: [],
  packs: [],
  lastRefresh: 0,
  isLoading: false,
  error: null,

  initAuth: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null, authLoading: false });
      if (session?.user) get().loadUserData();
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      const prevUser = get().user;
      set({ user: session?.user ?? null, authLoading: false });
      if (session?.user && !prevUser) {
        get().loadUserData();
      } else if (!session?.user) {
        set({
          username: '', userData: null, userRanks: null,
          snapshots: [], packs: [], lastRefresh: 0,
        });
      }
    });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password, ettUsername) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // Set the etterna username on the profile (trigger creates the profile row)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        etterna_username: ettUsername,
        updated_at: new Date().toISOString(),
      });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null, username: '', userData: null, userRanks: null,
      snapshots: [], packs: [], lastRefresh: 0,
    });
  },

  loadUserData: async () => {
    const { user } = get();
    if (!user) return;

    const [profileRes, packsRes, snapshotsRes] = await Promise.all([
      supabase.from('profiles').select('etterna_username').eq('id', user.id).single(),
      supabase.from('user_packs').select('*').eq('user_id', user.id).order('added_at', { ascending: true }),
      supabase.from('snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('snapshot_timestamp', { ascending: false })
        .limit(MAX_SNAPSHOTS),
    ]);

    const ettUsername = profileRes.data?.etterna_username ?? '';

    const packs: TrackedPack[] = (packsRes.data ?? []).map(p => ({
      id: p.pack_id,
      name: p.pack_name,
      songs: p.songs_data ?? [],
      packOverall: Number(p.pack_overall),
      image: p.pack_image ?? null,
      addedAt: p.added_at,
      lastFetched: p.last_fetched,
    }));

    const snapshots: DataSnapshot[] = (snapshotsRes.data ?? []).reverse().map(s => ({
      timestamp: s.snapshot_timestamp,
      userData: s.user_data as UserData,
      userRanks: s.user_ranks as UserRanks,
    }));

    const lastRefresh = snapshots.length > 0 ? snapshots[snapshots.length - 1].timestamp : 0;
    set({ username: ettUsername, packs, snapshots, lastRefresh });
  },

  setUsername: async (username) => {
    const { user } = get();
    set({ username });
    if (user) {
      await supabase.from('profiles')
        .update({ etterna_username: username, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }
  },

  refresh: async () => {
    const { username, packs, user } = get();
    if (!username) return;
    set({ isLoading: true, error: null });
    try {
      const { userData, userRanks } = await api.getUser(username);
      const snapshot: DataSnapshot = { timestamp: Date.now(), userData, userRanks };

      if (user) {
        await supabase.from('snapshots').insert({
          user_id: user.id,
          snapshot_timestamp: snapshot.timestamp,
          user_data: userData,
          user_ranks: userRanks,
        });

        // Keep only the last MAX_SNAPSHOTS, delete older ones
        const { data: allSnaps } = await supabase
          .from('snapshots')
          .select('id, snapshot_timestamp')
          .eq('user_id', user.id)
          .order('snapshot_timestamp', { ascending: false });

        if (allSnaps && allSnaps.length > MAX_SNAPSHOTS) {
          const toDelete = allSnaps.slice(MAX_SNAPSHOTS).map(s => s.id);
          await supabase.from('snapshots').delete().in('id', toDelete);
        }
      }

      set((state) => ({
        userData,
        userRanks,
        snapshots: [...state.snapshots, snapshot].slice(-MAX_SNAPSHOTS),
        lastRefresh: snapshot.timestamp,
        isLoading: false,
        error: null,
      }));

      // Silently refresh all tracked packs in the background
      if (packs.length > 0) {
        Promise.all(packs.map(p => api.getPack(p.id, username)))
          .then(async refreshed => {
            if (user) {
              await Promise.all(refreshed.map(pack =>
                supabase.from('user_packs').update({
                  pack_name: pack.name,
                  pack_overall: pack.packOverall,
                  songs_data: pack.songs,
                  last_fetched: pack.lastFetched,
                }).eq('user_id', user.id).eq('pack_id', pack.id)
              )).catch(() => {});
            }
            set((state) => ({
              packs: state.packs.map(p => {
                const updated = refreshed.find(r => r.id === p.id);
                return updated ? { ...updated, addedAt: p.addedAt } : p;
              }),
            }));
          })
          .catch(() => {});
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      set({ error: msg, isLoading: false });
    }
  },

  refreshLeaderboard: async () => {
    try {
      const leaderboard = await api.getLeaderboard();
      set({ leaderboard });
    } catch {
      // Leaderboard is optional, don't block UI
    }
  },

  refreshPack: async (packId) => {
    const { username, user } = get();
    const pack = await api.getPack(packId, username);
    if (user) {
      await supabase.from('user_packs').update({
        pack_name: pack.name,
        pack_overall: pack.packOverall,
        pack_image: pack.image,
        songs_data: pack.songs,
        last_fetched: pack.lastFetched,
      }).eq('user_id', user.id).eq('pack_id', packId);
    }
    set((state) => ({
      packs: state.packs.map(p => p.id === packId ? { ...pack, addedAt: p.addedAt } : p),
    }));
  },

  addPack: async (packId) => {
    const { username, user } = get();
    try {
      const pack = await api.getPack(packId, username);
      if (user) {
        await supabase.from('user_packs').upsert({
          user_id: user.id,
          pack_id: packId,
          pack_name: pack.name,
          pack_overall: pack.packOverall,
          pack_image: pack.image,
          songs_data: pack.songs,
          added_at: pack.addedAt,
          last_fetched: pack.lastFetched,
        });
      }
      set((state) => ({
        packs: [...state.packs.filter(p => p.id !== packId), pack],
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      throw new Error(`Failed to add pack: ${msg}`);
    }
  },

  removePack: async (packId) => {
    const { user } = get();
    if (user) {
      await supabase.from('user_packs').delete().eq('user_id', user.id).eq('pack_id', packId);
    }
    set((state) => ({
      packs: state.packs.filter(p => p.id !== packId),
    }));
  },
}));
