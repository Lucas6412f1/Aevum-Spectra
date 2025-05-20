// main.js - Aevum Spectra Game Logic (Modernized for 2025!)

// --- 1. GLOBALE CONSTANTEN EN VARIABELEN ---

// Game Informatie
const GAME_TITLE = 'Aevum Spectra';
const GAME_VERSION = '0.2.0B';
const GAME_VERSION_SUFFIX = 'Early Alpha';

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
        craftItemName: { nl: 'Tijdkristal', en: 'Time Crystal' }, // Voeg hier de specifieke item naam toe
        crafted: false,
        enemiesCount: 3 // Aantal vijanden voor dit tijdperk
    },
    {
        id: 1,
        name: { nl: 'Toekomst', en: 'Future' },
        quest: { nl: 'Craft een Energiecel en bereik het portaal!', en: 'Craft an Energy Cell and reach the portal!' },
        requiredCrystals: 7,
        craftItemName: { nl: 'Energiecel', en: 'Energy Cell' }, // Specifieke item naam
        crafted: false,
        enemiesCount: 5
    }
    // Voeg hier meer tijdperken toe indien nodig
];
let selectedEra = 0; // Index van het momenteel geselecteerde/actieve tijdperk

// Multi-language support
const translations = {
    nl: {
        welcome: "Welkom bij Aevum Spectra!",
        score: "Score",
        level: "Tijdperk",
        quest: "Opdracht",
        progress: "Voortgang",
        version: "Versie",
        startGame: "Start spel",
        versionSuffix: "Vroege Alpha",
        questComplete: "Opdracht voltooid!",
        levelComplete: "Tijdperk voltooid! Op naar het volgende avontuur!",
        crafted: "Gecraft!",
        craftItem: "Craft item",
        notEnoughCrystals: "Niet genoeg kristallen om te craften!",
        itemCrafted: (itemName) => `Je hebt de ${itemName} gecraft!`, // Dynamische melding
        hitMessage: (crystalsLost, hits, maxHits) => `Je bent geraakt! ${crystalsLost} kristallen verloren. (${hits}/${maxHits} hits)`,
        gameOverMessage: "Game Over! Je bent te vaak geraakt. Tijdperk wordt gereset.",
        gameFinished: "Gefeliciteerd! Je hebt alle tijdperken voltooid!",
        enterName: "Voer je naam in voor het leaderboard:",
        anonymous: "Anoniem", // Voor als naam leeg blijft
        noScoresYet: "Nog geen scores",
        close: "Sluiten",
        leaderboardTitle: "Leaderboard",
        timemachineTitle: "🕰️ Tijdmachine",
        levelReady: "Tijdperk klaar!",
        startEraBtn: "Start Tijdperk",
        story: {
            title: "Aevum Spectra",
            intro: "In het jaar 2150 ontdek jij, een briljante uitvinder en avonturier, een mysterieuze tijdmachine die verborgen ligt onder de ruïnes van een oude stad. Deze technologie stelt je in staat om door verschillende tijdperken te reizen — van oorlogstijdperken in het verleden tot dystopische toekomstscenario's.",
            conflict: "Maar de tijdlijn is ernstig verstoord. Oorlogen dreigen uit te breken die de toekomst kunnen vernietigen. Duistere krachten manipuleren gebeurtenissen om chaos te zaaien en macht te grijpen.",
            mission: "Jouw missie is helder: stop oorlogen voordat ze beginnen, voorkom rampen en red onschuldige mensen. Elk succes brengt de wereld een stukje dichter bij vrede en een betere toekomst.",
            gameplay: "Met je slimme uitvindingen en moedige acties moet je puzzels oplossen, vijanden slim te slim af zijn en belangrijke keuzes maken die de loop van de geschiedenis veranderen. Alleen jij kunt het tij keren en een betere wereld creëren — één tijdperk tegelijk."
        }
    },
    en: {
        welcome: "Welcome to Aevum Spectra!",
        score: "Score",
        level: "Era",
        quest: "Quest",
        progress: "Progress",
        version: "Version",
        startGame: "Start game",
        versionSuffix: "Early Alpha",
        questComplete: "Quest complete!",
        levelComplete: "Era complete! On to the next adventure!",
        crafted: "Crafted!",
        craftItem: "Craft item",
        notEnoughCrystals: "Not enough crystals to craft!",
        itemCrafted: (itemName) => `You crafted the ${itemName}!`,
        hitMessage: (crystalsLost, hits, maxHits) => `You were hit! Lost ${crystalsLost} crystals. (${hits}/${maxHits} hits)`,
        gameOverMessage: "Game Over! You were hit too many times. Era is being reset.",
        gameFinished: "Congratulations! You have completed all eras!",
        enterName: "Enter your name for the leaderboard:",
        anonymous: "Anonymous",
        noScoresYet: "No scores yet",
        close: "Close",
        leaderboardTitle: "Leaderboard",
        timemachineTitle: "🕰️ Time Machine",
        levelReady: "Era ready!",
        startEraBtn: "Start Era",
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
const storylineContentElement = document.getElementById('storyline-content');
const hudElement = document.getElementById('hud');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const questElement = document.getElementById('opdracht'); // 'opdracht' is de ID in je HTML
const progressElement = document.getElementById('voortgang'); // 'voortgang' is de ID in je HTML
const versionElement = document.getElementById('versie');
const meldingElement = document.getElementById('melding');
const craftButton = document.getElementById('craft-btn'); // Zorg dat deze bestaat in index.html, of wordt gemaakt door JS

// --- 6. INITIALISATIE CANVAS ---
canvas.width = 800;
canvas.height = 600;

// --- 7. INPUT HANDLING ---
const keys = {}; // Houdt ingedrukte toetsen bij
document.addEventListener('keydown', e => {
    if (currentState === GAME_STATE.PLAYING) { // Alleen input verwerken in PLAYING state
        keys[e.key.toLowerCase()] = true; // Gebruik .toLowerCase() voor consistentie (e.g., 'W' en 'w')
    }
});
document.addEventListener('keyup', e => {
    if (currentState === GAME_STATE.PLAYING) { // Alleen input verwerken in PLAYING state
        keys[e.key.toLowerCase()] = false;
    }
});

// Zorg dat het canvas de focus heeft voor key events, vooral na klikken op UI
canvas.addEventListener('click', () => {
    canvas.focus();
});

// --- 8. HELPER FUNCTIES ---

/** Haalt het huidige taalobject op. */
const getCurrentLanguage = () => translations[currentLanguage] || translations['nl'];

/**
 * Toont een tijdelijke melding op het scherm.
 * @param {string} message - Het te tonen bericht.
 * @param {boolean} isCritical - Indien true, blijft de melding staan en is rood. Anders verdwijnt het na 3 sec.
 */
function displayMessage(message, isCritical = false) {
    if (!meldingElement) return; // Voorkom errors als element niet bestaat

    meldingElement.textContent = message;
    meldingElement.style.color = isCritical ? '#FF4136' : '#FFDC00'; // Rood of geel
    meldingElement.style.display = 'block'; // Zorg dat het zichtbaar is

    if (!isCritical) {
        // Alleen voor niet-kritieke meldingen: verberg na een timeout
        setTimeout(() => {
            meldingElement.textContent = '';
            meldingElement.style.display = 'none';
        }, 3000); // Verdwijnt na 3 seconden
    }
}

/** Reset de speler naar het midden van het canvas. */
function resetPlayer() {
    gameObjects.player.x = canvas.width / 2 - gameObjects.player.size / 2;
    gameObjects.player.y = canvas.height / 2 - gameObjects.player.size / 2;
}

/**
 * Controleert op botsing tussen twee rechthoekige objecten.
 * @param {object} obj1 - Eerste object met x, y, size.
 * @param {object} obj2 - Tweede object met x, y, size.
 * @returns {boolean} True als er een botsing is, anders false.
 */
const checkCollision = (obj1, obj2) => {
    return obj1.x < obj2.x + obj2.size &&
           obj1.x + obj1.size > obj2.x &&
           obj1.y < obj2.y + obj2.size &&
           obj1.y + obj1.size > obj2.y;
};

// --- 9. GAME LOGICA FUNCTIES ---

/** Update spelerpositie op basis van toetsenbordinvoer. */
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

    // Zorg ervoor dat de speler binnen de canvasgrenzen blijft
    gameObjects.player.x = Math.max(0, Math.min(canvas.width - gameObjects.player.size, gameObjects.player.x));
    gameObjects.player.y = Math.max(0, Math.min(canvas.height - gameObjects.player.size, gameObjects.player.y));
}

/** Update de positie van alle vijanden en controleer op botsingen met de speler. */
function updateEnemies() {
    gameObjects.enemies.forEach(enemy => {
        // Simpele beweging: vijanden bewegen richting de speler
        const player = gameObjects.player;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            enemy.x += (dx / distance) * ENEMY_SPEED;
            enemy.y += (dy / distance) * ENEMY_SPEED;
        }

        // Check op botsing met de speler
        if (checkCollision(player, enemy)) {
            handleEnemyCollision();
        }
    });
}

/** Behandelt de logica wanneer de speler wordt geraakt door een vijand. */
function handleEnemyCollision() {
    // Voorkom dubbele hits als de game al in een dialog/pauze staat
    if (currentState !== GAME_STATE.PLAYING) {
        return;
    }

    const lang = getCurrentLanguage();
    const crystalsToLose = Math.floor(Math.random() * 3) + 1; // Genereert een getal tussen 1 en 3
    questProgress -= crystalsToLose;

    if (questProgress < 0) {
        questProgress = 0;
    }

    hitsTaken++;

    // Speler op een willekeurige plek spawnen binnen canvas grenzen
    gameObjects.player.x = Math.random() * (canvas.width - gameObjects.player.size);
    gameObjects.player.y = Math.random() * (canvas.height - gameObjects.player.size);

    displayMessage(lang.hitMessage(crystalsToLose, hitsTaken, MAX_HITS_ALLOWED), true);
    updateHUD(); // Update HUD om kristallen en hits te tonen

    // Controleer op Game Over (tijdperk reset)
    if (hitsTaken >= MAX_HITS_ALLOWED) {
        currentState = GAME_STATE.DIALOG; // Pauzeer de game voor de "Game Over" melding
        displayMessage(lang.gameOverMessage, true);

        setTimeout(() => {
            resetEra(); // Reset het huidige tijdperk
            currentState = GAME_STATE.PLAYING; // Hervat de game
            displayMessage('', false); // Leeg de melding
            updateHUD(); // Update HUD met geresette waarden
        }, 3000); // Wacht 3 seconden voor de reset
    } else {
        // Als het geen game over is, hervat de game na een korte pauze
        setTimeout(() => {
            currentState = GAME_STATE.PLAYING;
            displayMessage('', false); // Leeg de melding
        }, 1500); // Wacht 1.5 seconden voordat de game verder gaat
    }
}

/** Reset alle relevante variabelen en game objecten voor het begin van een tijdperk. */
function resetEra() {
    hitsTaken = 0;
    questProgress = 0;
    score = 0; // Score resetten per tijdperk, kan aangepast worden indien gewenst

    // Reset de 'crafted' status voor het huidige tijdperk, indien nodig
    //eras[selectedEra].crafted = false; // Alleen resetten als je wilt dat je het item opnieuw moet craften na een Game Over
                                    // Anders blijft deze true als je al gecraft had.
                                    // Ik laat hem nu even staan, je kunt besluiten hem te uncommenten.

    initializeLevel(); // Roep initializeLevel() opnieuw aan om objecten te spawnen
    resetPlayer(); // Plaats de speler terug in het midden
}

/** Initialiseert het level met kristallen, vijanden en portaal. */
function initializeLevel() {
    gameObjects.crystals = [];
    gameObjects.enemies = [];
    gameObjects.portals = [];

    // Voeg initiële kristallen toe
    for (let i = 0; i < 3; i++) { // Begin met 3 kristallen
        spawnCrystal();
    }

    // Voeg vijanden toe op basis van het huidige tijdperk
    const era = eras[selectedEra];
    for (let i = 0; i < era.enemiesCount; i++) { // Gebruik enemiesCount uit de era data
        spawnEnemy();
    }

    // Voeg het portaal toe
    gameObjects.portals.push({
        x: canvas.width * 0.8 - TILE_SIZE / 2, // Center portaal
        y: canvas.height * 0.8 - TILE_SIZE / 2,
        size: TILE_SIZE * 1.5 // Portaal iets groter
    });
}

/** Spawnt een kristal op een willekeurige locatie binnen het canvas. */
function spawnCrystal() {
    const margin = 50; // Marge zodat kristallen niet helemaal aan de rand spawnen
    gameObjects.crystals.push({
        x: margin + Math.random() * (canvas.width - margin * 2),
        y: margin + Math.random() * (canvas.height - margin * 2),
        size: TILE_SIZE / 2, // Kristallen zijn kleiner dan speler/vijand
        collected: false
    });
}

/** Spawnt een vijand op een willekeurige locatie binnen het canvas. */
function spawnEnemy() {
    const margin = 50;
    gameObjects.enemies.push({
        x: margin + Math.random() * (canvas.width - margin * 2),
        y: margin + Math.random() * (canvas.height - margin * 2),
        size: TILE_SIZE,
        speed: ENEMY_SPEED
    });
}

/** Behandelt de crafting logica. */
function tryCraft() {
    const lang = getCurrentLanguage();
    const era = eras[selectedEra];

    if (!era.crafted && questProgress >= era.requiredCrystals) {
        era.crafted = true;
        score += 25; // Bonuspunten voor craften
        displayMessage(lang.itemCrafted(era.craftItemName[currentLanguage])); // Gebruik dynamische melding
        updateHUD();
        // Zorg ervoor dat het canvas de focus houdt na interactie met de knop
        canvas.focus();
    } else {
        displayMessage(lang.notEnoughCrystals, false); // Niet kritieke melding
        canvas.focus();
    }
}

// --- 10. UI UPDATERS ---

/** Update alle algemene UI-teksten (titel, verhaal, startknop etc.) op basis van de taal. */
function updateGeneralUIText() {
    const lang = getCurrentLanguage();

    if (gameTitleElement) {
        gameTitleElement.textContent = lang.story.title;
    }

    if (storylineContentElement && currentState === GAME_STATE.MENU) {
        storylineContentElement.innerHTML = `
            <h1><strong>${lang.story.title}</strong></h1>
            <p>${lang.story.intro}</p>
            <p>${lang.story.conflict}</p>
            <p>${lang.story.mission}</p>
            <p>${lang.story.gameplay}</p>
            <button class="start-game-btn" onclick="startGame()">${lang.startGame}</button>
        `;
    }
}

/** Update de Head-Up Display (HUD) met de nieuwste spelstatistieken. */
function updateHUD() {
    const lang = getCurrentLanguage();
    const era = eras[selectedEra];

    if (scoreElement) scoreElement.textContent = `${lang.score}: ${score}`;
    if (levelElement) levelElement.textContent = `${lang.level}: ${era.name[currentLanguage]}`;
    if (questElement) questElement.textContent = `${lang.quest}: ${era.quest[currentLanguage]}`;
    if (progressElement) progressElement.textContent = `${lang.progress}: ${questProgress}/${era.requiredCrystals}`;
    if (versionElement) versionElement.textContent = `${lang.version}: ${GAME_VERSION} ${lang.versionSuffix}`;

    // Crafting knop logica in de HUD
    if (craftButton) { // Controleer of de knop bestaat
        craftButton.textContent = era.crafted ? lang.crafted : lang.craftItem;
        craftButton.disabled = era.crafted || questProgress < era.requiredCrystals;
    }
}

/** Toont de tijdmachine UI en vult deze met taal-specifieke inhoud. */
function showTimeMachine() {
    currentState = GAME_STATE.DIALOG; // Pauzeer game
    cancelAnimationFrame(gameLoopId); // Stop de game loop terwijl de UI open is

    let overlay = document.getElementById('timemachine-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'timemachine-overlay';
        overlay.classList.add('dialog-overlay'); // Voeg een algemene CSS class toe voor styling
        document.body.appendChild(overlay);
    }

    // HTML voor de overlay, dynamisch opgebouwd per taal/tijdperk
    const lang = getCurrentLanguage();
    overlay.innerHTML = `
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
    `;

    // Event listeners toevoegen voor tijdperkselectie
    document.querySelectorAll('#era-select .era-button').forEach(btn => {
        btn.onclick = () => {
            selectedEra = parseInt(btn.getAttribute('data-era'));
            document.getElementById('era-quest-display').textContent = eras[selectedEra].quest[currentLanguage];
            // Visuele feedback voor selectie (optioneel, via CSS)
            document.querySelectorAll('.era-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
    });

    // Event listener voor de 'Start Tijdperk' knop
    document.getElementById('start-era-btn').onclick = () => {
        overlay.remove(); // Verwijder de overlay
        startEra(selectedEra); // Start het geselecteerde tijdperk
        canvas.focus(); // Zorg dat canvas weer focus heeft
    };

    // Initialiseer de quest tekst voor het geselecteerde tijdperk
    document.getElementById('era-quest-display').textContent = eras[selectedEra].quest[currentLanguage];
    // Selecteer de actieve knop
    document.querySelector(`.era-button[data-era="${selectedEra}"]`).classList.add('selected');
}

/** Update de tekst van de Time Machine UI wanneer de taal wisselt. */
function updateTimeMachineUIText() {
    const timemachineOverlay = document.getElementById('timemachine-overlay');
    if (timemachineOverlay && currentState === GAME_STATE.DIALOG) { // Alleen als overlay zichtbaar is
        const lang = getCurrentLanguage();

        timemachineOverlay.querySelector('h2').textContent = lang.timemachineTitle;

        document.querySelectorAll('#era-select .era-button').forEach(btn => {
            const eraId = parseInt(btn.getAttribute('data-era'));
            btn.textContent = eras[eraId].name[currentLanguage]; // Update tijdperk naam
            // Update "Level klaar!" label
            const statusLabel = btn.nextElementSibling;
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
    let label = document.createElement('div');
    label.textContent = getCurrentLanguage().levelReady; // Gebruik taalspecifieke tekst
    label.classList.add('level-completed-label'); // CSS voor animatie en stijl
    document.body.appendChild(label);
    setTimeout(() => label.remove(), 1000); // Verdwijnt na 1 seconde
}

/**
 * Functie om de taal van de game te wisselen.
 * @param {string} lang - De te zetten taal ('nl' of 'en').
 */
function setLanguage(lang) {
    if (!translations[lang]) {
        console.warn(`Language ${lang} not found, falling back to English`);
        lang = 'en';
    }
    currentLanguage = lang;

    // Update alle UI-elementen
    updateGeneralUIText(); // Update verhaal en menu teksten
    updateHUD();            // Update HUD teksten
    updateTimeMachineUIText(); // Update Time Machine teksten (als open)

    // Update taalwisselaar UI (actieve vlag)
    document.querySelectorAll('#language-selector span').forEach(span => {
        span.classList.toggle('active', span.getAttribute('data-lang') === lang);
    });
}

// --- 11. GAME STATE MANAGEMENT FUNCTIES ---

/** Start de game vanuit het menu/verhaal. */
function startGame() {
    if (storylineElement) storylineElement.style.display = 'none'; // Verberg verhaal/menu
    currentState = GAME_STATE.PLAYING;
    startEra(selectedEra); // Start het geselecteerde tijdperk (standaard 0)
    canvas.focus(); // Zorg dat canvas de focus krijgt voor input
}

/** Start een specifiek tijdperk. */
function startEra(eraId) {
    selectedEra = eraId; // Zorg dat het geselecteerde tijdperk de actieve is
    const era = eras[selectedEra];

    questProgress = 0; // Reset quest voortgang
    hitsTaken = 0;      // Reset hits
    score = 0;          // Score resetten voor een nieuw tijdperk
    // era.crafted = false; // Niet per se resetten als je al gecraft had en opnieuw begint

    initializeLevel(); // Initialiseer game objecten voor dit tijdperk
    resetPlayer();      // Speler in het midden plaatsen
    updateHUD();        // Update HUD met de nieuwe tijdperk info
    
    // Alleen starten als de game loop nog niet draait (of na een reset)
    if (!gameLoopId) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

// --- 12. GAME LOOP EN RENDERING ---

/** De hoofdgame-loop die constant wordt aangeroepen. */
function gameLoop() {
    if (currentState === GAME_STATE.PLAYING) {
        updatePlayer();
        updateEnemies();
        
        // Spawn kristallen (kans per frame)
        if (gameObjects.crystals.filter(c => !c.collected).length < MAX_CRYSTALS_ON_SCREEN && Math.random() < CRYSTAL_SPAWN_RATE) {
            spawnCrystal();
        }

        // Kristallen verzamelen
        gameObjects.crystals.forEach(crystal => {
            if (!crystal.collected && checkCollision(gameObjects.player, crystal)) {
                crystal.collected = true;
                questProgress++;
                score += 10;
                updateHUD();
                // Speel geluid af of toon effect
                if (questProgress >= eras[selectedEra].requiredCrystals) {
                    displayMessage(getCurrentLanguage().questComplete, false);
                }
            }
        });

        // Portaal bereiken (alleen als gecraft is)
        const currentEra = eras[selectedEra];
        if (currentEra.crafted && gameObjects.portals.length > 0) { // Controleer of er een portaal is
            const portal = gameObjects.portals[0]; // Ga uit van 1 portaal per level
            if (checkCollision(gameObjects.player, portal)) {
                showCompletedLabel(); // Toon "Level klaar!" label
                currentState = GAME_STATE.LEVEL_COMPLETE; // Zet state om verder spel te pauzeren
                cancelAnimationFrame(gameLoopId); // Stop de game loop

                setTimeout(() => {
                    if (selectedEra < eras.length - 1) {
                        // Ga naar volgend tijdperk
                        selectedEra++; // Selecteer de volgende era
                        showTimeMachine(); // Open de tijdmachine om volgende tijdperk te starten
                    } else {
                        // Game uitgespeeld
                        displayMessage(getCurrentLanguage().gameFinished, true);
                        requestPlayerNameForLeaderboard(); // NIEUWE AANROEP HIER!
                        // showLeaderboard() wordt nu aangeroepen NA naam invoer
                        currentState = GAME_STATE.GAME_FINISHED; // Eindstatus
                    }
                }, 1200); // Wacht even voordat de UI opent
            }
        }
    }

    // --- TEKENEN OP CANVAS ---
    drawGame();

    // Vraag om het volgende frame, ongeacht de state (voor UI updates)
    gameLoopId = requestAnimationFrame(gameLoop);
}

/** Tekent alle game-objecten op het canvas. */
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Wis het canvas

    // Teken speler (blauw vierkant)
    ctx.fillStyle = '#0074D9'; // Modern blauw
    ctx.fillRect(gameObjects.player.x, gameObjects.player.y, gameObjects.player.size, gameObjects.player.size);

    // Teken kristallen (geel cirkel)
    ctx.fillStyle = '#FFDC00'; // Helder geel
    gameObjects.crystals.forEach(crystal => {
        if (!crystal.collected) {
            ctx.beginPath();
            ctx.arc(crystal.x + crystal.size / 2, crystal.y + crystal.size / 2, crystal.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Teken vijanden (rood driehoek, modern)
    ctx.fillStyle = '#FF4136'; // Fel rood
    gameObjects.enemies.forEach(enemy => {
        // Teken een driehoek voor vijanden
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.size / 2, enemy.y);
        ctx.lineTo(enemy.x + enemy.size, enemy.y + enemy.size);
        ctx.lineTo(enemy.x, enemy.y + enemy.size);
        ctx.closePath();
        ctx.fill();
    });

    // Teken portaal (paars, met gloed)
    ctx.fillStyle = '#B10DC9'; // Levendig paars
    gameObjects.portals.forEach(portal => {
        // Een simpele gloed
        const gradient = ctx.createRadialGradient(
            portal.x + portal.size / 2, portal.y + portal.size / 2, portal.size / 4,
            portal.x + portal.size / 2, portal.y + portal.size / 2, portal.size / 2
        );
        gradient.addColorStop(0, 'rgba(177, 13, 201, 1)'); // Kern
        gradient.addColorStop(1, 'rgba(177, 13, 201, 0)'); // Rand, transparant
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(portal.x + portal.size / 2, portal.y + portal.size / 2, portal.size / 2, 0, Math.PI * 2);
        ctx.fill();
        // De daadwerkelijke portaal
        ctx.fillStyle = '#B10DC9';
        ctx.beginPath();
        ctx.arc(portal.x + portal.size / 2, portal.y + portal.size / 2, portal.size / 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Teken ook de melding als deze actief is (zorgt dat het boven alles ligt)
    // De melding wordt beheerd door de displayMessage functie
}

// --- 13. LEADERBOARD FUNCTIES ---

/** Haalt leaderboard data op uit localStorage. */
const getLeaderboard = () => {
    const data = localStorage.getItem('aevum_spectra_leaderboard');
    return data ? JSON.parse(data) : [];
};

/**
 * Toont een inputveld om de naam van de speler op te vragen voor het leaderboard.
 * Dit is een niet-blokkerende UI in plaats van een prompt().
 */
function requestPlayerNameForLeaderboard() {
    currentState = GAME_STATE.DIALOG; // Zet de game in dialoog-modus
    cancelAnimationFrame(gameLoopId); // Pauzeer de game loop

    let overlay = document.getElementById('name-input-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'name-input-overlay';
        overlay.classList.add('dialog-overlay'); // Algemene CSS class voor styling
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

    playerNameInput.focus(); // Focus op het inputveld

    saveNameBtn.onclick = () => {
        let name = playerNameInput.value.trim();
        if (name === '') {
            name = lang.anonymous;
        }
        
        // Sla de score op met de ingevoerde naam
        // We moeten score hier als argument meegeven, want het is geen globale variabele in deze functie scope
        saveScoreToLeaderboardInternal(name, score); // Roep de interne opslag functie aan
        
        overlay.remove(); // Verwijder de overlay
        showLeaderboard(); // Toon direct het leaderboard na het opslaan
        // currentState wordt gezet door showLeaderboard
        // gameLoopId wordt beheerd door showLeaderboard (die stopt hem, en de close knop van LB start hem weer, als nodig)
        canvas.focus(); // Zorg dat canvas weer focus heeft
    };

    // Event listener voor Enter key in het inputveld
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveNameBtn.click(); // Trigger de klik op de opslaan knop
        }
    });
}

/**
 * Interne functie om de score daadwerkelijk op te slaan naar localStorage.
 * Deze functie wordt aangeroepen door requestPlayerNameForLeaderboard().
 * @param {string} name - De naam van de speler.
 * @param {number} scoreToSave - De score die opgeslagen moet worden.
 */
function saveScoreToLeaderboardInternal(name, scoreToSave) {
    let leaderboard = getLeaderboard();
    leaderboard.push({ name, score: scoreToSave, date: new Date().toLocaleString() });
    leaderboard = leaderboard.sort((a, b) => b.score - a.score).slice(0, 5); // Top 5
    localStorage.setItem('aevum_spectra_leaderboard', JSON.stringify(leaderboard));
}

/** Toont het leaderboard in een overlay. */
function showLeaderboard() {
    currentState = GAME_STATE.DIALOG; // Pauzeer game (visueel)
    cancelAnimationFrame(gameLoopId); // Stop de game loop

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
        overlay.remove();
        currentState = GAME_STATE.MENU; // Ga terug naar het hoofdmenu na sluiten leaderboard
        // Herstart de game loop alleen als je wilt dat de speler door kan gaan na leaderboard
        // Anders, als GAME_FINISHED, blijft hij op MENU/FINISHED staan
        gameLoopId = requestAnimationFrame(gameLoop); // Herstart voor de zekerheid
    };
}


// --- 14. INITIALISATIE EN EVENT LISTENERS ---

// Zorg ervoor dat deze code pas draait als de DOM volledig geladen is
window.onload = function() {
    // Initialiseer taalkiezer
    document.getElementById('language-selector').addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN' && e.target.dataset.lang) {
            setLanguage(e.target.dataset.lang);
        }
    });

    // Default taal instellen bij laden
    setLanguage('nl'); // Start met Nederlands

    // Koppel de craft knop (als deze bestaat)
    if (craftButton) {
        craftButton.onclick = tryCraft;
    }

    // Initialiseer de HUD en verhaal
    updateHUD();
    updateGeneralUIText(); // Toont het startscherm / verhaal

    // Start de game loop
    // gameLoopId = requestAnimationFrame(gameLoop); // Deze wordt nu gestart door startGame() of startEra()
};