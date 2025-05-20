// supportLogic.js

/**
 * Initialiseert een knop met een click event listener.
 * @param {string} buttonId - De ID van het knop-element.
 * @param {function} callback - De functie die moet worden uitgevoerd wanneer op de knop wordt geklikt.
 */
export function initializeButton(buttonId, callback) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.addEventListener('click', callback);
    } else {
        console.warn(`Knop met ID '${buttonId}' niet gevonden.`);
    }
}