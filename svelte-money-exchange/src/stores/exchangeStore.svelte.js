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

  async function loadRates() {
    isLoading = true;
    error = null;

    try {
      const data = await fetchLatestRates(baseCurrency);
      rates = data.rates;
    } catch (err) {
      error = err instanceof Error ? err.message : "Error al obtener las tasas de cambio.";
    } finally {
      isLoading = false;
    }
  }

  let convertedAmount = $derived(
    (!rates[sourceCurrency] || !rates[targetCurrency]) 
      ? 0 
      : amount * (rates[targetCurrency] / rates[sourceCurrency])
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
    loadRates,
  }
};

export const exchangeStore = createExchangeStore();