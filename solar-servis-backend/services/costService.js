// Cesta: services/costService.js

/**
 * Výpočet celkových nákladů
 * @param {Array} materials - Pole s materiály, každý obsahuje {quantity, unitPrice}.
 * @param {number} hourlyRate - Sazba za hodinu práce.
 * @param {number} travelCost - Náklady na cestování.
 * @param {number} totalTime - Celkový čas strávený na zakázce (v hodinách).
 * @param {boolean} chargeTravel - Určuje, zda má být cestování účtováno zákazníkovi.
 */
export function calculateCosts(materials, hourlyRate, travelCost, totalTime, chargeTravel = true) {
    // Výpočet ceny za materiál
    const materialCost = materials.reduce((sum, material) => {
        return sum + (material.quantity * material.unitPrice || 0);
    }, 0);

    // Výpočet ceny za práci
    const laborCost = hourlyRate * totalTime;

    // Celkové náklady (s podmínkou účtování cestovních nákladů)
    const totalTravelCost = chargeTravel ? travelCost : 0;
    const totalCosts = laborCost + materialCost + totalTravelCost;

    return {
        laborCost,
        materialCost,
        travelCost: totalTravelCost,
        totalCosts,
    };
}

/**
 * Výpočet celkového času
 * @param {string} departureTime - Čas odjezdu z firmy.
 * @param {string} leaveTime - Čas odjezdu ze zakázky.
 * @param {string} returnTime - Čas návratu na firmu.
 */
export function calculateTotalTime(departureTime, leaveTime, returnTime) {
    const departure = new Date(departureTime);
    const leave = new Date(leaveTime);
    const returnToOffice = new Date(returnTime);

    if (isNaN(departure) || isNaN(leave) || isNaN(returnToOffice)) {
        throw new Error('Čas odjezdu, odjezdu ze zakázky nebo návratu není platný.');
    }

    // Doba strávená na zakázce
    const workDurationInMilliseconds = leave - departure;

    // Doba návratu na firmu
    const returnDurationInMilliseconds = returnToOffice - leave;

    if (workDurationInMilliseconds < 0 || returnDurationInMilliseconds < 0) {
        throw new Error('Časový úsek nemůže být záporný.');
    }

    // Celkový čas v hodinách
    const totalTimeInMilliseconds = workDurationInMilliseconds + returnDurationInMilliseconds;
    return totalTimeInMilliseconds / (1000 * 60 * 60); // Převod na hodiny
}
