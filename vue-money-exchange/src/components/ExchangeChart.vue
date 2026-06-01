<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { getHistoricalRates } from "../services/exchangeApi";
import { useExchangeStore } from "../store/useExchangeStore";

const store = useExchangeStore();

const chartX = ref("USD");
const chartY = ref("CLP");
const chartDays = ref(7);
let chartInstance = null;

async function loadChart() {
  if (!chartX.value || !chartY.value) return;

  try {
    const data = await getHistoricalRates(chartX.value, chartY.value, chartDays.value);
    const labels = data.map((entry) => entry.date);
    const values = data.map((entry) => entry.rate);
    const canvas = document.getElementById("fx-chart");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (chartInstance && typeof chartInstance.destroy === "function") {
      chartInstance.destroy();
    }

    if (window.Chart) {
      chartInstance = new window.Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: `${chartX.value} → ${chartY.value}`,
              data: values,
              borderColor: "#ff69b4",
              backgroundColor: "rgba(255,105,180,0.12)",
              fill: true,
              tension: 0.2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            x: {
              display: true,
              title: { display: true, text: chartX.value },
            },
            y: {
              display: true,
              title: { display: true, text: chartY.value },
            },
          },
        },
      });
    }
  } catch (error) {
    console.warn("No se pudo cargar historial", error);
  }
}

function swapChart() {
  const temp = chartX.value;
  chartX.value = chartY.value;
  chartY.value = temp;

  if (chartX.value && chartY.value) {
    loadChart();
  }
}

function setChartDays(days) {
  chartDays.value = days;
  loadChart();
}

function clearChart() {
  chartX.value = "";
  chartY.value = "";

  if (chartInstance && typeof chartInstance.destroy === "function") {
    chartInstance.destroy();
  }
}

onMounted(() => {
  loadChart();
});

onBeforeUnmount(() => {
  if (chartInstance && typeof chartInstance.destroy === "function") {
    chartInstance.destroy();
  }
});
</script>

<template>
  <div class="chart-container">
    <h2>Gráfico</h2>
    <div class="chart-controls">
      <select v-model="chartX" class="input" @change="loadChart">
        <option value="">Elegir eje X</option>
        <option
          v-for="currency in store.availableCurrencies"
          :key="currency.code"
          :value="currency.code"
        >
          {{ currency.code }} - {{ currency.name }}
        </option>
      </select>

      <select v-model="chartY" class="input" @change="loadChart">
        <option value="">Elegir eje Y</option>
        <option
          v-for="currency in store.availableCurrencies"
          :key="currency.code"
          :value="currency.code"
        >
          {{ currency.code }} - {{ currency.name }}
        </option>
      </select>

      <div class="chart-buttons">
        <button class="chip" @click="swapChart">↔</button>
        <button class="chip" @click="setChartDays(7)">7 días</button>
        <button class="chip" @click="setChartDays(30)">30 días</button>
        <button class="primary-btn" @click="clearChart">Limpiar</button>
      </div>
    </div>

    <div class="chart-canvas">
      <canvas id="fx-chart" class="small-chart"></canvas>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  max-width: 560px;
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  box-shadow: 0 0.25rem 0.5rem 0 #dbc5d3;
  background: #ffebfa;
}

.chart-container h2 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #444;
  font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
}

.chart-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.input {
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fff;
  color: #666;
  font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
}

.chart-buttons {
  display: flex;
  gap: 0.35rem;
  align-items: center;
  flex-wrap: wrap;
}

.chip,
.primary-btn {
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

.chip {
  background: #fff;
  color: #444;
  padding: 0.45rem 0.75rem;
}

.primary-btn {
  background: #ff69b4;
  color: #fff;
  padding: 0.55rem 0.9rem;
}

.chart-canvas {
  margin-top: 0.75rem;
  display: flex;
  justify-content: center;
}

.small-chart {
  width: 100%;
  max-width: 500px;
  max-height: 260px;
}

@media (max-width: 640px) {
  .chart-container {
    max-width: calc(100vw - 1rem);
  }
}
</style>
