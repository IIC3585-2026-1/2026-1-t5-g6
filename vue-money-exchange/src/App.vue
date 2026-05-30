<script setup>
import { onMounted } from "vue";
import { useExchangeStore } from "./store/useExchangeStore";

const store = useExchangeStore();

onMounted(async () => {
  await store.loadRates();
});
</script>

<template>
  <main>
    <h1>Conversor de moneda</h1>
    <div v-if="!store.isLoading" class="exchange-container">
      <div class="currencies-display">
        <div class="currency-box">
          <input type="number" v-model="store.amount" />
          <select v-model="store.sourceCurrency">
            <option
              v-for="currency in store.availableCurrencies"
              :key="currency.code"
              :value="currency.code"
            >
              {{ currency.code }} - {{ currency.name }}
            </option>
          </select>
        </div>
        <p>
          1 {{ store.sourceCurrency }} es equivalente a
          {{
            store.getQuickConversion(
              1,
              store.sourceCurrency,
              store.targetCurrency,
            )
          }}
          {{ store.targetCurrency }}
        </p>
        <div class="currency-box">
          <input type="number" v-model="store.rightAmount" />
          <select v-model="store.targetCurrency">
            <option
              v-for="currency in store.availableCurrencies"
              :key="currency.code"
              :value="currency.code"
            >
              {{ currency.code }} - {{ currency.name }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  margin: auto;
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

  input {
    border: none;
    padding: 0.5rem 0.75rem;
    font-family: monospace;
  }
}

.currencies-display {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.currency-box {
  display: flex;
  flex-direction: row;
  background-color: #fff;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  gap: 1rem;

  input {
    border: none;
    outline: none;
    font-family: monospace;
    padding: 0.5rem 0;
    background: transparent;
    width: 100%;
  }

  select {
    font-family:
      "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
    background: transparent;
    border: none;
    outline: none;
    padding: 0.5rem 0;
    color: #666;
    cursor: pointer;
    width: 100%;
    text-transform: capitalize;
  }
}
</style>
