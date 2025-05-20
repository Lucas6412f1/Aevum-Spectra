// main.js - Aevum Spectra Game Logic (Modernized for 2025!)

import { initializeButton } from './supportLogic';

// --- 1. GLOBALE CONSTANTEN EN VARIABELEN ---

// Game Informatie
const GAME_TITLE = 'Aevum Spectra';
const GAME_VERSION = '0.5'; // Updated to version 0.5
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
    portals: [],
    powerUps: [] // Voeg power-ups toe aan game objects
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
        startGame: "Start spel",
        questComplete: "Opdracht voltooid!",
        levelComplete: "Tijdperk voltooid!",
        crafted: "Gecraft!",
        craftItem: "Craft item",
        notEnoughCrystals: "Niet genoeg kristallen om te craften!",
        gameOverMessage: "Game Over! Je bent te vaak geraakt.",
        gameFinished: "Gefeliciteerd! Je hebt alle tijdperken voltooid!",
    },
    en: {
        welcome: "Welcome to Aevum Spectra!",
        score: "Score",
        level: "Era",
        quest: "Quest",
        progress: "Progress",
        version: "Version",
        startGame: "Start game",
        questComplete: "Quest complete!",
        levelComplete: "Era complete!",
        crafted: "Crafted!",
        craftItem: "Craft item",
        notEnoughCrystals: "Not enough crystals to craft!",
        gameOverMessage: "Game Over! You were hit too many times.",
        gameFinished: "Congratulations! You have completed all eras!",
    }
};

// Function to get the current language translations
function getCurrentLanguage() {
    return translations[currentLanguage] || translations['en'];
}

/**
 * Toont een tijdelijke melding op het scherm.
 * @param {string} message - Het te tonen bericht.
 * @param {boolean} isCritical - Indien true, blijft de melding staan en is rood. Anders verdwijnt het na 3 sec.
 */
function displayMessage(message, isCritical = false) {
    if (!meldingElement) return;

    // Stop eventuele lopende animatie
    meldingElement.style.animation = 'none';
    meldingElement.offsetHeight; // Trigger reflow om de animatie te resetten

    meldingElement.textContent = message;
    meldingElement.style.setProperty('--melding-border-color', isCritical ? '#FF4136' : '#FFD700');
    meldingElement.style.display = 'block';

    meldingElement.style.animation = 'fadeInOut 3s forwards cubic-bezier(0.25, 0.46, 0.45, 0.94)';

    // Verwijder de display:none na de animatie
    const animationEndHandler = () => {
        if (!isCritical) { // Alleen automatisch verbergen als het niet kritiek is
            meldingElement.style.display = 'none';
        }
        meldingElement.removeEventListener('animationend', animationEndHandler);
    };
    meldingElement.addEventListener('animationend', animationEndHandler);

    if (isCritical) {
        // Voor kritieke meldingen: game pauzeren, en pas na de animatie weer doorgaan of resetten.
        currentState = GAME_STATE.DIALOG;
        setTimeout(() => {
            if (hitsTaken >= MAX_HITS_ALLOWED) {
                resetEra();
            }
            currentState = GAME_STATE.PLAYING;
            updateHUD(); // Zorg dat de HUD geüpdatet wordt na reset
        }, 3000); // Duur van de animatie
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
    // Optimalisatie: Geen Math.max/min per keypress, maar na de loop
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
    score = 0; // Reset score bij het starten van een nieuw tijdperk of reset

    initializeLevel();
    resetPlayer();
    updateHUD(); // Zorg dat de HUD meteen geüpdatet wordt na reset
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

// --- Power-Up Feature ---
const POWER_UP_TYPES = ['speed', 'invincibility'];
let activePowerUp = null;
let powerUpTimer = null;

function spawnPowerUp() {
    const margin = 50;
    const powerUp = {
        x: margin + Math.random() * (canvas.width - margin * 2),
        y: margin + Math.random() * (canvas.height - margin * 2),
        size: TILE_SIZE,
        type: POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)]
    };
    gameObjects.powerUps.push(powerUp);
}

function activatePowerUp(type) {
    activePowerUp = type;
    clearTimeout(powerUpTimer);
    powerUpTimer = setTimeout(() => {
        activePowerUp = null;
        updateHUD();
    }, 10000); // Power-Up lasts for 10 seconds

    if (type === 'speed') {
        gameObjects.player.speed *= 2;
        setTimeout(() => gameObjects.player.speed = PLAYER_SPEED, 10000);
    } else if (type === 'invincibility') {
        // Handle invincibility logic
    }

    updateHUD();
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

    if (gameTitleElement) {
        gameTitleElement.textContent = gameTitleElement.getAttribute(`data-${currentLanguage}`);
    }

    if (storylineStartButton) {
        storylineStartButton.textContent = lang.startGame;
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
            powerUpElement.textContent = `Actieve Power-Up: ${activePowerUp}`;
            powerUpElement.style.display = 'block';
        } else {
            powerUpElement.style.display = 'none';
        }
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

    // Optimalisatie: Gebruik event delegation of bind event listeners één keer als de knoppen statisch zijn.
    // Voor dynamisch gegenereerde elementen zoals hier, moeten listeners opnieuw gebonden worden.
    document.querySelectorAll('#era-select .era-button').forEach(btn => {
        btn.onclick = () => {
            selectedEra = parseInt(btn.getAttribute('data-era'));
            document.getElementById('era-quest-display').textContent = eras[selectedEra].quest[currentLanguage];
            document.querySelectorAll('.era-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
    });

    document.getElementById('start-era-btn').onclick = () => {
        overlay.remove(); // Verwijder de overlay
        startEra(selectedEra); // Start het geselecteerde tijdperk
        canvas.focus(); // Zorg dat de canvas weer input ontvangt
    };

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
    if (!levelCompletedLabel) {
        levelCompletedLabel = document.createElement('div');
        levelCompletedLabel.id = 'level-completed-label';
        levelCompletedLabel.classList.add('level-completed-label');
        document.body.appendChild(levelCompletedLabel);
    }

    levelCompletedLabel.textContent = getCurrentLanguage().levelReady;
    levelCompletedLabel.style.display = 'block';
    
    levelCompletedLabel.style.animation = 'none'; // Reset animatie
    levelCompletedLabel.offsetHeight; // Trigger reflow
    levelCompletedLabel.style.animation = 'popAndFade 1.5s forwards cubic-bezier(0.68, -0.55, 0.26, 1.55)';

    const animationEndHandler = () => {
        levelCompletedLabel.style.display = 'none';
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

// --- 11. GAME STATE MANAGEMENT FUNCTIES ---

function startGame() {
    if (storylineElement) {
        storylineElement.style.display = 'none'; // Verberg de storyline overlay
    }
    if (gameContainer) {
        // Toon de game-container pas als de game daadwerkelijk start
        gameContainer.style.display = 'flex';
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
    score = 0; // Reset score bij het starten van een nieuw tijdperk

    initializeLevel();
    resetPlayer();
    updateHUD();

    if (!gameLoopId) {
        gameLoopId = requestAnimationFrame(gameLoop);
    } else {
        // Als de loop al draait (bijvoorbeeld bij een reset), hoef je hem niet opnieuw te starten
        // Maar als hij gecancelled was (bijv. na Level Complete), moet hij wel hervat worden.
        // We kunnen dit checken door `gameLoopId` te resetten naar `null` bij cancel.
        // Echter, het checken van `currentState` is vaak voldoende.
        if (currentState !== GAME_STATE.PLAYING) {
            gameLoopId = requestAnimationFrame(gameLoop);
        }
    }
}

// --- 12. GAME LOOP EN RENDERING ---

function gameLoop() {
    if (currentState === GAME_STATE.PLAYING) {
        updatePlayer();
        updateEnemies();
        updatePowerUps();
        
        if (gameObjects.crystals.filter(c => !c.collected).length < MAX_CRYSTALS_ON_SCREEN && Math.random() < CRYSTAL_SPAWN_RATE) {
            spawnCrystal();
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
                gameLoopId = null; // Belangrijk: reset gameLoopId bij annulering

                setTimeout(() => {
                    if (selectedEra < eras.length - 1) {
                        selectedEra++;
                        showTimeMachine();
                    } else {
                        displayMessage(getCurrentLanguage().gameFinished, true);
                        requestPlayerNameForLeaderboard();
                        currentState = GAME_STATE.GAME_FINISHED;
                    }
                }, 1200);
            }
        }
    }

    drawGame();
    if (currentState === GAME_STATE.PLAYING) { // Alleen doorgaan met de loop als we PLAYING zijn
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

// Optimaliseer canvas rendering met een buffer-canvas
const bufferCanvas = document.createElement('canvas');
const bufferCtx = bufferCanvas.getContext('2d');

bufferCanvas.width = canvas.width;
bufferCanvas.height = canvas.height;

/**
 * Tekent alle game-objecten op de buffer-canvas en kopieert deze naar de hoofd-canvas.
 */
function drawGame() {
    bufferCtx.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height); // Wis de buffer-canvas

    // --- Teken Speler ---
    const player = gameObjects.player;
    bufferCtx.fillStyle = '#00BFFF';
    bufferCtx.fillRect(player.x, player.y, player.size, player.size);

    // --- Teken Kristallen ---
    bufferCtx.fillStyle = '#FFD700';
    gameObjects.crystals.forEach(crystal => {
        if (!crystal.collected) {
            bufferCtx.beginPath();
            bufferCtx.arc(crystal.x + crystal.size / 2, crystal.y + crystal.size / 2, crystal.size / 2, 0, Math.PI * 2);
            bufferCtx.fill();
        }
    });

    // --- Teken Vijanden ---
    bufferCtx.fillStyle = '#FF4136';
    gameObjects.enemies.forEach(enemy => {
        bufferCtx.beginPath();
        bufferCtx.moveTo(enemy.x, enemy.y + enemy.size);
        bufferCtx.lineTo(enemy.x + enemy.size / 2, enemy.y);
        bufferCtx.lineTo(enemy.x + enemy.size, enemy.y + enemy.size);
        bufferCtx.closePath();
        bufferCtx.fill();
    });

    // Kopieer de buffer naar de hoofd-canvas
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
    gameLoopId = null; // Zorg dat de game loop echt stopt

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

    playerNameInput.focus();

    saveNameBtn.onclick = () => {
        let name = playerNameInput.value.trim();
        if (name === '') {
            name = lang.anonymous;
        }
        
        saveScoreToLeaderboardInternal(name, score);
        
        overlay.remove();
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
    leaderboard = leaderboard.sort((a, b) => b.score - a.score).slice(0, 5); // Houd top 5 bij
    localStorage.setItem('aevum_spectra_leaderboard', JSON.stringify(leaderboard));
}

function showLeaderboard() {
    currentState = GAME_STATE.DIALOG;
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;

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
        currentState = GAME_STATE.MENU; // Ga terug naar het menu
        // De game loop wordt pas gestart als op 'Start spel' wordt geklikt in de storyline.
        // De storyline wordt zichtbaar gemaakt door de onload functie.
        storylineElement.style.display = 'flex'; // Zorg dat de storyline weer zichtbaar wordt
        gameContainer.style.display = 'none'; // Verberg de game-container weer
        updateGeneralUIText(); // Zorgt dat de "Start spel" knop taal correct is
    };
}

// --- 14. INITIALISATIE EN EVENT LISTENERS ---

window.onload = function() {
    // Creëer de Craft knop dynamisch en voeg toe aan de HUD
    craftButton = document.createElement('button');
    craftButton.id = 'craft-btn';
    craftButton.onclick = tryCraft;
    const versieDiv = document.getElementById('versie');
    if (versieDiv && hudElement) {
        hudElement.insertBefore(craftButton, versieDiv);
    } else if (hudElement) {
        hudElement.appendChild(craftButton);
    }

    // Event listener voor de taal selector (nu op de parent div)
    document.getElementById('language-selector').addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN' && e.target.dataset.lang) {
            setLanguage(e.target.dataset.lang);
        }
    });

    // Use the utility function to initialize the Start Game button
    initializeButton('storyline-start-btn', startGame);

    // Initialiseer de game staat en toon het startscherm
    setLanguage('nl');
    // Zorg ervoor dat de game-container verborgen is bij start en de storyline zichtbaar
    if (gameContainer) {
        gameContainer.style.display = 'none';
    }
    if (storylineElement) {
        storylineElement.style.display = 'flex'; // Zorg dat de storyline bij start zichtbaar is
    }

    // Controleer of de canvas correct is geïnitialiseerd
    if (!canvas || !ctx) {
        console.error('Canvas of context kon niet worden geïnitialiseerd. Controleer of de canvas correct in de HTML is opgenomen.');
        alert('Er is een probleem met de game rendering. Probeer de pagina opnieuw te laden.');
    } else {
        console.log('Canvas en context succesvol geïnitialiseerd.');
    }
};