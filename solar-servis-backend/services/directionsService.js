import superagent from 'superagent';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
console.log('GOOGLE_MAPS_API_KEY:', GOOGLE_MAPS_API_KEY); // Logování

/**
 * Funkce pro výpočet času a vzdálenosti mezi dvěma body.
 * @param {Object} from - Souřadnice startovního bodu (lat, lng).
 * @param {Object} to - Souřadnice cílového bodu (lat, lng).
 */
export const calculateTravelTime = async (from, to) => {
  try {
    // Kontrola, zda 'from' a 'to' obsahují platné souřadnice
    if (!from || !to || !from.lat || !from.lng || !to.lat || !to.lng) {
      throw new Error('Chybějící souřadnice: Ujistěte se, že objekty "from" a "to" mají platné lat a lng.');
    }

    // Logování hodnot souřadnic
    console.log(`Výpočet trasy z ${from.lat}, ${from.lng} do ${to.lat}, ${to.lng}`);

    // Vytvoření GET požadavku na Google Distance Matrix API pomocí superagent
    const response = await superagent
      .get('https://maps.googleapis.com/maps/api/distancematrix/json')
      .query({
        origins: `${from.lat},${from.lng}`,
        destinations: `${to.lat},${to.lng}`,
        key: GOOGLE_MAPS_API_KEY,
      });

    // Kontrola, zda je odpověď validní
    if (!response.body.rows || !response.body.rows[0].elements || !response.body.rows[0].elements[0]) {
      throw new Error('Chyba při zpracování odpovědi z API.');
    }

    // Extrakce dat z odpovědi
    const result = response.body.rows[0].elements[0];
    return {
      distance: result.distance.value / 1000, // Převod na kilometry
      duration: result.duration.value / 60,   // Převod na minuty
    };
  } catch (error) {
    console.error("Chyba při výpočtu vzdálenosti a času:", error);
    return { distance: 0, duration: 0 };
  }
};
