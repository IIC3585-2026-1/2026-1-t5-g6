<script setup>
import { ref } from "vue";

const amount = ref(0);
const currencies = [
  { code: "USD", name: "Dólar Estadounidense", rate: 1 },
  { code: "EUR", name: "Euro", rate: 0.92 },
  { code: "CLP", name: "Peso Chileno", rate: 940 },
  { code: "ARS", name: "Peso Argentino", rate: 890 },
  { code: "MXN", name: "Peso Mexicano", rate: 17 },
];
const selectedBaseCurrency = ref("CLP");
const selectedCurrency = ref("USD");

const result = ref(null);
</script>

<template>
  <main>
    <h1>Conversor de moneda</h1>
    <div class="exchange-container">
      <input type="number" v-model="amount" />
      <p style="margin-top: 0.5rem; margin-bottom: -0.5rem">
        El cambio está en
      </p>
      <div class="dropdown-display">
        <select v-model="selectedBaseCurrency">
          <option
            v-for="currency in currencies"
            :key="currency.code"
            :value="currency.code"
          >
            {{ currency.name }}
          </option>
        </select>
        <img src="./assets/move-right.svg" />
        <select v-model="selectedCurrency">
          <option
            v-for="currency in currencies"
            :key="currency.code"
            :value="currency.code"
          >
            {{ currency.name }}
          </option>
        </select>
      </div>
      <p v-if="result">{{ result }}</p>
    </div>
  </main>
</template>

<style scoped>
main {
  width: 100%;
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
