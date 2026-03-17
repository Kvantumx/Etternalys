import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getDivision } from '../utils/divisions';
import DivisionBadge from '../components/DivisionBadge';
import { useStore } from '../store/useStore';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

const SORT_OPTIONS = [
  { value: 'name',       label: 'Name'       },
  { value: 'popularity', label: 'Popularity' },
  { value: 'date',       label: 'Date'       },
  { value: 'overall',    label: 'Overall'    },
  { value: 'stream',     label: 'Stream'     },
  { value: 'jumpstream', label: 'Jumpstream' },
  { value: 'handstream', label: 'Handstream' },
  { value: 'jacks',      label: 'Jacks'      },
  { value: 'chordjacks', label: 'Chordjacks' },
  { value: 'stamina',    label: 'Stamina'    },
  { value: 'technical',  label: 'Technical'  },
];

// Default order for each sort — name goes A→Z, rest go highest/newest first
const DEFAULT_ORDERS: Record<string, 'asc' | 'desc'> = {
  name: 'asc',
  date: 'desc',
  popularity: 'desc',
  overall: 'desc',
  stream: 'desc', jumpstream: 'desc', handstream: 'desc',
  jacks: 'desc', chordjacks: 'desc', stamina: 'desc', technical: 'desc',
};

const KEY_COUNTS = ['4k', '5k', '6k', '7k', '8k', '9k', '10k'];

const COMMON_TAGS = [
  'keyboard', 'pad', 'x-mod', 'modfiles', 'hybrid', 'meme',
  'index', 'anime', 'chordjacks', 'streams', 'jumpstreams',
  'handstreams', 'stamina', 'jacks', 'technical',
];

// Division ranges (must match divisions.ts)
const DIVISION_RANGES: Record<string, { min: number; max: number }> = {
  'Chocolate':                  { min: 0,  max: 4  },
  'Bronze':                     { min: 5,  max: 8  },
  'Silver':                     { min: 9,  max: 12 },
  'Gold':                       { min: 13, max: 16 },
  'Platinum':                   { min: 17, max: 20 },
  'Emerald':                    { min: 21, max: 24 },
  'Diamond':                    { min: 25, max: 28 },
  'Master':                     { min: 29, max: 32 },
  'GrandMaster':                { min: 33, max: 36 },
  'TrueLastBoss':               { min: 37, max: 40 },
  'Undefined Fantastic Object': { min: 40, max: 999 },
};

const TIERS: { name: string; rating: number }[] = [
  { name: 'Chocolate',                  rating: 2  },
  { name: 'Bronze',                     rating: 6  },
  { name: 'Silver',                     rating: 10 },
  { name: 'Gold',                       rating: 14 },
  { name: 'Platinum',                   rating: 18 },
  { name: 'Emerald',                    rating: 22 },
  { name: 'Diamond',                    rating: 26 },
  { name: 'Master',                     rating: 30 },
  { name: 'GrandMaster',               rating: 34 },
  { name: 'TrueLastBoss',              rating: 38 },
  { name: 'Undefined Fantastic Object', rating: 41 },
];

const TIER_PAGE_SIZE = 36;

interface RawPack {
  id: number | string;
  name?: string; packname?: string;
  overall?: string | number;
  song_count?: number;
  created_at?: string;
  play_count?: number;
  tags?: Array<{ type: string; name: string } | string>;
  banner_path?: string;
  size?: string | number;
  download?: string;
}

interface PackData {
  id: number;
  name: string;
  overall: number;
  songCount: number | null;
  createdAt: string | null;
  playCount: number | null;
  tags: string[];
  image: string | null;
  size: string | null;
  downloadUrl: string | null;
}

function parsePacks(raw: unknown[]): PackData[] {
  return (raw as RawPack[]).map(p => ({
    id: Number(p.id),
    name: String(p.name || p.packname || ''),
    overall: parseFloat(String(p.overall ?? 0)) || 0,
    songCount: p.song_count ?? null,
    createdAt: p.created_at ?? null,
    playCount: p.play_count ?? null,
    tags: (p.tags ?? []).map(t => (typeof t === 'string' ? t : t.name)),
    image: p.banner_path ?? null,
    size: p.size ? String(p.size) : null,
    downloadUrl: p.download ?? null,
  }));
}

// Dropdown component
function FilterDropdown({ label, open, onToggle, children }: {
  label: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, onToggle]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
          open ? 'bg-purple-600/20 text-purple-300 border-purple-600/50'
               : 'bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-600 hover:text-white'
        }`}
      >
        {label}
        <svg className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden min-w-[160px] animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

function BrowsePackCard({ pack }: { pack: PackData }) {
  const { addPack, packs: trackedPacks } = useStore();
  const [adding, setAdding] = useState(false);
  const isTracked = trackedPacks.some(p => p.id === pack.id);
  const division = pack.overall > 0 ? getDivision(pack.overall) : null;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isTracked || adding) return;
    setAdding(true);
    try { await addPack(pack.id); } finally { setAdding(false); }
  };

  return (
    <a href={`https://etternaonline.com/packs/${pack.id}`} target="_blank" rel="noopener noreferrer"
      className="card p-0 overflow-hidden flex flex-col hover:border-purple-600/40 transition-all duration-200 group">
      <div className="relative h-28 flex-shrink-0 bg-gray-800 overflow-hidden"
        style={pack.image ? { backgroundImage: `url(${pack.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
        {!pack.image && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-600 text-xs">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-transparent to-transparent" />
        {division && (
          <div className="absolute top-2 right-2">
            <DivisionBadge rating={pack.overall} noSubRank showRating={false} onImage size="sm" />
          </div>
        )}
        <div className="absolute bottom-2 left-3 flex items-center gap-3">
          {pack.overall > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold tabular-nums"
              style={{ color: division?.division.textColor ?? '#fff' }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {pack.overall.toFixed(2)}
            </span>
          )}
          {pack.playCount !== null && pack.playCount > 0 && (
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              {pack.playCount.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="text-white font-semibold text-sm leading-snug group-hover:text-purple-300 transition-colors line-clamp-2" title={pack.name}>
          {pack.name}
        </h3>
        {pack.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pack.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-600 mt-auto flex-wrap">
          {pack.songCount !== null && pack.songCount > 0 && <span>{pack.songCount} songs</span>}
          {pack.size && <span>{pack.size}</span>}
          {pack.downloadUrl && (
            <a href={pack.downloadUrl} onClick={e => e.stopPropagation()}
              className="ml-auto text-gray-500 hover:text-purple-400 transition-colors" title="Download">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          )}
        </div>
        <button onClick={handleAdd} disabled={isTracked || adding}
          className={`w-full text-xs py-1.5 rounded-lg font-medium transition-all duration-200 mt-1 ${
            isTracked ? 'bg-gray-800/60 text-gray-500 cursor-default'
              : adding ? 'bg-purple-600/20 text-purple-400 cursor-wait'
              : 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 border border-purple-600/30 hover:border-purple-600/60'
          }`}>
          {isTracked ? '✓ Tracked' : adding ? 'Adding…' : '+ Track'}
        </button>
      </div>
    </a>
  );
}

export default function PackBrowser() {
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [sortOpen, setSortOpen] = useState(false);
  const [keyCountOpen, setKeyCountOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [keyCount, setKeyCount] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // Normal browse state
  const [packs, setPacks] = useState<PackData[]>([]);
  const [meta, setMeta] = useState<{ current_page: number; last_page: number; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Division tier filter state (server-wide fetch)
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [tierPacks, setTierPacks] = useState<PackData[]>([]);
  const [tierLoading, setTierLoading] = useState(false);
  const [tierProgress, setTierProgress] = useState(0); // pages fetched so far
  const [tierPage, setTierPage] = useState(1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setQuery(searchInput); setPage(1); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  // Sort click: same → toggle order, different → reset to default
  const handleSortClick = (val: string) => {
    if (val === sort) {
      setOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(val);
      setOrder(DEFAULT_ORDERS[val] ?? 'desc');
    }
    setPage(1);
    setSortOpen(false);
  };

  // Normal fetch (no tier filter)
  useEffect(() => {
    if (tierFilter) return;
    let cancelled = false;
    const fetchPacks = async () => {
      setLoading(true); setError('');
      try {
        const apiSort = order === 'desc' ? `-${sort}` : sort;
        const params = new URLSearchParams({ page: String(page), sort: apiSort });
        if (query) params.set('search', query);
        if (keyCount) params.set('keycount', keyCount);
        selectedTags.forEach(t => params.append('tags[]', t));

        const { data: resp } = await axios.get(`${BASE}/packs?${params}`);
        if (!cancelled) {
          let rawArr: unknown[] = [];
          let rawMeta = null;
          if (Array.isArray(resp)) rawArr = resp;
          else if (Array.isArray(resp?.data)) { rawArr = resp.data; rawMeta = resp.meta ?? null; }
          setPacks(parsePacks(rawArr));
          setMeta(rawMeta);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(`Failed to load packs: ${e instanceof Error ? e.message : 'Unknown error'}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPacks();
    return () => { cancelled = true; };
  }, [query, sort, order, keyCount, selectedTags, page, tierFilter]);

  // Tier filter: fetch ALL matching packs across all pages sorted by -overall
  useEffect(() => {
    if (!tierFilter) { setTierPacks([]); return; }
    const range = DIVISION_RANGES[tierFilter];
    if (!range) return;

    let cancelled = false;
    const BATCH = 5;

    const fetchAll = async () => {
      setTierLoading(true);
      setTierPacks([]);
      setTierPage(1);
      setTierProgress(0);

      const allMatches: PackData[] = [];
      let currentPage = 1;
      let totalPages = 100;

      while (currentPage <= totalPages) {
        const batch = Array.from({ length: BATCH }, (_, i) => currentPage + i)
          .filter(p => p <= totalPages);
        if (batch.length === 0) break;

        const results = await Promise.all(
          batch.map(p => {
            const params = new URLSearchParams({ page: String(p), sort: '-overall' });
            if (query) params.set('search', query);
            if (keyCount) params.set('keycount', keyCount);
            selectedTags.forEach(t => params.append('tags[]', t));
            return axios.get(`${BASE}/packs?${params}`)
              .then(r => ({ packs: parsePacks(r.data.data || []), meta: r.data.meta }))
              .catch(() => ({ packs: [] as PackData[], meta: null }));
          })
        );

        if (cancelled) return;

        let pastRange = false;

        for (const { packs: pagePacks, meta } of results) {
          if (meta?.last_page) totalPages = meta.last_page;

          const inRange = pagePacks.filter(p =>
            p.overall > 0 && p.overall >= range.min && p.overall <= range.max
          );
          allMatches.push(...inRange);

          // DESC: if the page's minimum overall is below rangeMin, we've gone past the division
          const overalls = pagePacks.map(p => p.overall).filter(o => o > 0);
          if (overalls.length > 0 && Math.min(...overalls) < range.min) {
            pastRange = true;
            break;
          }
        }

        setTierProgress(Math.min(currentPage + BATCH - 1, totalPages));
        setTierPacks([...allMatches]);

        if (pastRange) break;
        currentPage += BATCH;
      }

      if (!cancelled) setTierLoading(false);
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [tierFilter, query, keyCount, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    setPage(1);
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Sort';
  const lastPage = meta?.last_page ?? 1;
  const totalCount = meta?.total ?? null;

  // Tier pagination
  const tierLastPage = Math.ceil(tierPacks.length / TIER_PAGE_SIZE);
  const tierDisplayed = tierPacks.slice((tierPage - 1) * TIER_PAGE_SIZE, tierPage * TIER_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>Browse Packs</h1>
        <p className="text-gray-500 text-sm mt-1">
          Explore all packs available on Etterna Online
          {!tierFilter && totalCount !== null && !loading && (
            <span className="text-purple-400 font-medium"> · {totalCount.toLocaleString()} packs</span>
          )}
          {tierFilter && (
            <span className="text-purple-400 font-medium"> · {tierPacks.length} {tierFilter === 'Undefined Fantastic Object' ? 'UFO' : tierFilter} packs found{tierLoading ? '…' : ''}</span>
          )}
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort */}
        <FilterDropdown
          label={
            <span className="flex items-center gap-1">
              {currentSortLabel}
              <span className="text-purple-400 text-xs">{order === 'asc' ? '↑' : '↓'}</span>
            </span>
          }
          open={sortOpen}
          onToggle={() => { setSortOpen(o => !o); setKeyCountOpen(false); setTagsOpen(false); }}
        >
          {SORT_OPTIONS.map(o => (
            <button key={o.value} onClick={() => handleSortClick(o.value)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-800 flex items-center justify-between ${
                sort === o.value ? 'text-purple-300 bg-purple-950/40' : 'text-gray-300'
              }`}>
              {o.label}
              {sort === o.value && (
                <span className="text-purple-400 text-xs font-bold">{order === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </FilterDropdown>

        {/* Key Count */}
        <FilterDropdown label={keyCount ?? 'Key Count'} open={keyCountOpen}
          onToggle={() => { setKeyCountOpen(o => !o); setSortOpen(false); setTagsOpen(false); }}>
          <button onClick={() => { setKeyCount(null); setPage(1); setKeyCountOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-800 transition-colors ${!keyCount ? 'text-purple-300 bg-purple-950/40' : 'text-gray-300'}`}>
            Any
          </button>
          {KEY_COUNTS.map(k => (
            <button key={k} onClick={() => { setKeyCount(keyCount === k ? null : k); setPage(1); setKeyCountOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-800 transition-colors flex items-center justify-between ${keyCount === k ? 'text-purple-300 bg-purple-950/40' : 'text-gray-300'}`}>
              {k}
              {keyCount === k && <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </button>
          ))}
        </FilterDropdown>

        {/* Tags */}
        <FilterDropdown label={selectedTags.length > 0 ? `Tags (${selectedTags.length})` : 'Tags'} open={tagsOpen}
          onToggle={() => { setTagsOpen(o => !o); setSortOpen(false); setKeyCountOpen(false); }}>
          <div className="max-h-72 overflow-y-auto">
            {COMMON_TAGS.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-800 transition-colors flex items-center justify-between ${selectedTags.includes(tag) ? 'text-purple-300 bg-purple-950/40' : 'text-gray-300'}`}>
                {tag}
                {selectedTags.includes(tag) && <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <div className="border-t border-gray-800 p-2">
              <button onClick={() => { setSelectedTags([]); setPage(1); }}
                className="w-full text-xs text-red-400 hover:text-red-300 py-1.5 transition-colors">
                Clear tags
              </button>
            </div>
          )}
        </FilterDropdown>

        {/* Active tag pills */}
        {selectedTags.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-950/50 text-purple-300 border border-purple-700/50">
            #{tag}
            <button onClick={() => toggleTag(tag)} className="text-purple-400 hover:text-white transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}

        {/* Search */}
        <div className="relative ml-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search…" className="input-dark pl-9 w-52" />
          {searchInput && (
            <button onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Division tier filter pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTierFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
            tierFilter === null ? 'bg-purple-600/30 text-purple-300 border-purple-600/60'
              : 'bg-gray-800/50 text-gray-500 border-gray-700 hover:text-gray-300 hover:border-gray-600'
          }`}>
          All divisions
        </button>
        {TIERS.map(({ name, rating }) => {
          const div = getDivision(rating).division;
          const active = tierFilter === name;
          return (
            <button key={name} onClick={() => setTierFilter(active ? null : name)}
              className="px-3 py-1 rounded-full text-xs font-bold border transition-all duration-150"
              style={{
                backgroundColor: active ? `${div.color}44` : `${div.color}11`,
                color: div.textColor, borderColor: active ? `${div.color}bb` : `${div.color}33`,
                boxShadow: active ? `0 0 8px ${div.color}55` : 'none',
              }}>
              {name === 'Undefined Fantastic Object' ? 'UFO' : name}
            </button>
          );
        })}
      </div>

      {/* Tier loading progress bar */}
      {tierLoading && tierFilter && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (tierProgress / 47) * 100)}%`, background: 'linear-gradient(90deg, #7C3AED, #8B5CF6)' }} />
          </div>
          <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">
            {tierPacks.length} packs found…
          </span>
        </div>
      )}

      {/* Error */}
      {error && !tierFilter && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/50 text-red-300 text-sm">{error}</div>
      )}

      {/* Grid — tier mode */}
      {tierFilter ? (
        tierPacks.length === 0 && !tierLoading ? (
          <div className="text-center py-20 text-gray-500">No packs found for this division.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tierDisplayed.map(pack => <BrowsePackCard key={pack.id} pack={pack} />)}
            </div>
            {tierLastPage > 1 && !tierLoading && (
              <Pagination page={tierPage} lastPage={tierLastPage} loading={false} setPage={setTierPage} />
            )}
          </>
        )
      ) : (
        /* Grid — normal mode */
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card p-0 overflow-hidden animate-pulse">
                <div className="h-28 bg-gray-800" />
                <div className="p-3 flex flex-col gap-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                  <div className="h-7 bg-gray-800 rounded mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : packs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No packs found.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {packs.map(pack => <BrowsePackCard key={pack.id} pack={pack} />)}
            </div>
            {lastPage > 1 && <Pagination page={page} lastPage={lastPage} loading={loading} setPage={setPage} />}
          </>
        )
      )}
    </div>
  );
}

function PageBtn({ n, current, onClick }: { n: number; current: number; onClick: (n: number) => void }) {
  return (
    <button onClick={() => onClick(n)}
      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-150 ${
        n === current ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}>
      {n}
    </button>
  );
}

function Pagination({ page, lastPage, loading, setPage }: {
  page: number; lastPage: number; loading: boolean; setPage: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1 || loading}
        className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        ← Prev
      </button>
      <div className="flex items-center gap-1">
        {page > 3 && <><PageBtn n={1} current={page} onClick={setPage} />{page > 4 && <span className="text-gray-600 px-1">…</span>}</>}
        {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 2, lastPage - 4));
          return start + i;
        }).filter(n => n >= 1 && n <= lastPage).map(n => (
          <PageBtn key={n} n={n} current={page} onClick={setPage} />
        ))}
        {page < lastPage - 2 && <>{page < lastPage - 3 && <span className="text-gray-600 px-1">…</span>}<PageBtn n={lastPage} current={page} onClick={setPage} /></>}
      </div>
      <button onClick={() => setPage(Math.min(lastPage, page + 1))} disabled={page === lastPage || loading}
        className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        Next →
      </button>
    </div>
  );
}
