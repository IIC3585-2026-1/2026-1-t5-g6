# MoneyExchange - Vue y Svelte

Este repositorio contiene dos implementaciones del mismo proyecto de conversor de monedas:

- `svelte-money-exchange`
- `vue-money-exchange`

La idea del trabajo fue comparar cómo se puede resolver una misma aplicación usando dos frameworks distintos, manteniendo funcionalidades equivalentes.

## Requisitos

- `Node.js`
- `npm`

## Cómo iniciar el proyecto

Cada implementación se ejecuta por separado.

### Vue

```sh
cd vue-money-exchange
npm install
npm run dev
```

### Svelte

```sh
cd svelte-money-exchange
npm install
npm run dev
```

## Diferencias entre la versión Svelte y Vue

### Svelte

- La versión en Svelte se apoya en una reactividad más directa.
- Gran parte de la lógica está resuelta desde una estructura simple y cercana al componente principal.
- Se usó como referencia funcional para portar comportamiento a Vue.

### Vue

- La versión en Vue se apoya en componentes y en un store con `Pinia`.
- Se mantuvo la base visual original trabajada por el equipo y se añadieron funcionalidades equivalentes a las de Svelte.
- La separación en componentes facilita reutilizar partes como el gráfico y el menú flotante.

## Funcionalidades implementadas

Ambas versiones buscan cubrir el mismo conjunto base de características:

- Conversión entre monedas.
- Cambio de moneda origen y destino.
- Historial de conversiones.
- Gráfico de tasas históricas.
- Favoritos.
- Monedas personalizadas.
- Overrides manuales de pares de conversión.

## Uso de IA en el desarrollo

Durante el desarrollo sí se utilizó IA de manera directa y práctica, no solo como apoyo general.

### Google Gemini

Se utilizó principalmente para organización y planificación del trabajo entre los 3 integrantes:

- Ayudó a dividir tareas entre frontend, lógica de conversión y adaptación entre frameworks.
- Se usó para ordenar qué partes desarrollar primero y cómo repartir avances entre Svelte y Vue.
- También sirvió para aclarar cómo portar funcionalidades equivalentes entre ambas implementaciones.

### GitHub Copilot en modo agéntico

Se utilizó para generar y acelerar partes concretas del desarrollo:

- Generación de código base para el menú desplegable/flotante.
- Generación de código base para el gráfico de tasas históricas.
- Apoyo en la estructura inicial de componentes en Vue.
- Apoyo en la escritura de lógica repetitiva del store, handlers y persistencia con `localStorage`.
- Apoyo en la adaptación de funcionalidades existentes en Svelte hacia Vue.

### Forma concreta en que se usó la IA

La IA no se usó solo para pedir explicaciones, sino para producir material de desarrollo que después fue ajustado por el equipo. En particular:

- Se le pidió generar la base del componente del gráfico y su integración con `Chart.js`.
- Se le pidió generar la base del menú flotante/desplegable con favoritos, overrides y monedas personalizadas.
- Se utilizó para proponer código inicial de eventos, handlers, estructura de componentes y estilos base.
- Luego ese código fue revisado, corregido, adaptado a la estructura del proyecto y alineado con la base visual trabajada por el equipo.
