<script>
  import { onMount, onDestroy } from "svelte";
  import { exchangeStore } from "./stores/exchangeStore.svelte";
  import { getHistoricalRates } from "./services/exchangeApi";

  let favOpen = false;

  // draggable FAB state
  let fabX = 0;
  let fabY = 0;
  const FAB_SIZE = 56; // px
  let dragging = false;
  let didMove = false;
  let startX = 0, startY = 0, originX = 0, originY = 0;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function toggleFavMenu() {
    favOpen = !favOpen;
  }

  function addCurrentFavorite() {
    exchangeStore.toggleFavorite(exchangeStore.sourceCurrency, exchangeStore.targetCurrency);
  }

  // custom currency / override form state
  let newCode = '';
  let newName = '';
  let newRate = '';

  let ovFrom = '';
  let ovTo = '';
  let ovRate = '';
  let showCreatePanel = false;
  let showOverridePanel = false;
  let chartX = 'USD';
  let chartY = 'CLP';
  let chartData = [];
  let chartInstance = null;
  let chartDays = 7;
  // (theme toggling removed)

  function onPointerDown(e) {
    e.preventDefault();
    dragging = true;
    didMove = false;
    startX = e.clientX;
    startY = e.clientY;
    originX = fabX;
    originY = fabY;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didMove = true;
    fabX = clamp(originX + dx, 8, window.innerWidth - FAB_SIZE - 8);
    fabY = clamp(originY + dy, 8, window.innerHeight - FAB_SIZE - 8);
  }

  function onPointerUp(e) {
    dragging = false;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    // If it was a tap (no move), toggle menu
    if (!didMove) toggleFavMenu();
    // persist position
    try { exchangeStore.saveFabPos(fabX, fabY); } catch (err) {}
  }

  function swapCurrencies() {
    exchangeStore.swapCurrencies();
  }

  // initialize position from localStorage
  onMount(() => {
    exchangeStore.loadRates();
    try {
      const raw = localStorage.getItem('svelte_fab_pos');
      if (raw) {
        const p = JSON.parse(raw);
        fabX = clamp(Number(p.x) || (window.innerWidth - FAB_SIZE - 8), 8, window.innerWidth - FAB_SIZE - 8);
        fabY = clamp(Number(p.y) || (window.innerHeight - FAB_SIZE - 8), 8, window.innerHeight - FAB_SIZE - 8);
      } else {
        fabX = window.innerWidth - FAB_SIZE - 16;
        fabY = window.innerHeight - FAB_SIZE - 16;
      }
    } catch (e) {
      fabX = window.innerWidth - FAB_SIZE - 16;
      fabY = window.innerHeight - FAB_SIZE - 16;
    }
    // default chart selection and initial load
    try {
      chartX = 'USD';
      chartY = 'CLP';
      loadChart();
    } catch (e) {}
    // theme removed: nothing to apply on mount
    try {
      const p = exchangeStore.loadFabPos();
      if (p && typeof p.x !== 'undefined') {
        fabX = clamp(Number(p.x) || (window.innerWidth - FAB_SIZE - 8), 8, window.innerWidth - FAB_SIZE - 8);
        fabY = clamp(Number(p.y) || (window.innerHeight - FAB_SIZE - 8), 8, window.innerHeight - FAB_SIZE - 8);
      }
    } catch (e) {}
  });

  onDestroy(() => {
    if (chartInstance && typeof chartInstance.destroy === 'function') chartInstance.destroy();
  });

  async function loadChart() {
    if (!chartX || !chartY) return;
    try {
      chartData = await getHistoricalRates(chartX, chartY, chartDays);
      const labels = chartData.map(d => d.date);
      const values = chartData.map(d => d.rate);

      // create/destroy Chart
      const canvas = document.getElementById('fx-chart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (chartInstance && typeof chartInstance.destroy === 'function') chartInstance.destroy();
      if (window.Chart) {
        chartInstance = new window.Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: `${chartX} → ${chartY}`,
              data: values,
              borderColor: '#ff69b4',
              backgroundColor: 'rgba(255,105,180,0.12)',
              fill: true,
              tension: 0.2,
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: true } },
            scales: {
              x: { display: true, title: { display: true, text: chartX } },
              y: { display: true, title: { display: true, text: chartY } }
            }
          }
        });
      }
    } catch (e) {
      console.warn('No se pudo cargar historial para gráfico', e);
    }
  }

  function startChartPolling() {
    // polling removed — charts are now manual/visible in container
  }
</script>

<main>
  <h1>Conversor de moneda</h1>
  {#if !exchangeStore.isLoading}
    <div class="exchange-container">
      <div class="currencies-display">
        <div class="currency-box">
          <input type="number" bind:value={exchangeStore.amount} />
          <select bind:value={exchangeStore.sourceCurrency}>
            {#each exchangeStore.availableCurrencies as currency}
            <option
              value={currency.code}
            >
              { currency.code } - { currency.name }
            </option>
            {/each}
          </select>
        </div>
        <p>
          1 { exchangeStore.sourceCurrency } es equivalente a 
          { (exchangeStore.getQuickConversion(1, exchangeStore.sourceCurrency, exchangeStore.targetCurrency)).toFixed(2)}
          { exchangeStore.targetCurrency }
          <button class="save-btn" title="Guardar en historial" on:click={() => exchangeStore.addHistory(exchangeStore.amount, exchangeStore.sourceCurrency, exchangeStore.targetCurrency, exchangeStore.rightAmount)}>
            💾
          </button>
            <button class="chip" style="margin-left:0.5rem" on:click={swapCurrencies} title="Invertir par">↔</button>
        </p>
        <div class="currency-box">
          <input type="number" bind:value={exchangeStore.rightAmount} />
          <select bind:value={exchangeStore.targetCurrency}>
            {#each exchangeStore.availableCurrencies as currency}
            <option
              value={currency.code}
            >
              { currency.code } - { currency.name }
            </option>
            {/each}
          </select>
        </div>
      </div>
      
      <section class="history-section">
      {#if exchangeStore.history && exchangeStore.history.length > 0}
        <ul>
          {#each exchangeStore.history as h}
            <li>
              <span class="h-amt">{h.amount}</span>
              <span class="h-pair">{h.from}→{h.to}</span>
              <span class="h-res">= {h.result}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="no-h">Sin entradas</p>
      {/if}
      </section>
    </div>
  {/if}
  
  <!-- Chart container placed below converter -->
  <div class="chart-container">
    <h2 style="margin:0.25rem 0 0.5rem 0;font-size:0.95rem">Gráfico</h2>
    <div style="display:flex;gap:0.5rem;align-items:center;justify-content:center;flex-wrap:wrap">
      <select class="input" bind:value={chartX} on:change={() => {}}>
        <option value="">Elegir eje X</option>
        {#each exchangeStore.availableCurrencies as c}
          <option value={c.code}>{c.code} — {c.name}</option>
        {/each}
      </select>
      <select class="input" bind:value={chartY}>
        <option value="">Elegir eje Y</option>
        {#each exchangeStore.availableCurrencies as c}
          <option value={c.code}>{c.code} — {c.name}</option>
        {/each}
      </select>
      <div style="display:flex;gap:0.35rem;align-items:center">
        <button class="chip" on:click={() => { const tmp = chartX; chartX = chartY; chartY = tmp; if (chartX && chartY) loadChart(); }} title="Invertir ejes">↔</button>
        <button class="chip" on:click={() => { chartDays = 7; if (!chartX || !chartY) return; loadChart(); }}>7 días</button>
        <button class="chip" on:click={() => { chartDays = 30; if (!chartX || !chartY) return; loadChart(); }}>30 días</button>
        <button class="primary-btn" on:click={() => { chartX=''; chartY=''; if (chartInstance) chartInstance.destroy(); chartData = []; }}>Limpiar</button>
      </div>
    </div>
    <div style="margin-top:0.5rem;display:flex;justify-content:center">
      <canvas id="fx-chart" class="small-chart"></canvas>
    </div>
  </div>

  <!-- FAB wrapper positioned using left/top so it can be dragged; menu opens upward -->
  <div class="fab-wrapper" style="left: {fabX}px; top: {fabY}px;">
    <button class="fab" aria-label="Favoritos"
      on:pointerdown={onPointerDown}
      style="touch-action:none"
    >
      {favOpen ? '✕' : '☆'}
    </button>

    <div class="fab-menu {favOpen ? 'open' : ''}" aria-hidden={!favOpen}>
      <button class="fab-action" on:click={addCurrentFavorite}>
        {exchangeStore.isFavorite(exchangeStore.sourceCurrency, exchangeStore.targetCurrency) ? 'Quitar par' : 'Agregar par actual'}
      </button>
      <!-- theme toggle removed -->
      <div class="fab-sep" />
      <div class="fab-favs">
        <strong>Favoritos</strong>
        <div class="panel-list" style="margin-top:0.35rem">
          {#if exchangeStore.favorites.length === 0}
            <div class="muted">No hay favoritos</div>
          {:else}
            {#each exchangeStore.favorites as f}
              <div class="panel-item">
                <div style="flex:1;min-width:0;overflow-wrap:anywhere">{f}</div>
                <div style="display:flex;gap:0.35rem">
                  <button class="link-btn" on:click={() => { const p = f.split('-'); exchangeStore.sourceCurrency = p[0]; exchangeStore.targetCurrency = p[1]; favOpen = false; }}>Usar</button>
                  <button class="link-btn" on:click={() => { const p = f.split('-'); exchangeStore.toggleFavorite(p[0], p[1]); }}>Quitar</button>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>
      <div class="fab-sep" />
      <div class="fab-card">
        <div class="fab-prompt">¿Quieres crear tu propia moneda?</div>
        <div class="fab-choices">
          <button class="chip" on:click={() => { showCreatePanel = !showCreatePanel; showOverridePanel = false; }}>
            ✨ Crear moneda
          </button>
          <button class="chip" on:click={() => { showOverridePanel = !showOverridePanel; showCreatePanel = false; showChartPanel = false; }}>
            🔁 Override par
          </button>
        </div>
      

        <div class="panel {showCreatePanel ? 'open' : ''}">
          <div class="panel-row">
            <input class="input" placeholder="Código (USD)" bind:value={newCode} />
            <input class="input" placeholder="Nombre" bind:value={newName} />
          </div>
          <div class="panel-row">
            <input class="input" placeholder={newCode ? `1 ${newCode.toUpperCase()} = X USD (ej: 2)` : '1 NUEVA = X USD (ej: 2)'} bind:value={newRate} />
            <button class="primary-btn" on:click={() => {
              if (!newCode) return;
              // Interpret newRate as: 1 NEW = X USD. Convert to store rate units (1 baseCurrency -> NEW)
              const parsed = Number(newRate) || 0;
              const usdRate = exchangeStore.rates && exchangeStore.rates['USD'] ? Number(exchangeStore.rates['USD']) : null;
              let computed = parsed === 0 ? 0 : (usdRate !== null ? (usdRate / parsed) : parsed);
              exchangeStore.addCustomCurrency(newCode, newName, computed);
              newCode=''; newName=''; newRate=''; showCreatePanel=false;
            }}>Añadir</button>
          </div>
          <div class="panel-list">
            {#if exchangeStore.customCurrencies.length === 0}
              <div class="muted">No hay monedas personalizadas</div>
            {:else}
              {#each exchangeStore.customCurrencies as cc}
                <div class="panel-item">
                  <div>{cc.code} — {cc.name}</div>
                  <button class="link-btn" on:click={() => exchangeStore.removeCustomCurrency(cc.code)}>Eliminar</button>
                </div>
              {/each}
            {/if}
          </div>
        </div>

        <div class="panel {showOverridePanel ? 'open' : ''}">
          <div class="panel-row">
            <input class="input" placeholder="From (EUR)" bind:value={ovFrom} />
            <input class="input" placeholder="To (USD)" bind:value={ovTo} />
          </div>
          <div class="panel-row">
            <input class="input" placeholder="Tasa directa" bind:value={ovRate} />
            <button class="primary-btn" on:click={() => { if(ovFrom && ovTo) { exchangeStore.addPairOverride(ovFrom, ovTo, ovRate); ovFrom=''; ovTo=''; ovRate=''; showOverridePanel=false; } }}>Añadir</button>
          </div>
          <div class="panel-list">
            {#if Object.keys(exchangeStore.pairOverrides).length === 0}
              <div class="muted">Sin overrides</div>
            {:else}
              {#each Object.entries(exchangeStore.pairOverrides) as [k,v]}
                <div class="panel-item">
                  <div>{k} → <strong>{v}</strong></div>
                  <button class="link-btn" on:click={() => { const parts = k.split('-'); exchangeStore.removePairOverride(parts[0], parts[1]); }}>Quitar</button>
                </div>
              {/each}
            {/if}
          </div>
        </div>

        <!-- chart panel moved outside to be a separate item -->
      </div>
    </div>
    
    <!-- FAB chart panel (removed - chart is now below converter) -->
    
  </div>
</main>

<style>

/* Theme variables (compact, controlled locally) */
:global(:root) {
  --text-h: #1a1a1a;
  --card: #ffebfa;
  --card-shadow: 0 0.25rem 0.5rem 0 #dbc5d3;
  --input-bg: #fff;
  --input-border: #eee;
  --accent: #ff69b4;
  --chip-bg: #f6f0fb;
  --shadow-small: 0 0.125rem 0.25rem rgba(0,0,0,0.04);
}

/* Night-theme removed; only default variables kept above */

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
    color: var(--text-h);
  }
}

.exchange-container {
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  box-shadow: var(--card-shadow);
  background: var(--card);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  width: 100%;
  max-width: 560px;

  input {
    border: none;
    padding: 0.5rem 0.75rem;
    font-family: monospace;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
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
  background-color: var(--input-bg);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  gap: 1rem;

  input {
    border: none;
    outline: none;
    font-family: monospace;
    padding: 0.5rem 0.75rem;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 0.45rem;
    box-shadow: 0 6px 18px rgba(16,16,16,0.06);
    width: 100%;
  }

  select {
    font-family:
      "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    outline: none;
    padding: 0.5rem 0;
    color: #666;
    cursor: pointer;
    width: 100%;
    text-transform: capitalize;
  }
}

.save-btn {
  margin-left: 0.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
}

.history-section {
  width: 100%;
  background: var(--card);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-small);
  padding: 0.6rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.history-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:0.5rem;
}

.history-section ul { list-style:none; padding:0; margin:0.4rem 0 0 0; max-height: 220px; overflow:auto; }
.history-section li { display:flex; gap:0.5rem; align-items:center; padding:0.15rem 0; border-bottom:1px dashed #f0f0f0; min-width:0; }
.history-section .h-amt { font-family: monospace; flex:0 0 48px; min-width:0; }
.history-section .h-pair { color:#666; flex:1 1 auto; min-width:0; overflow-wrap:anywhere; word-break:break-word; white-space:normal }
.history-section .h-res { font-weight:600; flex:0 0 auto; }
.clear-history { background:transparent; border:none; color:#c33; cursor:pointer; font-size:0.8rem }
.no-h { margin:0.4rem 0 0 0; color:#888; }

@media (max-width: 480px) {
  .history-section {
    width: 100%;
    padding: 0.45rem;
    font-size: 0.82rem;
  }

  .history-section ul { max-height: 140px; }
  .history-section li { font-size: 0.85rem; }
}

@media (min-width: 481px) and (max-width: 900px) {
  .history-section { max-width: 60vw; }
}

/* FAB wrapper: positioned by inline left/top; menu opens upwards */
.fab-wrapper {
  position: fixed;
  z-index: 1200;
}
.fab {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  border: none;
  background: var(--accent);
  color: white;
  font-size: 1.4rem;
  cursor: grab;
  box-shadow: 0 0.4rem 0.8rem rgba(0,0,0,0.15);
}
.fab:active { cursor: grabbing }
.fab-menu {
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  flex-direction: column;
  gap: 0.4rem;
  background: var(--chip-bg);
  border-radius: 0.5rem;
  padding: 0.5rem;
  box-shadow: 0 0.25rem 0.5rem rgba(0,0,0,0.12);
  min-width: 180px;
}
.fab-menu.open { display: flex; }
.fab-action { background: transparent; border: none; padding: 0.4rem; text-align: left; cursor: pointer; }
.fab-sep { height:1px; background:#f0f0f0; margin:0.2rem 0; }
.fab-fav-item { background: transparent; border: none; text-align: left; padding: 0.25rem; cursor: pointer; color:#111 }
.fab-empty { color:#777; padding:0.25rem 0 }

@media (max-width: 520px) {
  .fab-menu { min-width: 140px; }
  .fab { width:48px; height:48px; font-size:1.1rem }
}

/* New styles for FAB card and panels */
.fab-card {
  padding: 0.5rem;
  min-width: 220px;
}
.fab-prompt { font-weight:600; color:#333; margin-bottom:0.35rem }
.fab-choices { display:flex; gap:0.35rem; margin-bottom:0.45rem }
.chip { background:#f6f0fb; border:none; padding:0.35rem 0.6rem; border-radius:999px; cursor:pointer }
.chip:hover { background:#efe6fb }
.panel { overflow:hidden; max-height:0; transition: max-height 220ms ease, opacity 200ms; opacity:0 }
.panel.open { max-height:520px; opacity:1 }
.panel-row { display:flex; gap:0.35rem; margin-top:0.35rem }
.input { padding:0.45rem 0.5rem; border-radius:0.4rem; border:1px solid #eee; background:#fff; outline:none; font-size:0.9rem; }
.primary-btn { background:#ff69b4; color:white; border:none; padding:0.45rem 0.7rem; border-radius:0.45rem; cursor:pointer }
.primary-btn:hover { filter:brightness(0.95) }
.panel-list { margin-top:0.5rem; max-height:140px; overflow:auto }
.panel-item { display:flex; justify-content:space-between; gap:0.5rem; align-items:center; padding:0.28rem 0; border-bottom:1px dashed #f3edf5 }
.link-btn { background:transparent; border:none; color:#c33; cursor:pointer }
.muted { color:#777; font-size:0.88rem }
.small-chart { width:560px; height:320px; max-width:95vw }
.fab-chart { padding:0.5rem; }
.chart-container { margin:1rem auto 0; background:var(--card); padding:0.9rem; border-radius:0.6rem; box-shadow:var(--shadow-small); max-width:560px; width:100%; display:flex; flex-direction:column; align-items:center; }

/* Theme customizations are now handled by the CSS variable block at the top of this file. */
</style>
