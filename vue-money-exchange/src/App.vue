<script setup>
import { computed, onMounted } from "vue";
import { useExchangeStore } from "./store/useExchangeStore";

const store = useExchangeStore();

const currencies = [
  { code: "USD", name: "Dólar Estadounidense" },
  { code: "EUR", name: "Euro" },
  { code: "CLP", name: "Peso Chileno" },
  { code: "ARS", name: "Peso Argentino" },
  { code: "MXN", name: "Peso Mexicano" },
];

onMounted(async () => {
  await store.loadRates();
  console.log(store.rates);
});

const rightAmount = computed({
  get() {
    return Math.round(store.convertedAmount * 100) / 100;
  },
  set(newValue) {
    const sourceRate = store.rates[store.sourceCurrency];
    const targetRate = store.rates[store.targetCurrency];

    if (sourceRate && targetRate) {
      store.amount = newValue * (sourceRate / targetRate);
    }
  },
});
</script>

<template>
  <main>
    <h1>Conversor de moneda</h1>
    <div v-if="!store.isLoading" class="exchange-container">
      <p style="margin-top: 0.5rem; margin-bottom: -0.5rem">
        1.000 {{ store.sourceCurrency }} es equivalente a
        {{ (store.rates[store.targetCurrency] * 1000).toFixed(2) }}
        {{ store.targetCurrency }}
      </p>
      <div class="dropdown-display">
        <select v-model="store.sourceCurrency">
          <option
            v-for="currency in currencies"
            :key="currency.code"
            :value="currency.code"
          >
            {{ currency.name }}
          </option>
        </select>
        <img src="./assets/move-right.svg" />
        <select v-model="store.targetCurrency">
          <option
            v-for="currency in currencies"
            :key="currency.code"
            :value="currency.code"
          >
            {{ currency.name }}
          </option>
        </select>
      </div>
      <div class="input-display">
        <input type="number" v-model="store.amount" />
        <img src="./assets/move-right.svg" alt="flecha" />
        <input type="number" v-model="rightAmount" />
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  margin: auto;
  width: fit-content;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;

  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 1rem 0;
    text-transform: uppercase;
    color: #1a1a1a;
  }
}

.exchange-container {
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  box-shadow: 0 0.25rem 0.5rem 0 #dbc5d3;
  background: #ffebfa;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  width: 30vw;

  input {
    border: none;
    padding: 0.5rem 0.75rem;
    font-family: monospace;
  }
}

.input-display {
  display: flex;
  justify-content: space-evenly;
  gap: 1rem;
  align-items: center;
}

.dropdown-display {
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: space-evenly;

  select {
    font-family:
      "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
    background: #fff;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
  }
}
</style>
