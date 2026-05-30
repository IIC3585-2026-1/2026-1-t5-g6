const API_BASE_URL = 'https://api.frankfurter.dev/v2';

export async function fetchLatestRates(currency = 'CLP') {
  try {
    const response = await fetch(`${API_BASE_URL}/rates?base=${currency}`);

    if (!response.ok) {
      let apiErrorMessage = '';
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          apiErrorMessage = ` - Detalle de la API: ${errorData.message}`
        }
      } catch (parseError) {}
      
      throw new Error(`Error al conectar con la API: ${response.status} ${response.statusText}${apiErrorMessage}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Respuesta de API vacía o en formato inesperado');
    }

    const baseCurrency = data[0].base;
    const lastUpdate = data[0].date;

    const ratesDict = data.reduce((acc, currentItem) => {
      acc[currentItem.quote] = currentItem.rate;
      return acc;
    }, {});

    ratesDict[baseCurrency] = 1;

    return {
      base: baseCurrency,
      data: lastUpdate,
      rates: ratesDict,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : error;
    console.error('Fallo en la comunicación con la API:', errorMessage);
    throw error;
  }
}

/**
 * 
 * @param {string} source 
 * @param {string} target 
 * @param {number} days 
 */
export async function getHistoricalRates(source, target, days = 7) {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - days);
  const formattedDate = pastDate.toISOString().split('T')[0];
  try {
    const response = await fetch(`${API_BASE_URL}/rates?from=${formattedDate}&base=${source}&quotes=${target}`);

    if (!response.ok) {
      let apiErrorMessage = "";
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          apiErrorMessage = ` - Detalle de la API: ${errorData.message}`;
        }
      } catch (parseError) {}
      
      throw new Error(`Error al conectar con la API histórica: ${response.status} ${response.statusText}${apiErrorMessage}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const cleanHistory = data.map(item => ({
      date: item.date,
      rate: item.rate
    }));

    return cleanHistory;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : error;
    console.error('Fallo en la comunicación con la API:', errorMessage);
    throw error;
  }
}