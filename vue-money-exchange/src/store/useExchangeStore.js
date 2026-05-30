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

  async function loadRates() {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await fetchLatestRates(baseCurrency.value);
      rates.value = data.rates;
    } catch (err) {
      error.value = err.message || "Error al cambiar las tasas de cambio.";
    } finally {
      isLoading.value = false;
    }
  }

  const convertedAmount = computed(() => {
    if (!rates.value[sourceCurrency.value] || !rates.value[targetCurrency.value]) {
      return 0;
    }

    const sourceRate = rates.value[sourceCurrency.value];
    const targetRate = rates.value[targetCurrency.value];
    
    return amount.value * (targetRate / sourceRate);
  });

  const availableCurrencies = computed(() => {
    const minValue = 0.00001;

    const currencyTranslator = new Intl.DisplayNames(['es'], { type: 'currency' });
    
    return Object.keys(rates.value)
      .filter(currency => rates.value[currency] > minValue)
      .map(currencyCode => {
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
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  return {
    rates,
    baseCurrency,
    sourceCurrency,
    targetCurrency,
    amount,
    isLoading,
    error,
    convertedAmount,
    availableCurrencies,
    loadRates
  }
});