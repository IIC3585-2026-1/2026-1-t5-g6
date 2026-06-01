import { fetchLatestRates } from "../services/exchangeApi";

function createExchangeStore() {
  /** @type {Record<string, number>} */
  let rates = $state({});
  let baseCurrency = $state("CLP");
  let sourceCurrency = $state("CLP");
  let targetCurrency = $state("USD");
  let amount = $state(0);
  let isLoading = $state(false);
  /** @type {string | null} */
  let error = $state(null);
  /** @type {string[]} */
  let favorites = $state([]);
  /**
   * @typedef {{amount:number, from:string, to:string, result:number, date:string}} HistoryEntry
   */
  /** @type {HistoryEntry[]} */
  let history = $state([]);
  /** @type {{code:string,name:string,rate:number}[]} */
  let customCurrencies = $state([]);
  /** @type {Record<string, number>} */
  let pairOverrides = $state({});

  /**
   * 
   * @param {number} customAmount 
   * @param {string} from 
   * @param {string} to 
   * @returns number
   */

  function getQuickConversion(customAmount, from, to) {
    const key = pairKey(from, to);
    if (pairOverrides && pairOverrides[key]) {
      return customAmount * pairOverrides[key];
    }
    if (!rates[from] || !rates[to]) return 0;
    const sourceRate = rates[from];
    const targetRate = rates[to];

    return customAmount * (targetRate / sourceRate);
  }

  async function loadRates() {
    isLoading = true;
    error = null;

    try {
      const data = await fetchLatestRates(baseCurrency);
      rates = data.rates;
      // merge custom currencies into rates so they appear in lists and conversions
      if (Array.isArray(customCurrencies) && customCurrencies.length > 0) {
        customCurrencies.forEach(c => {
          if (c && c.code) rates[c.code] = Number(c.rate) || rates[c.code] || 0;
        });
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Error al obtener las tasas de cambio.";
    } finally {
      isLoading = false;
    }
  }

  // Favorites persistence (localStorage, independent per-project)
  function loadFavorites() {
    try {
      const raw = localStorage.getItem('svelte_favorites');
      if (!raw) {
        favorites = [];
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) favorites = parsed;
    } catch (e) {
      console.warn('No se pudo cargar favoritos:', e);
      favorites = [];
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem('svelte_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.warn('No se pudo guardar favoritos:', e);
    }
  }

  // History persistence (last 5 conversions)
  function loadHistory() {
    try {
      const raw = localStorage.getItem('svelte_history');
      if (!raw) {
        history = [];
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) history = parsed;
    } catch (e) {
      console.warn('No se pudo cargar historial:', e);
      history = [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem('svelte_history', JSON.stringify(history));
    } catch (e) {
      console.warn('No se pudo guardar historial:', e);
    }
  }

  /**
   * Añade una entrada al historial (al frente). Mantiene máximo 5.
   * @param {number} amt
   * @param {string} from
   * @param {string} to
   * @param {number} result
   */
  function addHistory(amt, from, to, result) {
    const entry = {
      amount: Number(amt) || 0,
      from: String(from || ''),
      to: String(to || ''),
      result: Number(result) || 0,
      date: new Date().toISOString(),
    };

    history = [entry, ...history].slice(0, 5);
    saveHistory();
  }

  function clearHistory() {
    history = [];
    saveHistory();
  }

  // Custom currencies persistence
  function loadCustomCurrencies() {
    try {
      const raw = localStorage.getItem('svelte_custom_currencies');
      if (!raw) { customCurrencies = []; return; }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) customCurrencies = parsed;
    } catch (e) { console.warn('No se pudo cargar custom currencies', e); customCurrencies = []; }
  }

  function saveCustomCurrencies() {
    try { localStorage.setItem('svelte_custom_currencies', JSON.stringify(customCurrencies)); } catch (e) { console.warn(e); }
  }

  function addCustomCurrency(code, name, rate) {
    code = String(code).toUpperCase();
    name = String(name || code);
    rate = Number(rate) || 0;
    if (!code) return;
    customCurrencies = [{ code, name, rate }, ...customCurrencies.filter(c => c.code !== code)];
    rates = { ...rates, [code]: rate };
    saveCustomCurrencies();
  }

  function removeCustomCurrency(code) {
    code = String(code).toUpperCase();
    customCurrencies = customCurrencies.filter(c => c.code !== code);
    try { delete rates[code]; } catch (e) {}
    saveCustomCurrencies();
  }

  // Pair overrides persistence
  function loadPairOverrides() {
    try {
      const raw = localStorage.getItem('svelte_pair_overrides');
      if (!raw) { pairOverrides = {}; return; }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') pairOverrides = parsed;
    } catch (e) { console.warn('No se pudo cargar pair overrides', e); pairOverrides = {}; }
  }

  function savePairOverrides() {
    try { localStorage.setItem('svelte_pair_overrides', JSON.stringify(pairOverrides)); } catch (e) { console.warn(e); }
  }

  function addPairOverride(from, to, rate) {
    const key = `${String(from)}-${String(to)}`;
    pairOverrides = { ...pairOverrides, [key]: Number(rate) };
    savePairOverrides();
  }

  function removePairOverride(from, to) {
    const key = `${String(from)}-${String(to)}`;
    const copy = { ...pairOverrides };
    delete copy[key];
    pairOverrides = copy;
    savePairOverrides();
  }

  /**
   * @param {string} from
   * @param {string} to
   */
  function pairKey(from, to) {
    return `${from}-${to}`;
  }

  /**
   * @param {string} from
   * @param {string} to
   */
  function toggleFavorite(from, to) {
    const key = pairKey(from, to);
    if (favorites.includes(key)) {
      favorites = favorites.filter(f => f !== key);
    } else {
      favorites = [key, ...favorites].slice(0, 20);
    }
    saveFavorites();
  }

  /**
   * @param {string} from
   * @param {string} to
   */
  function isFavorite(from, to) {
    return favorites.includes(pairKey(from, to));
  }

  let convertedAmount = $derived(
    getQuickConversion(amount, sourceCurrency, targetCurrency)
  );

  let availableCurrencies = $derived.by(() => {
    if (Object.keys(rates).length === 0) return [];

    const minValue = 0.00001;
    const currencyTranslator = new Intl.DisplayNames(['es'], { type: 'currency' });

    return Object.keys(rates)
      .filter(currency => rates[currency] > minValue)
      .map(currencyCode => {
        let currencyName = currencyCode;
        try {
          // @ts-ignore
          currencyName = currencyTranslator.of(currencyCode);
        } catch (e) {
          console.warn(`No se encontró traducción para ${currencyCode}`);
        }

        return {
          code: currencyCode,
          name: currencyName,
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  });

  // load persisted favorites on store creation
  try {
    if (typeof window !== 'undefined') {
      loadFavorites();
      loadHistory();
      loadCustomCurrencies();
      loadPairOverrides();
    }
  } catch (e) {}

  // (theme helpers removed; theming is handled in components or CSS variables)

  // Swap helper: swap source/target and set amount to previous rightAmount
  function swapCurrencies() {
    const oldRight = Number(getRightAmount()) || 0;
    const s = sourceCurrency;
    const t2 = targetCurrency;
    sourceCurrency = t2;
    targetCurrency = s;
    amount = oldRight;
  }

  function getRightAmount() {
    // derived convertedAmount may be number or derived object; compute if needed
    try {
      const sourceRate = rates[sourceCurrency];
      const targetRate = rates[targetCurrency];
      if (!sourceRate || !targetRate) return 0;
      return Math.round((amount * (targetRate / sourceRate)) * 100) / 100;
    } catch (e) { return 0; }
  }

  // FAB position helpers
  function loadFabPos() {
    try {
      const raw = localStorage.getItem('svelte_fab_pos');
      if (!raw) return null;
      const p = JSON.parse(raw);
      return { x: Number(p.x) || 0, y: Number(p.y) || 0 };
    } catch (e) { return null; }
  }

  function saveFabPos(x, y) {
    try {
      localStorage.setItem('svelte_fab_pos', JSON.stringify({ x, y }));
    } catch (e) { console.warn('No se pudo guardar posición FAB', e); }
  }

  return {
    get rates() { return rates; },
    get baseCurrency() { return baseCurrency; },
    get sourceCurrency() { return sourceCurrency; },
    set sourceCurrency(val) { sourceCurrency = val; },
    get targetCurrency() { return targetCurrency; },
    set targetCurrency(val) { targetCurrency = val; },
    get amount() { return amount; },
    set amount(val) { amount = val; },
    get isLoading() { return isLoading; },
    get error() { return error; },
    get convertedAmount() { return convertedAmount; },
    get availableCurrencies() { return availableCurrencies; },
    get rightAmount() { return Math.round(convertedAmount * 100) / 100; },
    set rightAmount(newValue) {
      if ( !rates[sourceCurrency] || !rates[targetCurrency]) {
        return;
      }

      const sourceRate = rates[sourceCurrency];
      const targetRate = rates[targetCurrency];

      amount = newValue * (sourceRate / targetRate);
    },
    get favorites() { return favorites; },
    toggleFavorite,
    isFavorite,
    get history() { return history; },
    addHistory,
    clearHistory,
    // custom currencies & pair overrides
    get customCurrencies() { return customCurrencies; },
    addCustomCurrency,
    removeCustomCurrency,
    get pairOverrides() { return pairOverrides; },
    addPairOverride,
    removePairOverride,
    getQuickConversion,
    loadRates,
    // UI helpers
    swapCurrencies,
    getRightAmount,
    loadFabPos,
    saveFabPos,
  }
};

export const exchangeStore = createExchangeStore();

// Load persisted favorites on initialization (if running in browser)
try {
  if (typeof window !== 'undefined' && exchangeStore && typeof exchangeStore.favorites !== 'undefined') {
    // There is no direct exposed loadFavorites; however favorites are read on first access via localStorage.
    // To ensure we populate, read directly here and assign via toggle if necessary is not ideal.
    // Consumers will trigger load when interacting; keep initialization lightweight.
  }
} catch (e) {}