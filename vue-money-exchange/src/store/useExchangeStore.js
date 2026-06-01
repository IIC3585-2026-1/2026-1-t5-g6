import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { fetchLatestRates } from "@/services/exchangeApi";

export const useExchangeStore = defineStore("exchange", () => {
  const rates = ref({});
  const baseCurrency = ref("CLP");
  const sourceCurrency = ref("CLP");
  const targetCurrency = ref("USD");
  const amount = ref(1);
  const isLoading = ref(false);
  const error = ref(null);
  const favorites = ref([]);
  const history = ref([]);
  const customCurrencies = ref([]);
  const pairOverrides = ref({});

  function getQuickConversion(customAmount, from, to) {
    const key = `${from}-${to}`;

    if (
      pairOverrides.value &&
      Object.prototype.hasOwnProperty.call(pairOverrides.value, key)
    ) {
      return (Number(customAmount) || 0) * (Number(pairOverrides.value[key]) || 0);
    }

    if (!rates.value[from] || !rates.value[to]) return 0;
    const sourceRate = rates.value[from];
    const targetRate = rates.value[to];

    return customAmount * (targetRate / sourceRate);
  }

  async function loadRates() {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await fetchLatestRates(baseCurrency.value);
      rates.value = data.rates;
      if (
        Array.isArray(customCurrencies.value) &&
        customCurrencies.value.length > 0
      ) {
        customCurrencies.value.forEach((currency) => {
          if (currency && currency.code) {
            rates.value[currency.code] =
              Number(currency.rate) || rates.value[currency.code] || 0;
          }
        });
      }
    } catch (err) {
      error.value = err.message || "Error al cambiar las tasas de cambio.";
    } finally {
      isLoading.value = false;
    }
  }

  function loadFavorites() {
    try {
      const raw = localStorage.getItem("vue_favorites");
      if (!raw) {
        favorites.value = [];
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        favorites.value = parsed;
      }
    } catch (error) {
      favorites.value = [];
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem("vue_favorites", JSON.stringify(favorites.value));
    } catch (error) {}
  }

  function toggleFavorite(from, to) {
    const key = `${from}-${to}`;

    if (favorites.value.includes(key)) {
      favorites.value = favorites.value.filter((favorite) => favorite !== key);
    } else {
      favorites.value = [key, ...favorites.value].slice(0, 20);
    }

    saveFavorites();
  }

  function isFavorite(from, to) {
    return favorites.value.includes(`${from}-${to}`);
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem("vue_history");
      if (!raw) {
        history.value = [];
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        history.value = parsed;
      }
    } catch (error) {
      history.value = [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem("vue_history", JSON.stringify(history.value));
    } catch (error) {}
  }

  function addHistory(entryAmount, from, to, result) {
    const entry = {
      amount: Number(entryAmount) || 0,
      from: String(from || ""),
      to: String(to || ""),
      result: Number(result) || 0,
      date: new Date().toISOString(),
    };

    history.value = [entry, ...history.value].slice(0, 5);
    saveHistory();
  }

  function clearHistory() {
    history.value = [];
    saveHistory();
  }

  function loadCustomCurrencies() {
    try {
      const raw = localStorage.getItem("vue_custom_currencies");
      if (!raw) {
        customCurrencies.value = [];
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        customCurrencies.value = parsed;
      }
    } catch (error) {
      customCurrencies.value = [];
    }
  }

  function saveCustomCurrencies() {
    try {
      localStorage.setItem(
        "vue_custom_currencies",
        JSON.stringify(customCurrencies.value),
      );
    } catch (error) {}
  }

  function addCustomCurrency(code, name, rate) {
    code = String(code).toUpperCase();
    name = String(name || code);
    rate = Number(rate) || 0;

    if (!code) return;

    customCurrencies.value = [
      { code, name, rate },
      ...customCurrencies.value.filter((currency) => currency.code !== code),
    ];

    rates.value = { ...rates.value, [code]: rate };
    saveCustomCurrencies();
  }

  function removeCustomCurrency(code) {
    code = String(code).toUpperCase();
    customCurrencies.value = customCurrencies.value.filter(
      (currency) => currency.code !== code,
    );

    try {
      delete rates.value[code];
    } catch (error) {}

    saveCustomCurrencies();
  }

  function loadPairOverrides() {
    try {
      const raw = localStorage.getItem("vue_pair_overrides");
      if (!raw) {
        pairOverrides.value = {};
        return;
      }

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        pairOverrides.value = parsed;
      }
    } catch (error) {
      pairOverrides.value = {};
    }
  }

  function savePairOverrides() {
    try {
      localStorage.setItem(
        "vue_pair_overrides",
        JSON.stringify(pairOverrides.value),
      );
    } catch (error) {}
  }

  function addPairOverride(from, to, rate) {
    const key = `${String(from).toUpperCase()}-${String(to).toUpperCase()}`;
    pairOverrides.value = { ...pairOverrides.value, [key]: Number(rate) };
    savePairOverrides();
  }

  function removePairOverride(from, to) {
    const key = `${String(from).toUpperCase()}-${String(to).toUpperCase()}`;
    const copy = { ...pairOverrides.value };
    delete copy[key];
    pairOverrides.value = copy;
    savePairOverrides();
  }

  function swapCurrencies() {
    const oldRight = Number(rightAmount.value) || 0;
    const currentSource = sourceCurrency.value;
    const currentTarget = targetCurrency.value;

    sourceCurrency.value = currentTarget;
    targetCurrency.value = currentSource;
    amount.value = oldRight;
  }

  function loadFabPos() {
    try {
      const raw = localStorage.getItem("vue_fab_pos");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        x: Number(parsed.x) || 0,
        y: Number(parsed.y) || 0,
      };
    } catch (error) {
      return null;
    }
  }

  function saveFabPos(x, y) {
    try {
      localStorage.setItem("vue_fab_pos", JSON.stringify({ x, y }));
    } catch (error) {}
  }

  const convertedAmount = computed(() => 
    getQuickConversion(amount.value, sourceCurrency.value, targetCurrency.value)
  );

  const rightAmount = computed({
    get() {
      return Math.round(convertedAmount.value * 100) / 100;
    },
    set(newValue) {
      const key = `${sourceCurrency.value}-${targetCurrency.value}`;
      if (
        pairOverrides.value &&
        Object.prototype.hasOwnProperty.call(pairOverrides.value, key)
      ) {
        const overrideRate = Number(pairOverrides.value[key]) || 0;
        amount.value = overrideRate === 0 ? 0 : newValue / overrideRate;
        return;
      }

      if (
        !rates.value[sourceCurrency.value] ||
        !rates.value[targetCurrency.value]
      )
        return;

      const sourceRate = rates.value[sourceCurrency.value];
      const targetRate = rates.value[targetCurrency.value];

      amount.value = newValue * (sourceRate / targetRate);
    },
  });

  const availableCurrencies = computed(() => {
    const minValue = 0.00001;

    const currencyTranslator = new Intl.DisplayNames(["es"], {
      type: "currency",
    });

    return Object.keys(rates.value)
      .filter((currency) => rates.value[currency] > minValue)
      .map((currencyCode) => {
        let currencyName = currencyCode;

        try {
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

  return {
    rates,
    baseCurrency,
    sourceCurrency,
    targetCurrency,
    amount,
    isLoading,
    error,
    favorites,
    history,
    customCurrencies,
    pairOverrides,
    convertedAmount,
    rightAmount,
    availableCurrencies,
    getQuickConversion,
    loadRates,
    loadFavorites,
    saveFavorites,
    toggleFavorite,
    isFavorite,
    loadHistory,
    saveHistory,
    addHistory,
    clearHistory,
    loadCustomCurrencies,
    saveCustomCurrencies,
    addCustomCurrency,
    removeCustomCurrency,
    loadPairOverrides,
    savePairOverrides,
    addPairOverride,
    removePairOverride,
    swapCurrencies,
    loadFabPos,
    saveFabPos,
  };
});
