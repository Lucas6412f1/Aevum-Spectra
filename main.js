// main.js - Aevum Spectra Game Logic (Modernized for 2025!)

// Belangrijk: Zorg ervoor dat 'supportLogic.js' in dezelfde map staat
import { initializeButton } from './supportLogic.js'; // Let op de .js extensie!

// --- 1. GLOBALE CONSTANTEN EN VARIABELEN ---

// Game Informatie
const GAME_TITLE = 'Aevum Spectra';
const GAME_VERSION = '0.5';
const GAME_VERSION_SUFFIX = 'Alpha';

// Game States
const GAME_STATE = {
    MENU: 'menu',           // Startscherm / Verhaal intro
    PLAYING: 'playing',     // Actieve gameplay
    DIALOG: 'dialog',       // Popup actief (Time Machine, Leaderboard, Game Over melding, Naam invoer)
    LEVEL_COMPLETE: 'level_complete', // Tijdperk voltooid (voordat Time Machine opent)
    GAME_FINISHED: 'game_finished' // Spel helemaal uitgespeeld
};

// Game Instellingen & Balans
const TILE_SIZE = 32;
const PLAYER_SPEED = 4;
const ENEMY_SPEED = 2;
const CRYSTAL_SPAWN_RATE = 0.02;
const MAX_CRYSTALS_ON_SCREEN = 8;
const MAX_HITS_ALLOWED = 5;

// --- 2. GAME STATE VARIABELEN ---
let currentState = GAME_STATE.MENU;
let score = 0;
let questProgress = 0;
let hitsTaken = 0;
let gameLoopId;
let currentLanguage = 'nl';
let activePowerUp = null; // Power-up staat
let powerUpTimer = null; // Timer voor power-ups

// --- 3. GAME OBJECTS ---
const gameObjects = {
    player: {
        x: 0,
        y: 0,
        size: TILE_SIZE,
        speed: PLAYER_SPEED,
        frame: 0
    },
    crystals: [],
    enemies: [],
    portals: [],
    powerUps: []
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
        welcome: "Welkom bij Aevum Spectra!",
        score: "Score",
        level: "Tijdperk",
        quest: "Opdracht",
        progress: "Voortgang",
        version: "Versie",
        versionSuffix: "Alpha",
        startGame: "Start spel",
        questComplete: "Opdracht voltooid!",
        levelComplete: "Tijdperk voltooid!",
        crafted: "Gecraft!",
        craftItem: "Craft item",
        notEnoughCrystals: "Niet genoeg kristallen om te craften!",
        gameOverMessage: "Game Over! Je bent te vaak geraakt.",
        gameFinished: "Gefeliciteerd! Je hebt alle tijdperken voltooid!",
        hitMessage: (crystalsLost, currentHits, maxHits) => `Geraakt! ${crystalsLost} kristallen verloren. Nog ${maxHits - currentHits} hits over.`,
        timemachineTitle: "Tijdmachine",
        levelReady: "Klaar",
        startEraBtn: "Start Tijdperk",
        enterName: "Voer je naam in",
        anonymous: "Anoniem",
        close: "Sluiten",
        leaderboardTitle: "Highscores",
        noScoresYet: "Nog geen scores.",
        activePowerUp: "Actieve Power-Up" // Added translation for active power-up
    },
    en: {
        welcome: "Welcome to Aevum Spectra!",
        score: "Score",
        level: "Era",
        quest: "Quest",
        progress: "Progress",
        version: "Version",
        versionSuffix: "Alpha",
        startGame: "Start game",
        questComplete: "Quest complete!",
        levelComplete: "Era complete!",
        crafted: "Crafted!",
        craftItem: "Craft item",
        notEnoughCrystals: "Not enough crystals to craft!",
        gameOverMessage: "Game Over! You were hit too many times.",
        gameFinished: "Congratulations! You have completed all eras!",
        hitMessage: (crystalsLost, currentHits, maxHits) => `Hit! Lost ${crystalsLost} crystals. ${maxHits - currentHits} hits left.`,
        timemachineTitle: "Time Machine",
        levelReady: "Ready",
        startEraBtn: "Start Era",
        enterName: "Enter your name",
        anonymous: "Anonymous",
        close: "Close",
        leaderboardTitle: "Leaderboard",
        noScoresYet: "No scores yet.",
        activePowerUp: "Active Power-Up" // Added translation for active power-up
    }
};

// Referenties naar DOM-elementen
let canvas, ctx;
let gameContainer, storylineElement, storylineStartButton;
let scoreElement, levelElement, questElement, progressElement, versionElement, meldingElement;
let craftButton;
let languageSelector; // Referentie naar de taal selector

let keys = {};

window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    gameContainer = document.getElementById('game-container');
    storylineElement = document.getElementById('storyline');
    storylineStartButton = document.getElementById('storyline-start-btn');
    languageSelector = document.getElementById('language-selector');

    scoreElement = document.getElementById('score');
    levelElement = document.getElementById('level');
    questElement = document.getElementById('quest');
    progressElement = document.getElementById('progress');
    versionElement = document.getElementById('versie');
    meldingElement = document.getElementById('melding');
    const hudElement = document.getElementById('hud');

    // Creëer de Craft knop dynamisch en voeg toe aan de HUD
    craftButton = document.createElement('button');
    craftButton.id = 'craft-btn';
    craftButton.classList.add('main-button'); // Voeg class toe voor styling
    craftButton.onclick = tryCraft;
    const versieDiv = document.getElementById('versie');
    if (versieDiv && hudElement) {
        hudElement.insertBefore(craftButton, versieDiv);
    } else if (hudElement) {
        hudElement.appendChild(craftButton);
    }

    // Event listener voor de taal selector
    if (languageSelector) {
        languageSelector.addEventListener('click', (e) => {
            if (e.target.tagName === 'SPAN' && e.target.dataset.lang) {
                setLanguage(e.target.dataset.lang);
            }
        });
    }


    // Event listeners voor toetsenbord input
    document.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;
        if (e.key.toLowerCase() === 'c' && currentState === GAME_STATE.PLAYING && craftButton && !craftButton.disabled) {
            tryCraft();
        }
    });
    document.addEventListener('keyup', e => {
        keys[e.key.toLowerCase()] = false;
    });

    // Gebruik de utility functie om de Start Game knop te initialiseren
    initializeButton('storyline-start-btn', startGame);

    // --- BELANGRIJKE INITIALISATIE VAN DE UI ZICHTBAARHEID ---
    // Zorg ervoor dat de game-container verborgen is en de storyline zichtbaar bij start
    if (gameContainer) {
        gameContainer.classList.add('hidden'); // Verberg de game-container initieel
    }
    if (storylineElement) {
        storylineElement.classList.remove('hidden'); // Zorg dat de storyline bij start zichtbaar is
    }

    setLanguage('nl'); // Initialiseer de taal en update UI teksten

    // Controleer of de canvas correct is geïnitialiseerd
    if (!canvas || !ctx) {
        console.error('Canvas of context kon niet worden geïnitialiseerd. Controleer of de canvas correct in de HTML is opgenomen.');
        alert('Er is een probleem met de game rendering. Probeer de pagina opnieuw te laden.');
    } else {
        console.log('Canvas en context succesvol geïnitialiseerd.');
    }
};

/**
 * Toont een tijdelijke melding op het scherm.
 * @param {string} message - Het te tonen bericht.
 * @param {boolean} isCritical - Indien true, blijft de melding staan en is rood. Anders verdwijnt het na 3 sec.
 */
function displayMessage(message, isCritical = false) {
    if (!meldingElement) return;

    meldingElement.textContent = message;
    meldingElement.classList.remove('hidden'); // Maak zichtbaar

    if (isCritical) {
        meldingElement.classList.add('critical-message'); // Rode rand voor kritieke meldingen
        // De animatie wordt afgehandeld door CSS (melding-critical-animation)
    } else {
        meldingElement.classList.remove('critical-message');
        // Gebruik fade-in/out animatie voor niet-kritieke meldingen
        meldingElement.classList.add('fade-in-out');
        const animationEndHandler = () => {
            meldingElement.classList.add('hidden'); // Verberg na animatie
            meldingElement.classList.remove('fade-in-out');
            meldingElement.removeEventListener('animationend', animationEndHandler);
        };
        meldingElement.addEventListener('animationend', animationEndHandler);
    }

    if (isCritical) {
        currentState = GAME_STATE.DIALOG; // Pauzeer game
        setTimeout(() => {
            if (hitsTaken >= MAX_HITS_ALLOWED) {
                resetEra();
            }
            // Na de kritieke melding en eventuele reset, hervat de game
            if (currentState !== GAME_STATE.GAME_FINISHED) { // Voorkom hervatten als game is afgerond
                 currentState = GAME_STATE.PLAYING;
                 gameLoop(); // Hervat de game loop
            }
            meldingElement.classList.add('hidden'); // Verberg kritieke melding na afhandeling
            meldingElement.classList.remove('critical-message');
            updateHUD();
        }, 3000); // Wacht 3 seconden voor afhandeling
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
    let newX = gameObjects.player.x;
    let newY = gameObjects.player.y;

    if (keys['arrowup'] || keys['w']) {
        newY -= gameObjects.player.speed;
    }
    if (keys['arrowdown'] || keys['s']) {
        newY += gameObjects.player.speed;
    }
    if (keys['arrowleft'] || keys['a']) {
        newX -= gameObjects.player.speed;
    }
    if (keys['arrowright'] || keys['d']) {
        newX += gameObjects.player.speed;
    }

    gameObjects.player.x = Math.max(0, Math.min(canvas.width - gameObjects.player.size, newX));
    gameObjects.player.y = Math.max(0, Math.min(canvas.height - gameObjects.player.size, newY));
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

    if (activePowerUp === 'invincibility') {
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
        displayMessage(lang.gameOverMessage, true);
        cancelAnimationFrame(gameLoopId); // Stop de loop onmiddellijk
        gameLoopId = null; // Reset gameLoopId
    } else {
        displayMessage(lang.hitMessage(crystalsToLose, hitsTaken, MAX_HITS_ALLOWED), true);
    }
    updateHUD();
}

function resetEra() {
    hitsTaken = 0;
    questProgress = 0;
    score = 0;

    initializeLevel();
    resetPlayer();
    updateHUD();
}

function initializeLevel() {
    gameObjects.crystals = [];
    gameObjects.enemies = [];
    gameObjects.portals = [];
    gameObjects.powerUps = [];

    for (let i = 0; i < 3; i++) {
        spawnCrystal();
    }

    const era = eras[selectedEra];
    for (let i = 0; i < era.enemiesCount; i++) {
        spawnEnemy();
    }

    gameObjects.portals.push({
        x: canvas.width * 0.8 - TILE_SIZE / 2,
        y: canvas.height * 0.8 - TILE_SIZE / 2,
        size: TILE_SIZE * 1.5
    });
}

function spawnCrystal() {
    const margin = 50;
    gameObjects.crystals.push({
        x: margin + Math.random() * (canvas.width - margin * 2),
        y: margin + Math.random() * (canvas.height - margin * 2),
        size: TILE_SIZE / 2,
        collected: false
    });
}

function spawnEnemy() {
    const margin = 50;
    gameObjects.enemies.push({
        x: margin + Math.random() * (canvas.width - margin * 2),
        y: margin + Math.random() * (canvas.height - margin * 2),
        size: TILE_SIZE,
        speed: ENEMY_SPEED
    });
}

function tryCraft() {
    const currentEra = eras[selectedEra];
    const lang = getCurrentLanguage();

    if (questProgress >= currentEra.requiredCrystals && !currentEra.crafted) {
        currentEra.crafted = true;
        score += 50;
        displayMessage(lang.crafted, false);
        updateHUD();
    } else if (currentEra.crafted) {
        displayMessage(lang.crafted, false);
    } else {
        displayMessage(lang.notEnoughCrystals, true);
    }
}

// --- Power-Up Feature ---
const POWER_UP_TYPES = ['speed', 'invincibility'];

function spawnPowerUp() {
    if (gameObjects.powerUps.length < 2) {
        const margin = 50;
        const powerUp = {
            x: margin + Math.random() * (canvas.width - margin * 2),
            y: margin + Math.random() * (canvas.height - margin * 2),
            size: TILE_SIZE,
            type: POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)]
        };
        gameObjects.powerUps.push(powerUp);
    }
}

function activatePowerUp(type) {
    if (activePowerUp === 'speed') {
        gameObjects.player.speed = PLAYER_SPEED; // Reset snelheid van vorige speed power-up
    }
    clearTimeout(powerUpTimer);

    activePowerUp = type;

    if (type === 'speed') {
        gameObjects.player.speed = PLAYER_SPEED * 2;
    }
    // Geen specifieke actie nodig voor invincibility hier; de collision check handelt het af

    powerUpTimer = setTimeout(() => {
        if (activePowerUp === 'speed') {
            gameObjects.player.speed = PLAYER_SPEED;
        }
        activePowerUp = null;
        updateHUD();
    }, 10000); // Power-Up duurt 10 seconden

    updateHUD(); // Update om de power-up status te tonen
}

function updatePowerUps() {
    gameObjects.powerUps.forEach((powerUp, index) => {
        if (checkCollision(gameObjects.player, powerUp)) {
            activatePowerUp(powerUp.type);
            gameObjects.powerUps.splice(index, 1);
        }
    });
}

// --- 10. UI UPDATERS ---

function updateGeneralUIText() {
    const lang = getCurrentLanguage();

    const gameTitleElement = document.getElementById('game-title');
    if (gameTitleElement) {
        gameTitleElement.textContent = gameTitleElement.getAttribute(`data-${currentLanguage}`);
    }

    const storylineTitleElement = document.getElementById('storyline-title');
    if (storylineTitleElement) {
        storylineTitleElement.innerHTML = storylineTitleElement.getAttribute(`data-${currentLanguage}`);
    }
    document.querySelectorAll('#storyline-content p').forEach(p => {
        p.textContent = p.getAttribute(`data-${currentLanguage}`);
    });

    if (storylineStartButton) {
        storylineStartButton.textContent = storylineStartButton.getAttribute(`data-${currentLanguage}`);
    }
}

function updateHUD() {
    const lang = getCurrentLanguage();
    const era = eras[selectedEra];

    if (scoreElement) scoreElement.textContent = `${lang.score}: ${score}`;
    if (levelElement) levelElement.textContent = `${lang.level}: ${era.name[currentLanguage]}`;
    if (questElement) questElement.textContent = `${lang.quest}: ${era.quest[currentLanguage]}`;
    if (progressElement) progressElement.textContent = `${lang.progress}: ${questProgress}/${era.requiredCrystals}`;
    if (versionElement) versionElement.textContent = `${lang.version}: ${GAME_VERSION} ${lang.versionSuffix}`;

    if (craftButton) {
        craftButton.textContent = era.crafted ? lang.crafted : lang.craftItem;
        craftButton.disabled = era.crafted || questProgress < era.requiredCrystals;
    }

    // Update voor actieve power-ups
    const powerUpElement = document.getElementById('active-power-up');
    if (powerUpElement) {
        if (activePowerUp) {
            powerUpElement.textContent = `${lang.activePowerUp}: ${activePowerUp}`;
            powerUpElement.classList.remove('hidden');
        } else {
            powerUpElement.classList.add('hidden');
        }
    }
}

// Functie om de Time Machine dialoog te tonen
function showTimeMachine() {
    currentState = GAME_STATE.DIALOG;
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;

    let overlay = document.getElementById('timemachine-overlay');
    overlay.classList.remove('hidden'); // Toon de overlay

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

    document.querySelectorAll('#era-select .era-button').forEach(btn => {
        btn.onclick = () => {
            selectedEra = parseInt(btn.getAttribute('data-era'));
            document.getElementById('era-quest-display').textContent = eras[selectedEra].quest[currentLanguage];
            document.querySelectorAll('.era-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
    });

    document.getElementById('start-era-btn').onclick = () => {
        overlay.classList.add('hidden'); // Verberg de overlay
        startEra(selectedEra);
        canvas.focus();
    };

    document.getElementById('era-quest-display').textContent = eras[selectedEra].quest[currentLanguage];
    // Zorg ervoor dat de momenteel geselecteerde era-knop ook visueel geselecteerd is wanneer de Time Machine opent
    const currentEraButton = document.querySelector(`.era-button[data-era="${selectedEra}"]`);
    if (currentEraButton) {
        currentEraButton.classList.add('selected');
    }
}

// Functie om de Time Machine UI-teksten te updaten bij taalwissel
function updateTimeMachineUIText() {
    const timemachineOverlay = document.getElementById('timemachine-overlay');
    if (timemachineOverlay && !timemachineOverlay.classList.contains('hidden')) { // Controleer of de overlay zichtbaar is
        const lang = getCurrentLanguage();

        const titleElement = timemachineOverlay.querySelector('h2');
        if (titleElement) titleElement.textContent = lang.timemachineTitle;

        document.querySelectorAll('#era-select .era-button').forEach(btn => {
            const eraId = parseInt(btn.getAttribute('data-era'));
            btn.textContent = eras[eraId].name[currentLanguage];
            const statusLabel = btn.nextElementSibling;
            if (statusLabel) {
                statusLabel.textContent = lang.levelReady;
            }
        });

        const eraQuestDisplay = document.getElementById('era-quest-display');
        if (eraQuestDisplay) eraQuestDisplay.textContent = eras[selectedEra].quest[currentLanguage];

        const startEraBtn = document.getElementById('start-era-btn');
        if (startEraBtn) startEraBtn.textContent = lang.startEraBtn;
    }
}

/** Toont een kort label dat aangeeft dat een tijdperk voltooid is. */
let levelCompletedLabel;
function showCompletedLabel() {
    if (!levelCompletedLabel) {
        levelCompletedLabel = document.createElement('div');
        levelCompletedLabel.id = 'level-completed-label';
        levelCompletedLabel.classList.add('level-completed-label'); // CSS class voor styling
        document.body.appendChild(levelCompletedLabel);
    }

    levelCompletedLabel.textContent = getCurrentLanguage().levelComplete;
    levelCompletedLabel.classList.remove('hidden'); // Zorg dat het zichtbaar wordt
    levelCompletedLabel.classList.remove('pop-and-fade'); // Reset animatie
    // Trigger reflow om de animatie te resetten
    void levelCompletedLabel.offsetWidth; // Dit forceert een reflow
    levelCompletedLabel.classList.add('pop-and-fade'); // Start animatie

    const animationEndHandler = () => {
        levelCompletedLabel.classList.add('hidden'); // Verberg na animatie
        levelCompletedLabel.classList.remove('pop-and-fade');
        levelCompletedLabel.removeEventListener('animationend', animationEndHandler);
    };
    levelCompletedLabel.addEventListener('animationend', animationEndHandler);
}


function setLanguage(lang) {
    if (!translations[lang]) {
        console.warn(`Language ${lang} not found, falling back to English`);
        lang = 'en';
    }
    currentLanguage = lang;

    updateGeneralUIText();
    updateHUD();
    updateTimeMachineUIText();

    document.querySelectorAll('#language-selector span').forEach(span => {
        span.classList.toggle('active', span.getAttribute('data-lang') === lang);
    });
}

function getCurrentLanguage() {
    return translations[currentLanguage];
}

// --- 11. GAME STATE MANAGEMENT FUNCTIES ---

function startGame() {
    if (storylineElement) {
        storylineElement.classList.add('hidden'); // Verberg de storyline overlay
    }
    if (gameContainer) {
        gameContainer.classList.remove('hidden'); // Toon de game-container
    }
    currentState = GAME_STATE.PLAYING;
    startEra(selectedEra);
    canvas.focus();
}

function startEra(eraId) {
    selectedEra = eraId;
    const era = eras[selectedEra];

    questProgress = 0;
    hitsTaken = 0;
    score = 0; // Reset score bij start nieuwe era

    initializeLevel();
    resetPlayer();
    updateHUD();

    // Zorg ervoor dat de gameloop start als deze nog niet draait
    if (!gameLoopId) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

// --- 12. GAME LOOP EN RENDERING ---

// Optimaliseer canvas rendering met een buffer-canvas
const bufferCanvas = document.createElement('canvas');
const bufferCtx = bufferCanvas.getContext('2d');

function gameLoop() {
    // Alleen doorgaan met de game logic als de staat PLAYING is
    if (currentState === GAME_STATE.PLAYING) {
        updatePlayer();
        updateEnemies();
        updatePowerUps();

        if (gameObjects.crystals.filter(c => !c.collected).length < MAX_CRYSTALS_ON_SCREEN && Math.random() < CRYSTAL_SPAWN_RATE) {
            spawnCrystal();
        }
        if (Math.random() < 0.005) {
            spawnPowerUp();
        }

        gameObjects.crystals.forEach(crystal => {
            if (!crystal.collected && checkCollision(gameObjects.player, crystal)) {
                crystal.collected = true;
                questProgress++;
                score += 10;
                updateHUD();
                if (questProgress >= eras[selectedEra].requiredCrystals) {
                    displayMessage(getCurrentLanguage().questComplete, false);
                }
            }
        });

        const currentEra = eras[selectedEra];
        if (currentEra.crafted && gameObjects.portals.length > 0) {
            const portal = gameObjects.portals[0];
            if (checkCollision(gameObjects.player, portal)) {
                showCompletedLabel();
                currentState = GAME_STATE.LEVEL_COMPLETE;
                cancelAnimationFrame(gameLoopId);
                gameLoopId = null;

                setTimeout(() => {
                    if (selectedEra < eras.length - 1) {
                        selectedEra++;
                        showTimeMachine();
                    } else {
                        displayMessage(getCurrentLanguage().gameFinished, true);
                        requestPlayerNameForLeaderboard();
                        currentState = GAME_STATE.GAME_FINISHED;
                    }
                }, 1200); // Wacht even na het tonen van het label
            }
        }
    }

    drawGame(); // Altijd tekenen, zelfs als het spel gepauzeerd is, zodat dialogen zichtbaar blijven.

    // Blijf de game loop aanvragen zolang de game niet volledig is afgesloten of een kritieke fout heeft.
    if (currentState !== GAME_STATE.GAME_FINISHED && currentState !== GAME_STATE.MENU) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
    // Als de game in MENU staat is, wordt de loop pas gestart bij startGame()
    // Als de game GAME_FINISHED is, wordt de loop niet meer gestart
}


function drawGame() {
    if (!canvas || !ctx) return;

    // Stel de bufferCanvas grootte in als deze nog niet is ingesteld
    if (bufferCanvas.width !== canvas.width || bufferCanvas.height !== canvas.height) {
        bufferCanvas.width = canvas.width;
        bufferCanvas.height = canvas.height;
    }

    bufferCtx.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);

    // --- Teken Speler ---
    const player = gameObjects.player;
    bufferCtx.fillStyle = activePowerUp === 'invincibility' ? 'var(--color-player-invincible)' : 'var(--color-player)';
    bufferCtx.fillRect(player.x, player.y, player.size, player.size);

    // --- Teken Kristallen ---
    bufferCtx.fillStyle = 'var(--color-crystal)';
    gameObjects.crystals.forEach(crystal => {
        if (!crystal.collected) {
            bufferCtx.beginPath();
            bufferCtx.arc(crystal.x + crystal.size / 2, crystal.y + crystal.size / 2, crystal.size / 2, 0, Math.PI * 2);
            bufferCtx.fill();
        }
    });

    // --- Teken Vijanden ---
    bufferCtx.fillStyle = 'var(--color-enemy)';
    gameObjects.enemies.forEach(enemy => {
        bufferCtx.beginPath();
        bufferCtx.moveTo(enemy.x, enemy.y + enemy.size);
        bufferCtx.lineTo(enemy.x + enemy.size / 2, enemy.y);
        bufferCtx.lineTo(enemy.x + enemy.size, enemy.y + enemy.size);
        bufferCtx.closePath();
        bufferCtx.fill();
    });

    // --- Teken Portaal ---
    bufferCtx.fillStyle = 'var(--color-portal)';
    gameObjects.portals.forEach(portal => {
        bufferCtx.beginPath();
        bufferCtx.arc(portal.x + portal.size / 2, portal.y + portal.size / 2, portal.size / 2, 0, Math.PI * 2);
        bufferCtx.fill();
        bufferCtx.strokeStyle = 'var(--color-border)';
        bufferCtx.lineWidth = 2;
        bufferCtx.stroke();
    });

    // --- Teken Power-Ups ---
    gameObjects.powerUps.forEach(powerUp => {
        bufferCtx.fillStyle = powerUp.type === 'speed' ? 'var(--color-powerup-speed)' : 'var(--color-powerup-invincibility)';
        bufferCtx.beginPath();
        bufferCtx.rect(powerUp.x, powerUp.y, powerUp.size, powerUp.size);
        bufferCtx.fill();
        bufferCtx.strokeStyle = 'var(--color-border)';
        bufferCtx.lineWidth = 1;
        bufferCtx.stroke();
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bufferCanvas, 0, 0);
}

// --- 13. LEADERBOARD FUNCTIES ---

const getLeaderboard = () => {
    const data = localStorage.getItem('aevum_spectra_leaderboard');
    return data ? JSON.parse(data) : [];
};

function requestPlayerNameForLeaderboard() {
    currentState = GAME_STATE.DIALOG;
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;

    let overlay = document.getElementById('name-input-overlay');
    overlay.classList.remove('hidden'); // Toon de overlay

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

    playerNameInput.focus();

    saveNameBtn.onclick = () => {
        let name = playerNameInput.value.trim();
        if (name === '') {
            name = lang.anonymous;
        }

        saveScoreToLeaderboardInternal(name, score);

        overlay.classList.add('hidden'); // Verberg de overlay
        showLeaderboard();
    };

    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveNameBtn.click();
        }
    });
}

function saveScoreToLeaderboardInternal(name, scoreToSave) {
    let leaderboard = getLeaderboard();
    leaderboard.push({ name, score: scoreToSave, date: new Date().toLocaleString() });
    leaderboard = leaderboard.sort((a, b) => b.score - a.score).slice(0, 5);
    localStorage.setItem('aevum_spectra_leaderboard', JSON.stringify(leaderboard));
}

function showLeaderboard() {
    currentState = GAME_STATE.DIALOG;
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;

    let overlay = document.getElementById('leaderboard-overlay');
    overlay.classList.remove('hidden'); // Toon de overlay

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
        overlay.classList.add('hidden'); // Verberg de overlay
        currentState = GAME_STATE.MENU; // Terug naar het hoofdmenu staat
        storylineElement.classList.remove('hidden'); // Zorg dat de storyline weer zichtbaar wordt
        gameContainer.classList.add('hidden'); // Verberg de game-container weer
        updateGeneralUIText(); // Update teksten voor eventuele taalwisseling
    };
}