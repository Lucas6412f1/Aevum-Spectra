// main.js - Aevum Spectra Game Logic (Modernized for 2025!)

// --- 1. GLOBALE CONSTANTEN EN VARIABELEN ---

// Game Informatie
const GAME_TITLE = 'Aevum Spectra';
const GAME_VERSION = '0.4.1'; // Aangepast!
const GAME_VERSION_SUFFIX = 'Alpha'; // Aangepast naar 'Alpha'

// Game States
const GAME_STATE = {
    MENU: 'menu',           // Startscherm / Verhaal intro
    PLAYING: 'playing',     // Actieve gameplay
    DIALOG: 'dialog',       // Popup actief (Time Machine, Leaderboard, Game Over melding, Naam invoer)
    LEVEL_COMPLETE: 'level_complete', // Tijdperk voltooid (voordat Time Machine opent)
    GAME_FINISHED: 'game_finished' // Spel helemaal uitgespeeld
};

// Game Instellingen & Balans
const TILE_SIZE = 32;           // Grootte van speler, vijanden, kristallen
const PLAYER_SPEED = 4;         // Snelheid van de speler
const ENEMY_SPEED = 2;          // Snelheid van de vijanden
const CRYSTAL_SPAWN_RATE = 0.02;    // Kans per frame dat een kristal spawnt (0.02 = 2%)
const MAX_CRYSTALS_ON_SCREEN = 8;   // Maximaal aantal kristallen tegelijk op het scherm
const MAX_HITS_ALLOWED = 5;      // Aantal hits voordat het tijdperk gereset wordt

// --- 2. GAME STATE VARIABELEN ---
let currentState = GAME_STATE.MENU; // Huidige staat van het spel
let score = 0;                      // Huidige score van de speler
let questProgress = 0;              // Aantal verzamelde kristallen voor de huidige quest
let hitsTaken = 0;                  // Aantal keren dat de speler is geraakt in het huidige tijdperk
let gameLoopId;                     // Opslag voor requestAnimationFrame ID om de loop te pauzeren/stoppen
let currentLanguage = 'nl';         // Standaardtaal

// --- 3. GAME OBJECTS ---
const gameObjects = {
    player: {
        x: 0,
        y: 0,
        size: TILE_SIZE,
        speed: PLAYER_SPEED,
        frame: 0 // Voor eventuele toekomstige animatie
    },
    crystals: [],
    enemies: [],
    portals: []
};

// --- 4. DATA MODELLEN ---

// Tijdperk data
const eras = [
    {
        id: 0,
        name: { nl: 'Prehistorie', en: 'Prehistory' },
        quest: { nl: 'Verzamel 5 kristallen en craft een Tijdkristal!', en: 'Collect 5 crystals and craft a Time Crystal!' },
        requiredCrystals: 5,
        craftItemName: { nl: 'Tijdkristal', en: 'Time Crystal' },
        crafted: false,
        enemiesCount: 3
    },
    {
        id: 1,
        name: { nl: 'Toekomst', en: 'Future' },
        quest: { nl: 'Craft een Energiecel en bereik het portaal!', en: 'Craft an Energy Cell and reach the portal!' },
        requiredCrystals: 7,
        craftItemName: { nl: 'Energiecel', en: 'Energy Cell' },
        crafted: false,
        enemiesCount: 5
    },
    {
        id: 2,
        name: { nl: 'Middeleeuwen', en: 'Middle Ages' },
        quest: { nl: 'Verzamel 10 kristallen en craft een Runensteen!', en: 'Collect 10 crystals and craft a Rune Stone!' },
        requiredCrystals: 10,
        craftItemName: { nl: 'Runensteen', en: 'Rune Stone' },
        crafted: false,
        enemiesCount: 7
    }
    // Voeg hier meer tijdperken toe indien nodig
];
let selectedEra = 0; // Index van het momenteel geselecteerde/actieve tijdperk

// Multi-language support
const translations = {
    nl: {
        welcome: "Welkom bij Aevum Spectra!", // Hardcoded in HTML, maar hier voor consistentie
        score: "Score",
        level: "Tijdperk", // Aangepast van "Level" naar "Tijdperk" in JS
        quest: "Opdracht",
        progress: "Voortgang",
        version: "Versie",
        startGame: "Start spel", // Voor de button
        versionSuffix: "Alpha",
        questComplete: "Opdracht voltooid!",
        levelComplete: "Tijdperk voltooid! Op naar het volgende avontuur!",
        crafted: "Gecraft!",
        craftItem: "Craft item",
        notEnoughCrystals: "Niet genoeg kristallen om te craften!",
        itemCrafted: (itemName) => `Je hebt de ${itemName} gecraft!`,
        hitMessage: (crystalsLost, hits, maxHits) => `Je bent geraakt! ${crystalsLost} kristallen verloren. (${hits}/${maxHits} hits)`,
        gameOverMessage: "Game Over! Je bent te vaak geraakt. Tijdperk wordt gereset.",
        gameFinished: "Gefeliciteerd! Je hebt alle tijdperken voltooid!",
        enterName: "Voer je naam in voor het leaderboard:",
        anonymous: "Anoniem",
        noScoresYet: "Nog geen scores",
        close: "Sluiten",
        leaderboardTitle: "Leaderboard",
        timemachineTitle: "🕰️ Tijdmachine",
        levelReady: "Tijdperk voltooid!", // Aangepast voor consistentie
        startEraBtn: "Start Tijdperk",
        // Story tekst is nu hardcoded in index.html, dus deze wordt niet gebruikt door JS voor content
        story: {
            title: "Aevum Spectra",
            intro: "In het jaar 2150 ontdek jij, een briljante uitvinder en avonturier, een mysterieuze tijdmachine die verborgen ligt onder de ruïnes van een oude stad. Deze technologie stelt je in staat om door verschillende tijdperken te reizen — van oorlogstijdperken in het verleden tot dystopische toekomstscenario's.",
            conflict: "Maar de tijdlijn is ernstig verstoord. Oorlogen dreigen uit te breken die de toekomst kunnen vernietigen. Duistere krachten manipuleren gebeurtenissen om chaos te zaaien en macht te grijpen.",
            mission: "Jouw missie is helder: stop oorlogen voordat ze beginnen, voorkom rampen en red onschuldige mensen. Elk succes brengt de wereld een stukje dichter bij vrede en een betere toekomst.",
            gameplay: "Met je slimme uitvindingen en moedige acties moet je puzzels oplossen, vijanden slim te slim af zijn en belangrijke keuzes maken die de loop van de geschiedenis veranderen. Alleen jij kunt het tij keren en een betere wereld creëren — één tijdperk tegelijk."
        }
    },
    en: {
        welcome: "Welcome to Aevum Spectra!", // Hardcoded in HTML, maar hier voor consistentie
        score: "Score",
        level: "Era", // Aangepast van "Level" naar "Era" in JS
        quest: "Quest",
        progress: "Progress",
        version: "Version",
        startGame: "Start game", // Voor de button
        versionSuffix: "Alpha",
        questComplete: "Quest complete!",
        levelComplete: "Era complete! On to the next adventure!",
        crafted: "Crafted!",
        craftItem: "Craft item",
        notEnoughCrystals: "Not enough crystals to craft!",
        itemCrafted: (itemName) => `You crafted the ${itemName}!`,
        hitMessage: (crystalsLost, hits, maxHits) => `You were hit! Lost ${crystalsLost} crystals. (${hits}/${MAX_HITS_ALLOWED} hits)`,
        gameOverMessage: "Game Over! You were hit too many times. Era is being reset.",
        gameFinished: "Congratulations! You have completed all eras!",
        enterName: "Enter your name for the leaderboard:",
        anonymous: "Anonymous",
        noScoresYet: "No scores yet",
        close: "Close",
        leaderboardTitle: "Leaderboard",
        timemachineTitle: "🕰️ Time Machine",
        levelReady: "Era completed!", // Aangepast voor consistentie
        startEraBtn: "Start Era",
        // Story tekst is nu hardcoded in index.html, dus deze wordt niet gebruikt door JS voor content
        story: {
            title: "Aevum Spectra",
            intro: "In the year 2150, you, a brilliant inventor and adventurer, discover a mysterious time machine hidden beneath the ruins of an ancient city. This technology allows you to travel through different eras — from wartorn periods in the past to dystopian future scenarios.",
            conflict: "But the timeline is severely disturbed. Wars threaten to break out that could destroy the future. Dark forces are manipulating events to sow chaos and seize power.",
            mission: "Your mission is clear: stop wars before they begin, prevent disasters, and save innocent people. Each success brings the world one step closer to peace and a better future.",
            gameplay: "With your clever inventions and brave actions, you must solve puzzles, outsmart enemies, and make important choices that change the course of history. Only you can turn the tide and create a better world — one era at a time."
        }
    }
};

// --- 5. DOM ELEMENT REFERENTIES ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameTitleElement = document.getElementById('game-title');
const storylineElement = document.getElementById('storyline');
const storylineStartButton = document.getElementById('storyline-start-btn'); // Verwijzing naar de knop in de hardcoded storyline
const hudElement = document.getElementById('hud');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const questElement = document.getElementById('opdracht');
const progressElement = document.getElementById('voortgang');
const versionElement = document.getElementById('versie');
const meldingElement = document.getElementById('melding');

// Dynamisch gemaakte elementen - worden later in JS aangemaakt
let craftButton;
let levelCompletedLabel;

// --- 6. INITIALISATIE CANVAS ---
// Canvas breedte en hoogte moeten relatief zijn aan de container.
// Omdat de HUD nu boven het canvas staat in de flexbox, moeten we de canvas hoogte aanpassen
// De CSS regelt dit nu met `height: calc(100% - 100px);` voor het canvas.
// De `width` en `height` attributen op de canvas tag blijven de interne resolutie bepalen.
canvas.width = 900; // VERBETERD: Interne canvas breedte
canvas.height = 470; // VERBETERD: Interne canvas hoogte (Totale container hoogte 550 - HUD hoogte 80)

// --- 7. INPUT HANDLING ---
const keys = {};
document.addEventListener('keydown', e => {
    // Zorg ervoor dat de keys alleen geregistreerd worden tijdens het spelen
    if (currentState === GAME_STATE.PLAYING) {
        keys[e.key.toLowerCase()] = true;
    }
});
document.addEventListener('keyup', e => {
    if (currentState === GAME_STATE.PLAYING) {
        keys[e.key.toLowerCase()] = false;
    }
});

canvas.addEventListener('click', () => {
    // Focus de canvas zodat toetsenbord input werkt zonder extra klik
    canvas.focus();
});

// --- 8. HELPER FUNCTIES ---

const getCurrentLanguage = () => translations[currentLanguage] || translations['nl'];

/**
 * Toont een tijdelijke melding op het scherm.
 * @param {string} message - Het te tonen bericht.
 * @param {boolean} isCritical - Indien true, blijft de melding staan en is rood. Anders verdwijnt het na 3 sec.
 */
function displayMessage(message, isCritical = false) {
    if (!meldingElement) return;

    meldingElement.textContent = message;
    // Gebruik CSS custom property voor de border kleur
    meldingElement.style.setProperty('--melding-border-color', isCritical ? '#FF4136' : '#FFD700');
    meldingElement.style.display = 'block';

    if (!isCritical) {
        // Animatie beheert nu het display: none
        // De @keyframes fadeInOut in CSS zorgt voor de timing en fading
        meldingElement.style.animation = 'fadeInOut 3s forwards cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    } else {
        // Voor kritieke meldingen, pauzeer de game
        currentState = GAME_STATE.DIALOG;
        // Zorg dat de animatie correct wordt afgespeeld of gereset als deze al liep
        meldingElement.style.animation = 'none'; // Reset animatie
        void meldingElement.offsetWidth; // Trigger reflow
        meldingElement.style.animation = 'fadeInOut 3s forwards cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        // Na de animatie, als kritiek: reset game of resume (afhankelijk van hitsTaken)
        setTimeout(() => {
            if (hitsTaken >= MAX_HITS_ALLOWED) {
                resetEra();
            }
            currentState = GAME_STATE.PLAYING;
            // Melding wordt door de CSS animatie verborgen.
            // Zorg ervoor dat de melding weer onzichtbaar wordt voor de volgende keer.
            if (!meldingElement.style.animationPlayState || meldingElement.style.animationPlayState === 'running') {
                meldingElement.addEventListener('animationend', function handler() {
                    meldingElement.style.display = 'none';
                    meldingElement.removeEventListener('animationend', handler);
                });
            } else {
                meldingElement.style.display = 'none';
            }
            updateHUD();
        }, 3000); // Tijd voor de animatie om af te lopen
    }
}


function resetPlayer() {
    gameObjects.player.x = canvas.width / 2 - gameObjects.player.size / 2;
    gameObjects.player.y = canvas.height / 2 - gameObjects.player.size / 2;
}

const checkCollision = (obj1, obj2) => {
    return obj1.x < obj2.x + obj2.size &&
           obj1.x + obj1.size > obj2.x &&
           obj1.y < obj2.y + obj2.size &&
           obj1.y + obj1.size > obj2.y;
};

// --- 9. GAME LOGICA FUNCTIES ---

function updatePlayer() {
    if (keys['arrowup'] || keys['w']) {
        gameObjects.player.y -= gameObjects.player.speed;
    }
    if (keys['arrowdown'] || keys['s']) {
        gameObjects.player.y += gameObjects.player.speed;
    }
    if (keys['arrowleft'] || keys['a']) {
        gameObjects.player.x -= gameObjects.player.speed;
    }
    if (keys['arrowright'] || keys['d']) {
        gameObjects.player.x += gameObjects.player.speed;
    }

    gameObjects.player.x = Math.max(0, Math.min(canvas.width - gameObjects.player.size, gameObjects.player.x));
    gameObjects.player.y = Math.max(0, Math.min(canvas.height - gameObjects.player.size, gameObjects.player.y));
}

function updateEnemies() {
    gameObjects.enemies.forEach(enemy => {
        const player = gameObjects.player;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            enemy.x += (dx / distance) * ENEMY_SPEED;
            enemy.y += (dy / distance) * ENEMY_SPEED;
        }

        if (checkCollision(player, enemy)) {
            handleEnemyCollision();
        }
    });
}

function handleEnemyCollision() {
    if (currentState !== GAME_STATE.PLAYING) {
        return;
    }

    const lang = getCurrentLanguage();
    const crystalsToLose = Math.floor(Math.random() * 3) + 1;
    questProgress -= crystalsToLose;

    if (questProgress < 0) {
        questProgress = 0;
    }

    hitsTaken++;

    // Speler terug naar een random positie op het scherm
    gameObjects.player.x = Math.random() * (canvas.width - gameObjects.player.size);
    gameObjects.player.y = Math.random() * (canvas.height - gameObjects.player.size);

    if (hitsTaken >= MAX_HITS_ALLOWED) {
        displayMessage(lang.gameOverMessage, true); // True voor kritieke melding
    } else {
        displayMessage(lang.hitMessage(crystalsToLose, hitsTaken, MAX_HITS_ALLOWED), true); // True voor kritieke melding
    }
    updateHUD();
}

function resetEra() {
    hitsTaken = 0;
    questProgress = 0;
    score = 0;

    initializeLevel();
    resetPlayer();
}

function initializeLevel() {
    gameObjects.crystals = [];
    gameObjects.enemies = [];
    gameObjects.portals = [];

    // Spawn initiële kristallen
    for (let i = 0; i < 3; i++) {
        spawnCrystal();
    }

    // Spawn vijanden gebaseerd op het huidige tijdperk
    const era = eras[selectedEra];
    for (let i = 0; i < era.enemiesCount; i++) {
        spawnEnemy();
    }

    // Voeg het portaal toe aan het einde van het speelveld
    gameObjects.portals.push({
        x: canvas.width * 0.8 - TILE_SIZE / 2,
        y: canvas.height * 0.8 - TILE_SIZE / 2,
        size: TILE_SIZE * 1.5 // Maak portaal groter dan andere objecten
    });
}

function spawnCrystal() {
    const margin = 50; // Zorg dat kristallen niet te dicht bij de rand spawnen
    gameObjects.crystals.push({
        x: margin + Math.random() * (canvas.width - margin * 2),
        y: margin + Math.random() * (canvas.height - margin * 2),
        size: TILE_SIZE / 2,
        collected: false
    });
}

function spawnEnemy() {
    const margin = 50; // Zorg dat vijanden niet te dicht bij de rand spawnen
    gameObjects.enemies.push({
        x: margin + Math.random() * (canvas.width - margin * 2),
        y: margin + Math.random() * (canvas.height - margin * 2),
        size: TILE_SIZE,
        speed: ENEMY_SPEED
    });
}

function tryCraft() {
    const lang = getCurrentLanguage();
    const era = eras[selectedEra];

    if (!era.crafted && questProgress >= era.requiredCrystals) {
        era.crafted = true;
        score += 25; // Bonus score voor craften
        displayMessage(lang.itemCrafted(era.craftItemName[currentLanguage]));
        updateHUD();
        canvas.focus(); // Zorgt dat de speler direct verder kan
    } else {
        displayMessage(lang.notEnoughCrystals, false);
        canvas.focus();
    }
}

// --- 10. UI UPDATERS ---

// Deze functie past de HUD en dynamische elementen aan.
// De storyline-content is hardcoded in index.html en wordt NIET door deze functie gewijzigd.
function updateGeneralUIText() {
    const lang = getCurrentLanguage();

    // Update de taal van de hoofdgame-titel
    // De game-title in HTML heeft data-nl en data-en attributen, gebruik die.
    if (gameTitleElement) {
        gameTitleElement.textContent = gameTitleElement.getAttribute(`data-${currentLanguage}`);
    }

    // Update de 'Start spel' knop in de storyline overlay
    if (storylineStartButton) {
        storylineStartButton.textContent = lang.startGame;
    }
}

function updateHUD() {
    const lang = getCurrentLanguage();
    const era = eras[selectedEra];

    // Zorg dat de HUD-elementen bestaan (ze zijn hardcoded in index.html)
    if (scoreElement) scoreElement.textContent = `${lang.score}: ${score}`;
    if (levelElement) levelElement.textContent = `${lang.level}: ${era.name[currentLanguage]}`;
    if (questElement) questElement.textContent = `${lang.quest}: ${era.quest[currentLanguage]}`;
    if (progressElement) progressElement.textContent = `${lang.progress}: ${questProgress}/${era.requiredCrystals}`;
    if (versionElement) versionElement.textContent = `${lang.version}: ${GAME_VERSION} ${lang.versionSuffix}`;

    // Update de dynamisch gemaakte craft knop
    if (craftButton) {
        craftButton.textContent = era.crafted ? lang.crafted : lang.craftItem;
        craftButton.disabled = era.crafted || questProgress < era.requiredCrystals;
    }
}

// Functie om de Time Machine dialoog te tonen
function showTimeMachine() {
    currentState = GAME_STATE.DIALOG;
    cancelAnimationFrame(gameLoopId); // Pauzeer de game loop

    let overlay = document.getElementById('timemachine-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'timemachine-overlay';
        overlay.classList.add('dialog-overlay');
        document.body.appendChild(overlay);
    }

    const lang = getCurrentLanguage();
    overlay.innerHTML = `
        <div class="dialog-content">
            <h2>${lang.timemachineTitle}</h2>
            <div id="era-select" class="era-selector-grid">
                ${eras.map((era, i) => `
                    <div class="era-card">
                        <button class="era-button" data-era="${i}">
                            ${era.name[currentLanguage]}
                        </button>
                        ${era.crafted ? `<span class="era-status-label">${lang.levelReady}</span>` : ''}
                    </div>
                `).join('')}
            </div>
            <p id="era-quest-display" class="era-quest-text"></p>
            <button id="start-era-btn" class="main-button">${lang.startEraBtn}</button>
        </div>
    `;

    // Event listeners toevoegen voor de dynamisch gemaakte knoppen
    document.querySelectorAll('#era-select .era-button').forEach(btn => {
        btn.onclick = () => {
            selectedEra = parseInt(btn.getAttribute('data-era'));
            document.getElementById('era-quest-display').textContent = eras[selectedEra].quest[currentLanguage];
            // Visuele feedback voor de geselecteerde tijdperk knop
            document.querySelectorAll('.era-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
    });

    document.getElementById('start-era-btn').onclick = () => {
        overlay.remove(); // Verwijder de overlay
        startEra(selectedEra); // Start het geselecteerde tijdperk
        canvas.focus(); // Zorg dat de canvas weer input ontvangt
    };

    // Zorg ervoor dat de quest tekst en de geselecteerde knop correct zijn bij het openen
    document.getElementById('era-quest-display').textContent = eras[selectedEra].quest[currentLanguage];
    document.querySelector(`.era-button[data-era="${selectedEra}"]`).classList.add('selected');
}

// Functie om de Time Machine UI-teksten te updaten bij taalwissel
function updateTimeMachineUIText() {
    const timemachineOverlay = document.getElementById('timemachine-overlay');
    if (timemachineOverlay && currentState === GAME_STATE.DIALOG) {
        const lang = getCurrentLanguage();

        timemachineOverlay.querySelector('h2').textContent = lang.timemachineTitle;

        document.querySelectorAll('#era-select .era-button').forEach(btn => {
            const eraId = parseInt(btn.getAttribute('data-era'));
            btn.textContent = eras[eraId].name[currentLanguage];
            const statusLabel = btn.nextElementSibling; // Het span element na de knop
            if (statusLabel) {
                statusLabel.textContent = lang.levelReady;
            }
        });

        document.getElementById('era-quest-display').textContent = eras[selectedEra].quest[currentLanguage];
        document.getElementById('start-era-btn').textContent = lang.startEraBtn;
    }
}

/** Toont een kort label dat aangeeft dat een tijdperk voltooid is. */
function showCompletedLabel() {
    // Creëer het label dynamisch als het nog niet bestaat
    if (!levelCompletedLabel) {
        levelCompletedLabel = document.createElement('div');
        levelCompletedLabel.id = 'level-completed-label'; // Belangrijk voor CSS targeting
        levelCompletedLabel.classList.add('level-completed-label'); // Belangrijk voor CSS targeting
        document.body.appendChild(levelCompletedLabel);
    }

    levelCompletedLabel.textContent = getCurrentLanguage().levelReady;
    levelCompletedLabel.style.display = 'block'; // Zorg dat het element zichtbaar is
    
    // Reset animatie voor herhaling
    levelCompletedLabel.style.animation = 'none';
    void levelCompletedLabel.offsetWidth; // Trigger reflow
    levelCompletedLabel.style.animation = 'popAndFade 1.5s forwards cubic-bezier(0.68, -0.55, 0.26, 1.55)';

    setTimeout(() => {
        // Na de animatie, verberg het element. De animatie zelf doet de fade-out.
        // We zetten display:none pas na de animatie, voor een vloeiend effect.
        levelCompletedLabel.style.display = 'none';
    }, 1500); // Duur van de animatie
}

function setLanguage(lang) {
    if (!translations[lang]) {
        console.warn(`Language ${lang} not found, falling back to English`);
        lang = 'en';
    }
    currentLanguage = lang;

    updateGeneralUIText(); // Update titel en startknop
    updateHUD(); // Update HUD teksten
    updateTimeMachineUIText(); // Update Time Machine dialog als deze open is

    // Update actieve status van de taalselector knoppen
    document.querySelectorAll('#language-selector span').forEach(span => {
        span.classList.toggle('active', span.getAttribute('data-lang') === lang);
    });
}

// --- 11. GAME STATE MANAGEMENT FUNCTIES ---

function startGame() {
    if (storylineElement) storylineElement.style.display = 'none';
    currentState = GAME_STATE.PLAYING;
    startEra(selectedEra); // Start het eerste of laatst geselecteerde tijdperk
    canvas.focus(); // Zorgt dat de canvas focus heeft voor toetsenbord input
}

function startEra(eraId) {
    selectedEra = eraId;
    const era = eras[selectedEra];

    questProgress = 0;
    hitsTaken = 0;
    score = 0; // Reset score bij het starten van een nieuw tijdperk

    initializeLevel(); // Reset game objects voor het nieuwe tijdperk
    resetPlayer(); // Plaats speler in het midden
    updateHUD(); // Update HUD met nieuwe tijdperk info

    // Zorg ervoor dat de gameloop draait
    if (!gameLoopId) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

// --- 12. GAME LOOP EN RENDERING ---

function gameLoop() {
    if (currentState === GAME_STATE.PLAYING) {
        updatePlayer();
        updateEnemies();
        
        // Spawn kristallen indien nodig en er niet te veel zijn
        if (gameObjects.crystals.filter(c => !c.collected).length < MAX_CRYSTALS_ON_SCREEN && Math.random() < CRYSTAL_SPAWN_RATE) {
            spawnCrystal();
        }

        // Controleer op kristal collectie
        gameObjects.crystals.forEach(crystal => {
            if (!crystal.collected && checkCollision(gameObjects.player, crystal)) {
                crystal.collected = true;
                questProgress++;
                score += 10; // Punten voor het verzamelen van kristallen
                updateHUD();
                if (questProgress >= eras[selectedEra].requiredCrystals) {
                    displayMessage(getCurrentLanguage().questComplete, false);
                }
            }
        });

        // Controleer op tijdperk voltooiing (na craften en bereiken van portaal)
        const currentEra = eras[selectedEra];
        if (currentEra.crafted && gameObjects.portals.length > 0) {
            const portal = gameObjects.portals[0];
            if (checkCollision(gameObjects.player, portal)) {
                showCompletedLabel(); // Toon "Level Voltooid!" label
                currentState = GAME_STATE.LEVEL_COMPLETE; // Zet de game state
                cancelAnimationFrame(gameLoopId); // Pauzeer de loop

                setTimeout(() => {
                    if (selectedEra < eras.length - 1) {
                        // Ga naar het volgende tijdperk
                        selectedEra++;
                        showTimeMachine(); // Toon Time Machine om volgend tijdperk te kiezen
                    } else {
                        // Alle tijdperken voltooid, game is uitgespeeld
                        displayMessage(getCurrentLanguage().gameFinished, true);
                        requestPlayerNameForLeaderboard(); // Vraag naam voor leaderboard
                        currentState = GAME_STATE.GAME_FINISHED; // Zet de game state
                    }
                }, 1200); // Wacht even voordat de UI opent
            }
        }
    }

    drawGame(); // Teken de game op het canvas
    gameLoopId = requestAnimationFrame(gameLoop); // Herhaal de loop
}

/** Tekent alle game-objecten op het canvas met verbeterde visuele stijlen. */
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Wis het canvas

    // --- Teken Speler (Modern Blokkig) ---
    const player = gameObjects.player;
    ctx.fillStyle = '#00BFFF'; // Levendig hemelsblauw
    ctx.shadowColor = 'rgba(0, 191, 255, 0.7)';
    ctx.shadowBlur = 10;
    ctx.fillRect(player.x, player.y, player.size, player.size);
    
    // Voeg een subtielere binnenste schaduw toe (apart getekend)
    // Dit zorgt voor een lichter center, wat diepte geeft.
    ctx.globalCompositeOperation = 'source-atop'; // Teken alleen binnen het bestaande vierkant
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.shadowColor = 'transparent'; // Schaduw resetten voor dit element
    ctx.fillRect(player.x, player.y, player.size, player.size);
    ctx.globalCompositeOperation = 'source-over'; // Terug naar normale modus

    ctx.shadowBlur = 0; // Reset schaduw na het tekenen van de speler

    // --- Teken Kristallen (Glinsterende Diamanten) ---
    gameObjects.crystals.forEach(crystal => {
        if (!crystal.collected) {
            ctx.fillStyle = '#FFD700'; // Goudgeel
            ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
            ctx.shadowBlur = 8;

            // Teken een ster- of diamantvorm
            ctx.beginPath();
            ctx.moveTo(crystal.x + crystal.size / 2, crystal.y);
            ctx.lineTo(crystal.x + crystal.size, crystal.y + crystal.size / 2);
            ctx.lineTo(crystal.x + crystal.size / 2, crystal.y + crystal.size);
            ctx.lineTo(crystal.x, crystal.y + crystal.size / 2);
            ctx.closePath();
            ctx.fill();

            ctx.shadowBlur = 0; // Reset schaduw
        }
    });

    // --- Teken Vijanden (Agressieve Driehoeken/Pijlen) ---
    ctx.fillStyle = '#FF4136'; // Fel rood
    gameObjects.enemies.forEach(enemy => {
        ctx.shadowColor = 'rgba(255, 65, 54, 0.7)';
        ctx.shadowBlur = 10;

        // Teken een agressievere pijl of scherpere driehoek
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y + enemy.size);
        ctx.lineTo(enemy.x + enemy.size / 2, enemy.y);
        ctx.lineTo(enemy.x + enemy.size, enemy.y + enemy.size);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0; // Reset schaduw
    });

    // --- Teken Portaal (Glowy Vortex) ---
    ctx.fillStyle = '#B10DC9'; // Levendig paars
    gameObjects.portals.forEach(portal => {
        const centerX = portal.x + portal.size / 2;
        const centerY = portal.y + portal.size / 2;
        
        // Gloed effect (groter en meer diffuus)
        const gradient = ctx.createRadialGradient(centerX, centerY, portal.size * 0.2, centerX, centerY, portal.size * 0.5);
        gradient.addColorStop(0, 'rgba(177, 13, 201, 1)'); // Kern van de gloed
        gradient.addColorStop(0.7, 'rgba(177, 13, 201, 0.5)'); // Overgang van de gloed
        gradient.addColorStop(1, 'rgba(177, 13, 201, 0)'); // Rand van de gloed, transparant
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, portal.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // De daadwerkelijke portaal (donkerder en kleiner)
        ctx.fillStyle = '#7F0A99'; // Donkerder paars voor de kern
        ctx.beginPath();
        ctx.arc(centerX, centerY, portal.size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Een lichte ring om het portaal te accentueren
        ctx.strokeStyle = '#E0B0FF'; // Licht paars voor de rand
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, portal.size * 0.4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset schaduw na het tekenen van het portaal
    });
}

// --- 13. LEADERBOARD FUNCTIES ---

const getLeaderboard = () => {
    const data = localStorage.getItem('aevum_spectra_leaderboard');
    return data ? JSON.parse(data) : [];
};

function requestPlayerNameForLeaderboard() {
    currentState = GAME_STATE.DIALOG;
    cancelAnimationFrame(gameLoopId); // Zorg dat de game loop stopt

    let overlay = document.getElementById('name-input-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'name-input-overlay';
        overlay.classList.add('dialog-overlay');
        document.body.appendChild(overlay);
    }

    const lang = getCurrentLanguage();
    overlay.innerHTML = `
        <div class="dialog-content">
            <h2 class="dialog-title">${lang.enterName}</h2>
            <input type="text" id="player-name-input" placeholder="${lang.anonymous}" maxlength="20" class="name-input-field">
            <button id="save-name-btn" class="main-button">${lang.close}</button>
        </div>
    `;

    const playerNameInput = document.getElementById('player-name-input');
    const saveNameBtn = document.getElementById('save-name-btn');

    playerNameInput.focus(); // Focus op het input veld

    saveNameBtn.onclick = () => {
        let name = playerNameInput.value.trim();
        if (name === '') {
            name = lang.anonymous;
        }
        
        saveScoreToLeaderboardInternal(name, score); // Sla score op
        
        overlay.remove(); // Verwijder de overlay
        showLeaderboard(); // Toon het leaderboard
        // Hier hoeft canvas.focus() niet, omdat de volgende staat (leaderboard) ook een overlay is.
    };

    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveNameBtn.click(); // Trigger de klik op de save knop bij Enter
        }
    });
}

function saveScoreToLeaderboardInternal(name, scoreToSave) {
    let leaderboard = getLeaderboard();
    leaderboard.push({ name, score: scoreToSave, date: new Date().toLocaleString() });
    leaderboard = leaderboard.sort((a, b) => b.score - a.score).slice(0, 5); // Houd top 5 bij
    localStorage.setItem('aevum_spectra_leaderboard', JSON.stringify(leaderboard));
}

function showLeaderboard() {
    currentState = GAME_STATE.DIALOG;
    cancelAnimationFrame(gameLoopId); // Zorg dat de game loop stopt

    let overlay = document.getElementById('leaderboard-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'leaderboard-overlay';
        overlay.classList.add('dialog-overlay');
        document.body.appendChild(overlay);
    }

    const lang = getCurrentLanguage();
    const leaderboard = getLeaderboard();

    let html = `<h2 class="dialog-title">${lang.leaderboardTitle}</h2><ol class="leaderboard-list">`;
    if (leaderboard.length === 0) {
        html += `<li class="leaderboard-empty">${lang.noScoresYet}</li>`;
    } else {
        leaderboard.forEach((entry) => {
            html += `<li><strong>${entry.score}</strong> – <span class="leaderboard-name">${entry.name}</span> <span class="leaderboard-date">${entry.date}</span></li>`;
        });
    }
    html += `</ol><button id="close-leaderboard-btn" class="main-button">${lang.close}</button>`;

    overlay.innerHTML = `<div class="dialog-content">${html}</div>`;

    document.getElementById('close-leaderboard-btn').onclick = () => {
        overlay.remove(); // Verwijder de overlay
        currentState = GAME_STATE.MENU; // Ga terug naar het menu
        // Start de game loop niet direct, anders begint hij opnieuw.
        // Hij wordt pas gestart als op 'Start spel' wordt geklikt in de storyline.
    };
}


// --- 14. INITIALISATIE EN EVENT LISTENERS ---

window.onload = function() {
    // Creëer de Craft knop dynamisch en voeg toe aan de HUD
    craftButton = document.createElement('button');
    craftButton.id = 'craft-btn';
    craftButton.onclick = tryCraft; // Koppel de functie aan de knop
    // Zoek de juiste positie in de HUD, bijvoorbeeld voor de versie div
    const versieDiv = document.getElementById('versie');
    if (versieDiv && hudElement) {
        hudElement.insertBefore(craftButton, versieDiv);
    } else if (hudElement) {
        hudElement.appendChild(craftButton); // Fallback als versie div niet gevonden
    }

    // Event listener voor de taal selector (nu op de parent div)
    document.getElementById('language-selector').addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN' && e.target.dataset.lang) {
            setLanguage(e.target.dataset.lang);
        }
    });

    // Event listener voor de Start Game knop in de hardcoded storyline
    if (storylineStartButton) {
        storylineStartButton.onclick = startGame;
    }

    setLanguage('nl'); // Stel de initiële taal in

    // De HUD wordt al geüpdatet via setLanguage.
    // updateHUD();
    // updateGeneralUIText(); // Wordt ook al via setLanguage aangeroepen
};