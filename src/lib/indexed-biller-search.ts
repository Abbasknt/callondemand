/**
 * High-Performance Indexed Client-Side Search Engine for Utility Billers.
 * 
 * Pre-computes an inverted token index, prefix mapping, and scored relevance table
 * using useMemo to deliver sub-millisecond lookups even over vast provider directories.
 */

export interface BillerItem {
  billerCode: string;
  code?: string;
  billerName: string;
  name?: string;
  categoryCode?: string;
  categoryName?: string;
  category?: { code?: string; name?: string };
  aliases?: string[];
  region?: string;
  state?: string;
  type?: 'prepaid' | 'postpaid' | 'general' | 'disco' | 'streaming' | 'cable';
  popular?: boolean;
  [key: string]: any;
}

export interface BillerSearchDoc {
  id: string;
  normalizedName: string;
  normalizedCode: string;
  normalizedTokens: string[];
  aliases: string[];
  searchableString: string;
  item: BillerItem;
}

export interface BillerSearchIndex {
  billerMap: Map<string, BillerItem>;
  tokenMap: Map<string, Set<string>>;
  prefixMap: Map<string, Set<string>>;
  allBillerIds: string[];
  docIndex: Map<string, BillerSearchDoc>;
}

// Predefined abbreviation and alias expansions for Nigerian utility providers
const KNOWN_SYNONYMS: Record<string, string[]> = {
  ikedc: ['ikeja', 'electric', 'lagos', 'disco', 'electricity', 'prepaid', 'postpaid'],
  ekedc: ['eko', 'electricity', 'lagos', 'island', 'lekki', 'vi', 'disco', 'prepaid', 'postpaid'],
  aedc: ['abuja', 'fct', 'electric', 'kogi', 'niger', 'nasarawa', 'disco', 'prepaid', 'postpaid'],
  ibedc: ['ibadan', 'electric', 'oyo', 'ogun', 'osun', 'kwara', 'disco', 'prepaid', 'postpaid'],
  eedc: ['enugu', 'electric', 'anambra', 'imo', 'abia', 'ebonyi', 'disco', 'prepaid', 'postpaid'],
  phed: ['port', 'harcourt', 'rivers', 'bayelsa', 'cross', 'river', 'akwa', 'ibom', 'disco', 'electric'],
  kedco: ['kano', 'electric', 'katsina', 'jigawa', 'disco'],
  kaedco: ['kaduna', 'electric', 'sokoto', 'kebbi', 'zamfara', 'disco'],
  jed: ['jos', 'electric', 'plateau', 'bauchi', 'benue', 'gombe', 'disco'],
  bedc: ['benin', 'electric', 'edo', 'delta', 'ondo', 'ekiti', 'disco'],
  yedc: ['yola', 'electric', 'adamawa', 'taraba', 'borno', 'yobe', 'disco'],
  aple: ['aba', 'power', 'electric', 'abia'],
  dstv: ['multichoice', 'cable', 'tv', 'satellite', 'premium', 'compact', 'padi', 'yanga', 'confam'],
  gotv: ['multichoice', 'cable', 'tv', 'antenna', 'supa', 'max', 'jolli', 'jinja', 'smallie'],
  startimes: ['digital', 'tv', 'antenna', 'dish', 'nova', 'basic', 'classic', 'smart'],
  showmax: ['streaming', 'movies', 'series', 'entertainment', 'mobile', 'premier', 'league'],
  boxoffice: ['movie', 'rental', 'wallet', 'topup', 'dstv'],
};

function normalizeString(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(str?: string): string[] {
  const normalized = normalizeString(str);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

/**
 * Builds the inverted index, prefix map, and token weights for a list of billers.
 */
export function buildBillerSearchIndex(billers: BillerItem[]): BillerSearchIndex {
  const billerMap = new Map<string, BillerItem>();
  const tokenMap = new Map<string, Set<string>>();
  const prefixMap = new Map<string, Set<string>>();
  const allBillerIds: string[] = [];
  const docIndex = new Map<string, BillerSearchDoc>();

  billers.forEach((biller, index) => {
    const id = String(biller.billerCode || biller.code || biller.id || `biller-${index}`);
    billerMap.set(id, biller);
    allBillerIds.push(id);

    const name = biller.billerName || biller.name || '';
    const code = biller.billerCode || biller.code || '';
    const category = biller.categoryName || biller.category?.name || biller.categoryCode || '';
    const customAliases = Array.isArray(biller.aliases) ? biller.aliases : [];

    const rawTokens = [
      ...tokenize(name),
      ...tokenize(code),
      ...tokenize(category),
      ...customAliases.flatMap((a: string) => tokenize(a)),
    ];

    // Inject known synonym tokens
    const expandedTokens = new Set<string>(rawTokens);
    rawTokens.forEach(t => {
      const syns = KNOWN_SYNONYMS[t];
      if (syns) {
        syns.forEach(s => expandedTokens.add(s));
      }
    });

    const tokenArray = Array.from(expandedTokens);
    const searchableString = `${name} ${code} ${category} ${customAliases.join(' ')} ${tokenArray.join(' ')}`.toLowerCase();

    docIndex.set(id, {
      id,
      normalizedName: normalizeString(name),
      normalizedCode: normalizeString(code),
      normalizedTokens: tokenArray,
      aliases: customAliases,
      searchableString,
      item: biller,
    });

    // Populate Inverted Token Map
    tokenArray.forEach(token => {
      if (!tokenMap.has(token)) {
        tokenMap.set(token, new Set());
      }
      tokenMap.get(token)!.add(id);

      // Populate Prefix Map (min 2 chars)
      const maxPrefixLen = Math.min(token.length, 8);
      for (let len = 2; len <= maxPrefixLen; len++) {
        const prefix = token.slice(0, len);
        if (!prefixMap.has(prefix)) {
          prefixMap.set(prefix, new Set());
        }
        prefixMap.get(prefix)!.add(id);
      }
    });
  });

  return {
    billerMap,
    tokenMap,
    prefixMap,
    allBillerIds,
    docIndex,
  };
}

export interface BillerFilterOptions {
  query?: string;
  typeFilter?: string; // 'ALL' | 'PREPAID' | 'POSTPAID' | 'DISCO' | 'CABLE' | 'STREAMING' | 'POPULAR'
  category?: string;
  limit?: number;
}

/**
 * Executes high-performance scored lookup using the pre-computed search index.
 */
export function searchIndexedBillers(
  index: BillerSearchIndex | null,
  options: BillerFilterOptions = {}
): BillerItem[] {
  if (!index || index.allBillerIds.length === 0) return [];

  const { query = '', typeFilter = 'ALL', limit } = options;
  const trimmedQuery = query.trim().toLowerCase();
  const queryTokens = tokenize(trimmedQuery);

  let candidateIds: Set<string>;

  if (queryTokens.length === 0) {
    // No search text -> start with all IDs
    candidateIds = new Set(index.allBillerIds);
  } else {
    // Perform fast intersection over token/prefix index
    const termMatches: Set<string>[] = [];

    queryTokens.forEach(term => {
      const termCandidates = new Set<string>();

      // 1. Exact token match
      const exactSet = index.tokenMap.get(term);
      if (exactSet) {
        exactSet.forEach(id => termCandidates.add(id));
      }

      // 2. Prefix match
      if (term.length >= 2) {
        const prefixSet = index.prefixMap.get(term);
        if (prefixSet) {
          prefixSet.forEach(id => termCandidates.add(id));
        }
      }

      // 3. Substring fallback if term didn't match indexed prefix
      if (termCandidates.size === 0) {
        index.docIndex.forEach(doc => {
          if (doc.searchableString.includes(term)) {
            termCandidates.add(doc.id);
          }
        });
      }

      termMatches.push(termCandidates);
    });

    if (termMatches.length === 0) {
      return [];
    }

    // Intersect matches across all search terms (AND search)
    // Start with the smallest candidate set for optimal intersection speed
    termMatches.sort((a, b) => a.size - b.size);
    candidateIds = new Set(termMatches[0]);

    for (let i = 1; i < termMatches.length; i++) {
      const currentSet = termMatches[i];
      candidateIds.forEach(id => {
        if (!currentSet.has(id)) {
          candidateIds.delete(id);
        }
      });
      if (candidateIds.size === 0) break;
    }
  }

  // Filter by Type / Tab if specified
  const filteredCandidates: string[] = [];
  candidateIds.forEach(id => {
    const doc = index.docIndex.get(id);
    if (!doc) return;

    if (typeFilter && typeFilter !== 'ALL') {
      const t = typeFilter.toUpperCase();
      const nameLower = doc.normalizedName;
      const codeLower = doc.normalizedCode;
      const searchStr = doc.searchableString;

      if (t === 'PREPAID' && !searchStr.includes('prepaid') && !nameLower.includes('prepaid')) {
        return;
      }
      if (t === 'POSTPAID' && !searchStr.includes('postpaid') && !nameLower.includes('postpaid')) {
        return;
      }
      if (t === 'DISCO' && !searchStr.includes('disco') && !searchStr.includes('electric')) {
        return;
      }
      if (t === 'CABLE' && !searchStr.includes('cable') && !searchStr.includes('tv') && !searchStr.includes('dstv') && !searchStr.includes('gotv') && !searchStr.includes('startimes')) {
        return;
      }
      if (t === 'STREAMING' && !searchStr.includes('streaming') && !searchStr.includes('showmax') && !searchStr.includes('boxoffice')) {
        return;
      }
      if (t === 'POPULAR' && !doc.item.popular && !['BIL-IKEDC', 'BIL-EKEDC', 'BIL-AEDC', 'BIL-DSTV', 'BIL-GOTV', 'BIL001', 'BIL002', 'BIL005', 'BIL006'].includes(doc.item.billerCode || doc.item.code || '')) {
        return;
      }
    }

    filteredCandidates.push(id);
  });

  // Calculate Relevance Scores for sorting
  const scoredItems = filteredCandidates.map(id => {
    const doc = index.docIndex.get(id)!;
    let score = 0;

    if (trimmedQuery) {
      // Exact code match
      if (doc.normalizedCode === trimmedQuery || doc.item.billerCode?.toLowerCase() === trimmedQuery) {
        score += 100;
      }
      // Exact name match
      if (doc.normalizedName === trimmedQuery) {
        score += 80;
      }
      // Name starts with query
      if (doc.normalizedName.startsWith(trimmedQuery)) {
        score += 50;
      }
      // Word boundary match
      if (new RegExp(`\\b${trimmedQuery}\\b`).test(doc.normalizedName)) {
        score += 30;
      }
      // Individual token matches
      queryTokens.forEach(token => {
        if (doc.normalizedTokens.includes(token)) score += 20;
        else if (doc.normalizedName.includes(token)) score += 10;
        else if (doc.searchableString.includes(token)) score += 5;
      });
    }

    if (doc.item.popular) score += 5;

    return {
      item: doc.item,
      score,
    };
  });

  // Sort by score descending, then by name alphabetically
  scoredItems.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const nameA = a.item.billerName || a.item.name || '';
    const nameB = b.item.billerName || b.item.name || '';
    return nameA.localeCompare(nameB);
  });

  const results = scoredItems.map(s => s.item);
  return limit && limit > 0 ? results.slice(0, limit) : results;
}
