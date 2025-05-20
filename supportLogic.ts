// supportLogic.ts - Ondersteunende logica voor Aevum Spectra

/**
 * Utility-functie om een willekeurig getal binnen een bereik te genereren.
 * @param min - Het minimum getal (inclusief).
 * @param max - Het maximum getal (inclusief).
 * @returns Een willekeurig getal tussen min en max.
 */
export function getRandomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Functie om een kleur te genereren op basis van de tijd van de dag.
 * @param hour - Het huidige uur (0-23).
 * @returns Een string met de kleurcode.
 */
export function getDayNightColor(hour: number): string {
    if (hour >= 6 && hour < 18) {
        return '#87CEEB'; // Dag: Hemelsblauw
    } else {
        return '#2C3E50'; // Nacht: Donkerblauw
    }
}

/**
 * Functie om een eenvoudige animatie te berekenen.
 * @param progress - De voortgang van de animatie (0 tot 1).
 * @returns De interpolatiewaarde.
 */
export function easeInOutQuad(progress: number): number {
    return progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
}
