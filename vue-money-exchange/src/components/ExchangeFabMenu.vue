<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useExchangeStore } from "../store/useExchangeStore";

const store = useExchangeStore();

const favOpen = ref(false);
const fabX = ref(0);
const fabY = ref(0);
const FAB_SIZE = 56;
let dragging = false;
let didMove = false;
let startX = 0;
let startY = 0;
let originX = 0;
let originY = 0;

const showCreatePanel = ref(false);
const showOverridePanel = ref(false);
const newCode = ref("");
const newName = ref("");
const newRate = ref("");
const ovFrom = ref("");
const ovTo = ref("");
const ovRate = ref("");

const currentFavoriteLabel = computed(() =>
  store.isFavorite(store.sourceCurrency, store.targetCurrency)
    ? "Quitar par actual"
    : "Agregar par actual",
);

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function toggleFavMenu() {
  favOpen.value = !favOpen.value;
}

function onPointerDown(event) {
  event.preventDefault();
  dragging = true;
  didMove = false;
  startX = event.clientX;
  startY = event.clientY;
  originX = fabX.value;
  originY = fabY.value;
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
}

function onPointerMove(event) {
  if (!dragging) return;

  const dx = event.clientX - startX;
  const dy = event.clientY - startY;

  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
    didMove = true;
  }

  fabX.value = clamp(originX + dx, 8, window.innerWidth - FAB_SIZE - 8);
  fabY.value = clamp(originY + dy, 8, window.innerHeight - FAB_SIZE - 8);
}

function onPointerUp() {
  dragging = false;
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);

  if (!didMove) {
    toggleFavMenu();
  }

  store.saveFabPos(fabX.value, fabY.value);
}

function addCurrentFavorite() {
  store.toggleFavorite(store.sourceCurrency, store.targetCurrency);
}

function useFavorite(pair) {
  const [from, to] = pair.split("-");
  if (!from || !to) return;
  store.sourceCurrency = from;
  store.targetCurrency = to;
  favOpen.value = false;
}

function removeFavoriteKey(pair) {
  const [from, to] = pair.split("-");
  if (!from || !to) return;
  store.toggleFavorite(from, to);
}

function addCurrency() {
  if (!newCode.value) return;

  const parsed = Number(newRate.value) || 0;
  const usdRate = store.rates["USD"] ? Number(store.rates["USD"]) : null;
  const computedRate =
    parsed === 0 ? 0 : usdRate !== null ? usdRate / parsed : parsed;

  store.addCustomCurrency(newCode.value, newName.value, computedRate);
  newCode.value = "";
  newName.value = "";
  newRate.value = "";
  showCreatePanel.value = false;
}

function addOverride() {
  if (!ovFrom.value || !ovTo.value) return;

  store.addPairOverride(ovFrom.value, ovTo.value, ovRate.value);
  ovFrom.value = "";
  ovTo.value = "";
  ovRate.value = "";
  showOverridePanel.value = false;
}

function removeOverride(key) {
  const [from, to] = key.split("-");
  if (!from || !to) return;
  store.removePairOverride(from, to);
}

onMounted(() => {
  const fabPos = store.loadFabPos();

  if (fabPos) {
    fabX.value = fabPos.x;
    fabY.value = fabPos.y;
  } else {
    fabX.value = window.innerWidth - 72;
    fabY.value = window.innerHeight - 72;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
});
</script>

<template>
  <div class="fab-wrapper" :style="{ left: `${fabX}px`, top: `${fabY}px` }">
    <button
      class="fab"
      :aria-label="favOpen ? 'Cerrar herramientas' : 'Abrir herramientas'"
      @pointerdown.prevent="onPointerDown"
    >
      {{ favOpen ? "✕" : "☆" }}
    </button>

    <div class="fab-menu" :class="{ open: favOpen }">
      <button class="fab-action" @click="addCurrentFavorite">
        {{ currentFavoriteLabel }}
      </button>

      <div class="fab-sep"></div>

      <div class="fab-favs">
        <strong>Favoritos</strong>
        <div class="panel-list">
          <div v-if="!store.favorites.length" class="muted">No hay favoritos</div>
          <div v-else v-for="favorite in store.favorites" :key="favorite" class="panel-item">
            <div class="panel-text">{{ favorite }}</div>
            <div class="panel-actions">
              <button class="link-btn" @click="useFavorite(favorite)">Usar</button>
              <button class="link-btn" @click="removeFavoriteKey(favorite)">Quitar</button>
            </div>
          </div>
        </div>
      </div>

      <div class="fab-sep"></div>

      <div class="fab-card">
        <div class="fab-prompt">¿Quieres crear tu propia moneda?</div>
        <div class="fab-choices">
          <button
            class="chip"
            @click="
              showCreatePanel = !showCreatePanel;
              showOverridePanel = false;
            "
          >
            Crear moneda
          </button>
          <button
            class="chip"
            @click="
              showOverridePanel = !showOverridePanel;
              showCreatePanel = false;
            "
          >
            Override par
          </button>
        </div>

        <div class="panel" :class="{ open: showCreatePanel }">
          <div class="panel-row">
            <input class="input" placeholder="Código (USD)" v-model="newCode" />
            <input class="input" placeholder="Nombre" v-model="newName" />
          </div>
          <div class="panel-row">
            <input class="input" placeholder="1 NUEVA = X USD" v-model="newRate" />
            <button class="primary-btn" @click="addCurrency">Añadir</button>
          </div>
          <div class="panel-list">
            <div v-if="!store.customCurrencies.length" class="muted">
              No hay monedas personalizadas
            </div>
            <div
              v-else
              v-for="currency in store.customCurrencies"
              :key="currency.code"
              class="panel-item"
            >
              <div class="panel-text">{{ currency.code }} - {{ currency.name }}</div>
              <button class="link-btn" @click="store.removeCustomCurrency(currency.code)">
                Eliminar
              </button>
            </div>
          </div>
        </div>

        <div class="panel" :class="{ open: showOverridePanel }">
          <div class="panel-row">
            <input class="input" placeholder="From (EUR)" v-model="ovFrom" />
            <input class="input" placeholder="To (USD)" v-model="ovTo" />
          </div>
          <div class="panel-row">
            <input class="input" placeholder="Tasa directa" v-model="ovRate" />
            <button class="primary-btn" @click="addOverride">Añadir</button>
          </div>
          <div class="panel-list">
            <div v-if="!Object.keys(store.pairOverrides).length" class="muted">
              Sin overrides
            </div>
            <div
              v-else
              v-for="(value, key) in store.pairOverrides"
              :key="key"
              class="panel-item"
            >
              <div class="panel-text">{{ key }} → {{ value }}</div>
              <button class="link-btn" @click="removeOverride(key)">Quitar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fab-wrapper {
  position: fixed;
  z-index: 10;
}

.fab {
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: #ff69b4;
  color: #fff;
  font-size: 1.3rem;
  cursor: grab;
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.18);
}

.fab-menu {
  position: absolute;
  right: 0;
  bottom: calc(100% + 0.6rem);
  width: min(340px, calc(100vw - 1rem));
  background: #ffebfa;
  border-radius: 1rem;
  padding: 0.9rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.12);
  opacity: 0;
  pointer-events: none;
  transform: translateY(0.4rem);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fab-menu.open {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.fab-action,
.chip,
.link-btn,
.primary-btn {
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

.fab-action,
.primary-btn {
  background: #ff69b4;
  color: #fff;
  padding: 0.55rem 0.9rem;
}

.chip,
.link-btn {
  background: #fff;
  color: #444;
  padding: 0.45rem 0.75rem;
}

.fab-sep {
  height: 1px;
  background: #ecd9e7;
  margin: 0.85rem 0;
}

.fab-favs,
.fab-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.fab-prompt {
  font-weight: 700;
  text-align: center;
  font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
}

.fab-choices,
.panel-actions,
.panel-row {
  display: flex;
  gap: 0.5rem;
}

.panel {
  display: none;
  flex-direction: column;
  gap: 0.6rem;
}

.panel.open {
  display: flex;
}

.panel-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.panel-item {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
  background: #fff;
  border-radius: 0.75rem;
  padding: 0.6rem 0.75rem;
}

.panel-text {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.input {
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-family: monospace;
}

.muted {
  color: #777;
  text-align: center;
}

@media (max-width: 640px) {
  .panel-row,
  .fab-choices,
  .panel-item {
    flex-direction: column;
  }

  .fab-menu {
    right: auto;
    left: 0;
  }
}
</style>
