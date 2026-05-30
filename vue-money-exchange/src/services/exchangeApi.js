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
    console.error('Fallo en la comunicación con la API:', error.message ?? error);
    throw error;
  }
}