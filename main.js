// main.js - Aevum Spectra Game Logic (Modernized for 2025!)

// Belangrijk: Zorg ervoor dat 'supportLogic.js' in dezelfde map staat
import { initializeButton } from './supportLogic.js'; // Let op de .js extensie!

// --- 1. GLOBALE CONSTANTEN EN VARIABELEN ---

// Game Informatie
const GAME_TITLE = 'Aevum Spectra';
const GAME_VERSION = '0.5.3';
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
const MAX_HITS_ALLOWED = 5;

// --- 2. GAME STATE VARIABELEN ---
let currentState = GAME_STATE.MENU;
let score = 0;
let level = 1;
let hitsTaken = 0; // Aantal keren dat de speler is geraakt
let gameLoopId; // Voor requestAnimationFrame
let lastFrameTime = 0; // Voor delta time berekeningen
let isGameOver = false;
let activePowerUp = null;
let powerUpTimer = 0;

// Game Objecten (speler, vijanden, kristallen, portaal)
const gameObjects = {
    player: { x: 0, y: 0, size: TILE_SIZE },
    enemies: [],
    crystals: [],
    portals: [],
    powerUps: [] // Nieuwe array voor power-ups
};

// Tijdperken (Eras)
const eras = [
    {
        id: 'prehistory',
        name: { nl: 'Prehistorie', en: 'Prehistory' },
        description: {
            nl: 'De tijd van dinosauriërs en primitieve stammen. Verzamel de fossiele kristallen om de "Tijdreizigers Kompas" te bouwen en navigeer naar het volgende tijdperk. Pas op voor de woeste T-Rexen!',
            en: 'The era of dinosaurs and primitive tribes. Collect the fossilized crystals to build the "Time Traveler\'s Compass" and navigate to the next era. Beware of the ferocious T-Rexes!'
        },
        requirements: { item: 'timeTravelersCompass', crystals: 5 }, // Voorbeeld: 5 kristallen nodig
        craftedItem: null, // Placeholder voor item object na craften
        isCompleted: false
    },
    {
        id: 'future',
        name: { nl: 'Toekomst', en: 'Future' },
        description: {
            nl: 'Een neonverlichte metropool waar geavanceerde technologie en vliegende auto\'s de norm zijn. Verzamel de silicium kristallen om een "Warp Drive Kern" te construeren en spring verder door de tijd. Ontwijk de geautomatiseerde drones!',
            en: 'A neon-lit metropolis where advanced technology and flying cars are the norm. Collect the silicon crystals to construct a "Warp Core Drive" and jump further through time. Dodge the automated drones!'
        },
        requirements: { item: 'warpDriveCore', crystals: 7 },
        craftedItem: null,
        isCompleted: false
    }
    // Voeg hier meer tijdperken toe
];
let currentEraIndex = 0; // Start in het eerste tijdperk
let currentEra = eras[currentEraIndex];

// Taalinstellingen
const translations = {
    nl: {
        gameTitle: 'Aevum Spectra!',
        welcomeMessage: 'Welkom bij Aevum Spectra!',
        storylineTitle: 'Welkom, Tijdreiziger!',
        storylineText1: 'In Aevum Spectra ben jij de laatste hoop van de mensheid. Het Tijdweefsel, de onzichtbare structuur die het verleden, heden en de toekomst verbindt, is instabiel geworden. Scheuren verschijnen in de realiteit, en chaos dreigt de tijdlijnen te verslinden.',
        storylineText2: 'Oorlogen die al lang voorbij waren, barsten opnieuw uit, technologische rampen teisteren onverwacht steden, en ziektes die uitgeroeid waren, steken de kop op. Zelfs vreemde, onverklaarbare paradoxen en entiteiten verschijnen, die het evenwicht verder verstoren. Een mysterieuze energie, "Spectra" genaamd, lekt door deze scheuren, en de collectieve herinneringen van de mensheid beginnen te vervagen.',
        storylineText3: 'Jouw missie is helder: reis door de meest kritieke tijdperken in de geschiedenis om de "Tijdankers" te herstellen – krachtige artefacten die het Tijdweefsel stabiliseren. Verzamel "Chronos Kristallen" om de benodigde technologie te activeren en ontwijk de "Tijd Anomalieën" – gevaarlijke wezens die ontstaan uit de verstoringen.',
        storylineText4: 'Elk tijdperk presenteert unieke uitdagingen, vijanden en puzzels. Met je slimme uitvindingen en moedige acties moet je puzzels oplossen, vijanden slim te slim af zijn en belangrijke keuzes maken die de loop van de geschiedenis bepalen. Ben je klaar om de tijden te trotseren en Aevum Spectra te herstellen?',
        startGame: 'Start spel',
        nextLevel: 'Volgend Tijdperk',
        scoreLabel: 'Score:',
        levelLabel: 'Tijdperk:',
        questLabel: 'Opdracht:',
        progressLabel: 'Voortgang:',
        versionLabel: 'Versie:',
        hitsLabel: 'Raken:',
        craftButton: 'Maak item',
        craftingRequired: 'Nodig voor {item}: {crystals} kristallen',
        itemCrafted: 'Je hebt een {item} gemaakt!',
        eraCompleted: 'Tijdperk voltooid!',
        selectEra: 'Kies een Tijdperk',
        gameOverTitle: 'Game Over!',
        gameOverMessage: 'Je bent te vaak geraakt! De tijdlijn is verloren. Je score: {score}',
        enterName: 'Voer je naam in:',
        saveScore: 'Opslaan',
        leaderboardTitle: 'Leaderboard',
        noScoresYet: 'Nog geen scores. Speel om de eerste te zijn!',
        close: 'Sluiten',
        speedBoost: 'Snelheidsboost!',
        invincibility: 'Onkwetsbaar!',
        crystalCollected: 'Kristal verzameld!',
        hitTaken: 'Je bent geraakt!',
        portalReady: 'Portaal geactiveerd!',
        portalEntered: 'Portaal Betreden!',
        eraLocked: 'Niet beschikbaar'
    },
    en: {
        gameTitle: 'Aevum Spectra!',
        welcomeMessage: 'Welcome to Aevum Spectra!',
        storylineTitle: 'Welcome, Time Traveler!',
        storylineText1: 'In Aevum Spectra, you are humanity\'s last hope. The Fabric of Time, the invisible structure connecting past, present, and future, has become unstable. Rifts are appearing in reality, and chaos threatens to engulf the timelines.',
        storylineText2: 'Wars long past erupt anew, technological disasters unexpectedly plague cities, and eradicated diseases resurface. Even strange, inexplicable paradoxes and entities are appearing, further disrupting the balance. A mysterious energy called "Spectra" leaks through these rifts, and humanity\'s collective memories are beginning to fade.',
        storylineText3: 'Your mission is clear: travel through the most critical eras in history to restore the "Time Anchors" – powerful artifacts that stabilize the Fabric of Time. Collect "Chronos Crystals" to activate the necessary technology and evade the "Time Anomalies" – dangerous beings emerging from the disturbances.',
        storylineText4: 'Each era presents unique challenges, enemies, and puzzles. With your clever inventions and courageous actions, you must solve puzzles, outsmart enemies, and make important choices that determine the course of history. Are you ready to brave the ages and restore Aevum Spectra?',
        startGame: 'Start Game',
        nextLevel: 'Next Era',
        scoreLabel: 'Score:',
        levelLabel: 'Era:',
        questLabel: 'Quest:',
        progressLabel: 'Progress:',
        versionLabel: 'Version:',
        hitsLabel: 'Hits:',
        craftButton: 'Craft Item',
        craftingRequired: 'Needed for {item}: {crystals} crystals',
        itemCrafted: 'You crafted a {item}!',
        eraCompleted: 'Era Completed!',
        selectEra: 'Select an Era',
        gameOverTitle: 'Game Over!',
        gameOverMessage: 'You were hit too many times! The timeline is lost. Your score: {score}',
        enterName: 'Enter your name:',
        saveScore: 'Save Score',
        leaderboardTitle: 'Leaderboard',
        noScoresYet: 'No scores yet. Play to be the first!',
        close: 'Close',
        speedBoost: 'Speed Boost!',
        invincibility: 'Invincible!',
        crystalCollected: 'Crystal collected!',
        hitTaken: 'You were hit!',
        portalReady: 'Portal activated!',
        portalEntered: 'Portal Entered!',
        eraLocked: 'Not Available'
    }
};
let currentLanguage = 'nl'; // Standaardtaal


// --- 3. DOM ELEMENTEN CACHEN ---
const gameContainer = document.getElementById('game-container');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hudElement = document.getElementById('hud');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const opdrachtDisplay = document.getElementById('opdracht');
const voortgangDisplay = document.getElementById('voortgang');
const meldingDisplay = document.getElementById('melding');
const gameTitleElement = document.getElementById('game-title');
const storylineElement = document.getElementById('storyline');
const storylineTitleElement = document.getElementById('storyline-title');
const storylineTextElements = [
    document.getElementById('storyline-text-1'),
    document.getElementById('storyline-text-2'),
    document.getElementById('storyline-text-3'),
    document.getElementById('storyline-text-4')
];
const timeMachineOverlay = document.getElementById('timemachine-overlay');
const nameInputOverlay = document.getElementById('name-input-overlay');
const leaderboardOverlay = document.getElementById('leaderboard-overlay');
const activePowerUpDisplay = document.createElement('div'); // Nieuw element voor actieve power-up
activePowerUpDisplay.id = 'active-power-up';
activePowerUpDisplay.classList.add('hidden'); // Standaard verborgen
if (hudElement) {
    hudElement.appendChild(activePowerUpDisplay);
}
const levelCompletedLabel = document.createElement('div');
levelCompletedLabel.id = 'level-completed-label';
levelCompletedLabel.classList.add('level-completed-label', 'hidden');
document.body.appendChild(levelCompletedLabel); // Voeg toe aan body, zodat het over alles heen kan

// Buffer Canvas voor vloeiendere rendering
const bufferCanvas = document.createElement('canvas');
const bufferCtx = bufferCanvas.getContext('2d');

// --- 4. GAME INITIALISATIE EN HOOFDLOOP ---

function initGame() {
    // Stel de buffer canvas afmetingen in
    bufferCanvas.width = canvas.width;
    bufferCanvas.height = canvas.height;

    // Reset game variabelen
    score = 0;
    level = 1;
    hitsTaken = 0;
    isGameOver = false;
    activePowerUp = null;
    powerUpTimer = 0;
    currentEraIndex = 0; // Begin altijd bij het eerste tijdperk
    currentEra = eras[currentEraIndex];
    eras.forEach(era => era.isCompleted = false); // Reset voltooiingsstatus van tijdperken

    // Initialiseer game objecten
    gameObjects.player = {
        x: canvas.width / 2 - TILE_SIZE / 2,
        y: canvas.height / 2 - TILE_SIZE / 2,
        size: TILE_SIZE
    };
    gameObjects.enemies = [];
    gameObjects.crystals = [];
    gameObjects.portals = [];
    gameObjects.powerUps = [];

    // Spawn initiële objecten
    spawnPortal();
    spawnCrystals(3); // Start met 3 kristallen
    spawnEnemies(2);  // Start met 2 vijanden

    // Werk HUD bij
    updateHUD();
    updateQuest();
    updateProgress();

    // Verberg de storyline en toon de game container
    storylineElement.classList.add('hidden');
    if (gameContainer) {
        gameContainer.style.display = 'flex'; // Zorg dat de game-container weer zichtbaar is
    }
    // Zorg ervoor dat de game-container en canvas de juiste grootte hebben
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = 800; // Hardcode de interne resolutie van de canvas
    canvas.height = 600;
    bufferCanvas.width = canvas.width;
    bufferCanvas.height = canvas.height;

    // Start de gameloop
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

function startGame() {
    currentState = GAME_STATE.PLAYING;
    initGame(); // Initialiseer de game staat en start de loop
    document.getElementById('game-title').style.display = 'none'; // Verberg de titel
}

function gameLoop(currentTime) {
    if (isGameOver || currentState === GAME_STATE.DIALOG || currentState === GAME_STATE.LEVEL_COMPLETE || currentState === GAME_STATE.GAME_FINISHED) {
        gameLoopId = null; // Stop de loop als de game over is of in een dialoog zit
        return;
    }

    const deltaTime = (currentTime - lastFrameTime) / 1000; // Tijd in seconden
    lastFrameTime = currentTime;

    updateGame(deltaTime);
    drawGame();

    gameLoopId = requestAnimationFrame(gameLoop);
}

function updateGame(deltaTime) {
    if (isGameOver) return; // Stop updates als game over is

    updatePlayerMovement();
    updateEnemies(deltaTime);
    handleCollisions();
    spawnObjects(deltaTime); // Spawn kristallen en power-ups

    // Power-up timer
    if (activePowerUp) {
        powerUpTimer -= deltaTime;
        if (powerUpTimer <= 0) {
            deactivatePowerUp();
        }
    }

    updateHUD(); // Houd de HUD up-to-date
    updateProgress(); // Houd de voortgang up-to-date
}


function drawGame() {
    // Clear the buffer canvas for the next frame
    bufferCtx.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);

    // --- Teken Speler ---
    const player = gameObjects.player;
    // Gebruik nu directe hex-waarden
    // --color-player: #44ff00;
    // --color-player-invincible: rgba(0, 255, 255, 0.5); (Let op, dit is een RGBA, die kun je ook direct gebruiken)
    bufferCtx.fillStyle = activePowerUp === 'invincibility' ? 'rgba(0, 255, 255, 0.5)' : '#44ff00';
    bufferCtx.fillRect(player.x, player.y, player.size, player.size);


    // --- Teken Kristallen ---
    // --color-crystal: rgba(255, 215, 0, 0.5);
    bufferCtx.fillStyle = 'rgba(255, 215, 0, 0.5)';
    gameObjects.crystals.forEach(crystal => {
        // Teken een cirkel voor elk kristal
        bufferCtx.beginPath();
        bufferCtx.arc(crystal.x + crystal.size / 2, crystal.y + crystal.size / 2, crystal.size / 2, 0, Math.PI * 2);
        bufferCtx.fill();
        bufferCtx.closePath();
    });

    // --- Teken Vijanden ---
    // --color-enemy: rgba(231, 76, 60, 0.5);
    bufferCtx.fillStyle = 'rgba(231, 76, 60, 0.5)';
    gameObjects.enemies.forEach(enemy => {
        bufferCtx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
    });

    // --- Teken Portaal ---
    // --color-portal: rgba(147, 112, 219, 0.5);
    bufferCtx.fillStyle = 'rgba(147, 112, 219, 0.5)';
    gameObjects.portals.forEach(portal => {
        bufferCtx.fillRect(portal.x, portal.y, portal.size, portal.size);
    });

    // --- Teken Power-Ups ---
    gameObjects.powerUps.forEach(powerUp => {
        let powerUpColor;
        // --color-accent-cyan: #00FFFF; (voor speed)
        // --color-accent-green: #2ECC71; (voor invincibility)
        if (powerUp.type === 'speed') {
            powerUpColor = '#00FFFF'; // Cyaan voor snelheid
        } else if (powerUp.type === 'invincibility') {
            powerUpColor = '#2ECC71'; // Groen voor onoverwinnelijkheid
        }
        bufferCtx.fillStyle = powerUpColor;
        bufferCtx.fillRect(powerUp.x, powerUp.y, powerUp.size, powerUp.size);
    });


    // Copy the buffer canvas to the main canvas
    ctx.drawImage(bufferCanvas, 0, 0);
}


// --- 5. SPELER BEWEGING ---
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function updatePlayerMovement() {
    if (currentState !== GAME_STATE.PLAYING) return;

    let currentSpeed = PLAYER_SPEED;
    if (activePowerUp === 'speed') {
        currentSpeed *= 2; // Verdubbel de snelheid
    }

    if (keys['arrowup'] || keys['w']) {
        gameObjects.player.y -= currentSpeed;
    }
    if (keys['arrowdown'] || keys['s']) {
        gameObjects.player.y += currentSpeed;
    }
    if (keys['arrowleft'] || keys['a']) {
        gameObjects.player.x -= currentSpeed;
    }
    if (keys['arrowright'] || keys['d']) {
        gameObjects.player.x += currentSpeed;
    }

    // Zorg dat de speler binnen het canvas blijft
    gameObjects.player.x = Math.max(0, Math.min(canvas.width - gameObjects.player.size, gameObjects.player.x));
    gameObjects.player.y = Math.max(0, Math.min(canvas.height - gameObjects.player.size, gameObjects.player.y));
}

// --- 6. VIJAND LOGICA ---
function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        gameObjects.enemies.push(createRandomEnemy());
    }
}

function createRandomEnemy() {
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y;
    if (side === 0) { // Top
        x = Math.random() * (canvas.width - TILE_SIZE);
        y = -TILE_SIZE;
    } else if (side === 1) { // Right
        x = canvas.width;
        y = Math.random() * (canvas.height - TILE_SIZE);
    } else if (side === 2) { // Bottom
        x = Math.random() * (canvas.width - TILE_SIZE);
        y = canvas.height;
    } else { // Left
        x = -TILE_SIZE;
        y = Math.random() * (canvas.height - TILE_SIZE);
    }

    return {
        x: x,
        y: y,
        size: TILE_SIZE,
        speed: ENEMY_SPEED * (1 + (level - 1) * 0.2), // Vijanden worden sneller per level
        targetX: gameObjects.player.x,
        targetY: gameObjects.player.y
    };
}

function updateEnemies(deltaTime) {
    gameObjects.enemies.forEach(enemy => {
        // Update target (naar huidige speler positie)
        enemy.targetX = gameObjects.player.x;
        enemy.targetY = gameObjects.player.y;

        const dx = enemy.targetX - enemy.x;
        const dy = enemy.targetY - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) { // Voorkom delen door nul en kleine stappen
            enemy.x += (dx / distance) * enemy.speed * deltaTime * 60; // * 60 voor framesnelheid onafhankelijk
            enemy.y += (dy / distance) * enemy.speed * deltaTime * 60;
        }
    });

    // Verwijder vijanden die ver buiten beeld zijn (voorkomt prestatieproblemen)
    gameObjects.enemies = gameObjects.enemies.filter(enemy =>
        enemy.x > -TILE_SIZE * 2 && enemy.x < canvas.width + TILE_SIZE * 2 &&
        enemy.y > -TILE_SIZE * 2 && enemy.y < canvas.height + TILE_SIZE * 2
    );

    // Spawn nieuwe vijanden als er te weinig zijn (of na een bepaalde tijd/score)
    // Voorbeeld: als er minder vijanden zijn dan level * 1, maar minimaal 2
    const minEnemies = Math.max(2, Math.floor(level / 2) + 1);
    while (gameObjects.enemies.length < minEnemies) {
        gameObjects.enemies.push(createRandomEnemy());
    }
}

// --- 7. KRISTAL LOGICA ---
function spawnCrystals(count) {
    for (let i = 0; i < count; i++) {
        gameObjects.crystals.push(createRandomCrystal());
    }
}

function createRandomCrystal() {
    return {
        x: Math.random() * (canvas.width - TILE_SIZE),
        y: Math.random() * (canvas.height - TILE_SIZE),
        size: TILE_SIZE
    };
}

// --- 8. PORTAAL LOGICA ---
function spawnPortal() {
    gameObjects.portals = [{
        x: Math.random() * (canvas.width - TILE_SIZE * 2), // Iets kleiner bereik
        y: Math.random() * (canvas.height - TILE_SIZE * 2),
        size: TILE_SIZE * 2, // Portaal is groter
        isActivated: false
    }];
}

// --- 9. POWER-UP LOGICA ---
function spawnPowerUps() {
    // Spawn met een kleine kans (bijv. 0.005 per frame)
    if (Math.random() < 0.005) {
        const type = Math.random() < 0.5 ? 'speed' : 'invincibility'; // 50% kans op elk type
        gameObjects.powerUps.push({
            x: Math.random() * (canvas.width - TILE_SIZE),
            y: Math.random() * (canvas.height - TILE_SIZE),
            size: TILE_SIZE,
            type: type
        });
    }
}

function activatePowerUp(type) {
    if (activePowerUp) {
        deactivatePowerUp(); // Deactiveer huidige power-up eerst
    }

    activePowerUp = type;
    powerUpTimer = 5; // Power-up duurt 5 seconden
    showMelding(translations[currentLanguage][type], type === 'speed' ? 'speed-boost' : 'invincibility-active');
    activePowerUpDisplay.textContent = translations[currentLanguage][type];
    activePowerUpDisplay.classList.remove('hidden');
}

function deactivatePowerUp() {
    activePowerUp = null;
    powerUpTimer = 0;
    activePowerUpDisplay.classList.add('hidden');
}


// --- 10. COLLISIE DETECTIE ---
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.size &&
           obj1.x + obj1.size > obj2.x &&
           obj1.y < obj2.y + obj2.size &&
           obj1.y + obj1.size > obj2.y;
}

function handleCollisions() {
    // Speler en Kristallen
    gameObjects.crystals.forEach((crystal, index) => {
        if (checkCollision(gameObjects.player, crystal)) {
            score += 10;
            gameObjects.crystals.splice(index, 1); // Verwijder kristal
            showMelding(translations[currentLanguage].crystalCollected, 'crystal-collected');
            spawnCrystals(1); // Spawn een nieuwe
            updateProgress(); // Werk voortgang bij na verzamelen
        }
    });

    // Speler en Vijanden
    gameObjects.enemies.forEach((enemy, index) => {
        if (checkCollision(gameObjects.player, enemy)) {
            if (activePowerUp === 'invincibility') {
                // Als onkwetsbaar, verwijder vijand en geef bonuspunten
                score += 5; // Kleine bonus voor het ontwijken met invincibility
                gameObjects.enemies.splice(index, 1);
                showMelding(translations[currentLanguage].hitTaken + ' (Onkwetsbaar!)', 'hit-invincible');
            } else {
                hitsTaken++;
                showMelding(translations[currentLanguage].hitTaken, 'hit-taken');
                // Optioneel: speler terugslaan of even onkwetsbaar maken na hit
                // gameObjects.player.x -= (enemy.x > gameObjects.player.x ? 20 : -20); // Voorbeeld terugslaan
                // gameObjects.player.y -= (enemy.y > gameObjects.player.y ? 20 : -20);
            }
            if (hitsTaken >= MAX_HITS_ALLOWED) {
                gameOver();
            }
        }
    });

    // Speler en Power-Ups
    gameObjects.powerUps.forEach((powerUp, index) => {
        if (checkCollision(gameObjects.player, powerUp)) {
            activatePowerUp(powerUp.type);
            gameObjects.powerUps.splice(index, 1); // Verwijder power-up
        }
    });

    // Speler en Portaal
    const portal = gameObjects.portals[0];
    if (portal && portal.isActivated && checkCollision(gameObjects.player, portal)) {
        showMelding(translations[currentLanguage].portalEntered, 'portal-entered');
        levelComplete();
    }
}


// --- 11. HUD EN MELDINGEN ---
function updateHUD() {
    scoreDisplay.textContent = `${translations[currentLanguage].scoreLabel} ${score}`;
    levelDisplay.textContent = `${translations[currentLanguage].levelLabel} ${level}`;
    document.getElementById('hits').textContent = `${translations[currentLanguage].hitsLabel} ${hitsTaken}/${MAX_HITS_ALLOWED}`;
}

function updateQuest() {
    const lang = translations[currentLanguage];
    if (currentEra.craftedItem) {
        opdrachtDisplay.textContent = `${lang.questLabel} ${lang.portalReady}`;
    } else {
        opdrachtDisplay.textContent = `${lang.questLabel} ${lang.craftingRequired.replace('{item}', getTranslation(currentEra.requirements.item)).replace('{crystals}', currentEra.requirements.crystals)}`;
    }
}

function updateProgress() {
    const lang = translations[currentLanguage];
    const requiredCrystals = currentEra.requirements.crystals;
    const collectedCrystals = score / 10; // Aangenomen dat elk kristal 10 punten is

    if (collectedCrystals >= requiredCrystals && !currentEra.craftedItem) {
        // Activeer de 'Maak item' knop
        document.getElementById('craft-btn').disabled = false;
        voortgangDisplay.textContent = `${lang.progressLabel} ${collectedCrystals}/${requiredCrystals} (${lang.craftButton} gereed!)`;
        // Melding dat craften gereed is kan hier ook
    } else if (currentEra.craftedItem) {
        voortgangDisplay.textContent = `${lang.progressLabel} ${lang.itemCrafted.replace('{item}', getTranslation(currentEra.requirements.item))}`;
        // Zorg dat de craft-knop uitgeschakeld is als het item gemaakt is
        document.getElementById('craft-btn').disabled = true;
    }
    else {
        document.getElementById('craft-btn').disabled = true;
        voortgangDisplay.textContent = `${lang.progressLabel} ${collectedCrystals}/${requiredCrystals}`;
    }
}


let meldingTimeout;
function showMelding(message, type = '') {
    clearTimeout(meldingTimeout); // Wis eventuele vorige timers

    meldingDisplay.textContent = message;
    meldingDisplay.className = ''; // Reset klassen
    meldingDisplay.classList.add('fade-in-out'); // Standaard animatie
    if (type) {
        meldingDisplay.classList.add(type); // Specifieke styling voor meldingstype
    }

    // Specifieke afhandeling voor kritieke meldingen of die langer moeten blijven
    if (type === 'hit-taken' || type === 'game-over') {
        meldingDisplay.classList.add('critical-message'); // Rode rand en schud-animatie
        meldingTimeout = setTimeout(() => {
            meldingDisplay.classList.remove('fade-in-out', 'critical-message', type);
            meldingDisplay.textContent = '';
        }, 3500); // Blijft langer zichtbaar
    } else {
        meldingTimeout = setTimeout(() => {
            meldingDisplay.classList.remove('fade-in-out', type);
            meldingDisplay.textContent = '';
        }, 2000); // Standaard duur
    }
}

// --- 12. GAME STATEN EN FLOW ---

function tryCraft() {
    const collectedCrystals = score / 10;
    if (collectedCrystals >= currentEra.requirements.crystals && !currentEra.craftedItem) {
        currentEra.craftedItem = { name: currentEra.requirements.item }; // Simpel object om te markeren dat het gemaakt is
        showMelding(translations[currentLanguage].itemCrafted.replace('{item}', getTranslation(currentEra.requirements.item)), 'item-crafted');
        gameObjects.portals[0].isActivated = true; // Activeer het portaal
        updateQuest(); // Werk de HUD bij
        updateProgress();
        showMelding(translations[currentLanguage].portalReady, 'portal-ready'); // Melding dat portaal klaar is
    } else if (currentEra.craftedItem) {
        showMelding(translations[currentLanguage].itemCrafted.replace('{item}', getTranslation(currentEra.requirements.item)), 'already-crafted');
    } else {
        showMelding(translations[currentLanguage].craftingRequired.replace('{item}', getTranslation(currentEra.requirements.item)).replace('{crystals}', currentEra.requirements.crystals), 'crafting-needed');
    }
}


function levelComplete() {
    currentState = GAME_STATE.LEVEL_COMPLETE;
    cancelAnimationFrame(gameLoopId); // Stop de gameloop
    gameLoopId = null;

    currentEra.isCompleted = true; // Markeer huidig tijdperk als voltooid

    showLevelCompletedLabel();

    // Wacht even voordat de tijdsmachine verschijnt
    setTimeout(() => {
        hideLevelCompletedLabel();
        showTimeMachine();
    }, 1500); // Wacht 1.5 seconden
}

function showLevelCompletedLabel() {
    levelCompletedLabel.textContent = translations[currentLanguage].eraCompleted;
    levelCompletedLabel.classList.remove('hidden');
    levelCompletedLabel.classList.add('pop-and-fade');
}

function hideLevelCompletedLabel() {
    levelCompletedLabel.classList.add('hidden');
    levelCompletedLabel.classList.remove('pop-and-fade');
}


function showTimeMachine() {
    currentState = GAME_STATE.DIALOG; // Zet de game staat op dialoog
    cancelAnimationFrame(gameLoopId); // Stop de game loop
    gameLoopId = null;

    timeMachineOverlay.classList.remove('hidden');

    const lang = translations[currentLanguage];
    let eraCardsHtml = '';
    eras.forEach((era, index) => {
        const isCurrent = (index === currentEraIndex);
        const isCompleted = era.isCompleted;
        const isLocked = (index > currentEraIndex && !eras[index -1].isCompleted); // Eenvoudige lock logica

        let buttonClass = 'era-button';
        let buttonText = lang.selectEra;
        let eraStatus = '';

        if (isCurrent && !isCompleted) {
            buttonClass += ' selected';
            buttonText = lang.nextLevel;
            eraStatus = `<span class="era-status-label">${lang.selectEra}</span>`; // Kan "Huidig" zijn
        } else if (isCompleted) {
            buttonClass += ' selected';
            buttonText = lang.nextLevel;
            eraStatus = `<span class="era-status-label" style="background-color: ${getComputedStyle(document.documentElement).getPropertyValue('--color-accent-green')}">${lang.eraCompleted}</span>`;
        } else if (isLocked) {
            buttonClass += ' disabled';
            buttonText = lang.eraLocked;
            eraStatus = `<span class="era-status-label" style="background-color: ${getComputedStyle(document.documentElement).getPropertyValue('--color-accent-red')}">${lang.eraLocked}</span>`;
        }

        eraCardsHtml += `
            <div class="era-card">
                <h3>${era.name[currentLanguage]}</h3>
                ${eraStatus}
                <p class="era-quest-text">${era.description[currentLanguage]}</p>
                <button class="${buttonClass}" data-era-index="${index}" ${isLocked ? 'disabled' : ''}>${buttonText}</button>
            </div>
        `;
    });

    // Voeg de inhoud toe aan de overlay
    timeMachineOverlay.innerHTML = `
        <div class="dialog-content">
            <h2 class="dialog-title">${lang.selectEra}</h2>
            <div class="era-selector-grid">
                ${eraCardsHtml}
            </div>
            <button id="close-timemachine-btn" class="main-button">${lang.close}</button>
        </div>
    `;

    // Voeg event listeners toe aan de knoppen van de tijdperken
    document.querySelectorAll('.era-button').forEach(button => {
        if (!button.disabled) {
            button.onclick = (e) => selectEra(parseInt(e.target.dataset.eraIndex));
        }
    });

    document.getElementById('close-timemachine-btn').onclick = () => {
        timeMachineOverlay.classList.add('hidden');
        // Keer terug naar het hoofdmenu of start de game opnieuw
        currentState = GAME_STATE.MENU;
        // Zorg dat de storyline weer zichtbaar wordt
        storylineElement.classList.remove('hidden');
        if (gameContainer) {
            gameContainer.style.display = 'none'; // Verberg de game-container
        }
        document.getElementById('game-title').style.display = 'block'; // Toon de titel weer
    };
}


function selectEra(index) {
    if (index >= 0 && index < eras.length && eras[index].isCompleted) { // Alleen geselecteerde tijdperken die voltooid zijn
        currentEraIndex = index + 1; // Ga naar het volgende tijdperk
        if (currentEraIndex < eras.length) {
            level++;
            currentEra = eras[currentEraIndex];
            timeMachineOverlay.classList.add('hidden'); // Verberg de tijdsmachine
            initGame(); // Herstart game voor nieuw tijdperk
            showMelding(translations[currentLanguage].nextLevel + ': ' + currentEra.name[currentLanguage], 'new-era');
            currentState = GAME_STATE.PLAYING; // Hervat gameplay
        } else {
            // Alle tijdperken voltooid, game is uitgespeeld
            gameFinished();
        }
    } else if (index === currentEraIndex && !eras[index].isCompleted) {
        // Als je op het huidige tijdperk klikt, maar het is nog niet voltooid
        showMelding(`Je moet het huidige tijdperk (${eras[index].name[currentLanguage]}) eerst voltooien!`, 'critical-message');
    } else if (index > currentEraIndex && !eras[index-1].isCompleted) {
         showMelding(translations[currentLanguage].eraLocked, 'critical-message');
    } else {
        // Dit zou niet moeten gebeuren met disabled knoppen, maar voor de zekerheid
        showMelding('Onbekende tijdperk selectie.', 'critical-message');
    }
}

function gameOver() {
    isGameOver = true;
    currentState = GAME_STATE.DIALOG;
    cancelAnimationFrame(gameLoopId); // Stop de game loop
    gameLoopId = null;

    showMelding(translations[currentLanguage].gameOverTitle, 'game-over');

    setTimeout(() => {
        showNameInput(score); // Vraag om naam na een korte vertraging
    }, 2000); // Wacht 2 seconden voordat naam invoer verschijnt
}


function showNameInput(finalScore) {
    nameInputOverlay.classList.remove('hidden');

    const lang = translations[currentLanguage];
    nameInputOverlay.innerHTML = `
        <div class="dialog-content">
            <h2 class="dialog-title">${lang.gameOverTitle}</h2>
            <p>${lang.gameOverMessage.replace('{score}', finalScore)}</p>
            <input type="text" id="player-name-input" class="name-input-field" placeholder="${lang.enterName}" maxlength="15">
            <button id="save-score-btn" class="main-button">${lang.saveScore}</button>
            <button id="show-leaderboard-after-game-btn" class="main-button">${lang.leaderboardTitle}</button>
        </div>
    `;

    document.getElementById('save-score-btn').onclick = () => {
        const playerName = document.getElementById('player-name-input').value.trim();
        if (playerName) {
            saveScore(playerName, finalScore);
            nameInputOverlay.classList.add('hidden');
            showMelding('Score opgeslagen!', 'success');
            // Keer terug naar het hoofdmenu na opslaan
            currentState = GAME_STATE.MENU;
            storylineElement.classList.remove('hidden');
            if (gameContainer) {
                gameContainer.style.display = 'none';
            }
            document.getElementById('game-title').style.display = 'block';
        } else {
            showMelding('Voer een naam in om op te slaan!', 'critical-message');
        }
    };

    document.getElementById('show-leaderboard-after-game-btn').onclick = () => {
        nameInputOverlay.classList.add('hidden'); // Verberg de naam invoer
        showLeaderboard(); // Toon leaderboard
    };
}

function gameFinished() {
    currentState = GAME_STATE.GAME_FINISHED;
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;

    // Je kunt hier een speciale "Game Uitgespeeld" melding tonen
    showMelding('Gefeliciteerd! Je hebt alle tijdperken voltooid!', 'game-finished');

    // Optioneel: toon direct het leaderboard of een eindscherm
    setTimeout(() => {
        showLeaderboard();
    }, 3000);
}

// --- 13. LEADERBOARD LOGICA ---
function getLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('aevumSpectraLeaderboard')) || [];
    // Sorteer van hoog naar laag
    return leaderboard.sort((a, b) => b.score - a.score);
}

function saveScore(name, score) {
    const leaderboard = getLeaderboard();
    const date = new Date().toLocaleDateString(currentLanguage, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    leaderboard.push({ name, score, date });
    // Beperk het leaderboard tot bijvoorbeeld de top 10
    if (leaderboard.length > 10) {
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard.splice(10);
    }
    localStorage.setItem('aevumSpectraLeaderboard', JSON.stringify(leaderboard));
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
        gameContainer.style.display = 'none'; // Verberg de game-container
        document.getElementById('game-title').style.display = 'block'; // Toon de titel weer
    };
}


// --- 14. TAAL WISSELEN ---
function setLanguage(lang) {
    currentLanguage = lang;
    const elements = document.querySelectorAll('[data-nl], [data-en]');

    elements.forEach(element => {
        if (element.dataset[lang]) {
            element.textContent = element.dataset[lang];
        }
    });

    // Update storyline content based on selected language
    if (storylineTitleElement) {
        storylineTitleElement.textContent = translations[lang].storylineTitle;
    }
    if (storylineTextElements[0]) {
        storylineTextElements[0].textContent = translations[lang].storylineText1;
        storylineTextElements[1].textContent = translations[lang].storylineText2;
        storylineTextElements[2].textContent = translations[lang].storylineText3;
        storylineTextElements[3].textContent = translations[lang].storylineText4;
    }

    // Update buttons
    const startButton = document.getElementById('storyline-start-btn');
    if (startButton) {
        startButton.textContent = translations[lang].startGame;
    }
    const craftButton = document.getElementById('craft-btn');
    if (craftButton) {
        craftButton.textContent = translations[lang].craftButton;
    }

    // Update HUD labels
    updateHUD();
    updateQuest();
    updateProgress();

    // Update versie label
    document.getElementById('versie').textContent = `${translations[lang].versionLabel} ${GAME_VERSION} ${GAME_VERSION_SUFFIX}`;

    // Markeer actieve taal
    document.querySelectorAll('#language-selector span').forEach(span => {
        span.classList.remove('active');
    });
    document.querySelector(`#language-selector span[data-lang="${lang}"]`).classList.add('active');
}

function getCurrentLanguage() {
    return translations[currentLanguage];
}

// Hulpmethode om vertalingen van items op te halen
function getTranslation(key) {
    const lang = translations[currentLanguage];
    const itemTranslations = {
        'timeTravelersCompass': { nl: 'Tijdreizigers Kompas', en: 'Time Traveler\'s Compass' },
        'warpDriveCore': { nl: 'Warp Drive Kern', en: 'Warp Drive Core' }
        // Voeg hier meer item vertalingen toe
    };
    return itemTranslations[key] ? itemTranslations[key][currentLanguage] : key;
}


// --- 15. GEBRUIKERSINTERACTIE EN STARTUP ---
document.addEventListener('DOMContentLoaded', () => {
    // Voeg de "Maak item" knop toe aan de HUD
    const craftButton = document.createElement('button');
    craftButton.id = 'craft-btn';
    craftButton.classList.add('main-button');
    craftButton.textContent = translations[currentLanguage].craftButton;
    craftButton.disabled = true; // Start als uitgeschakeld
    craftButton.onclick = tryCraft;
    const versieDiv = document.getElementById('versie');
    if (versieDiv && hudElement) {
        hudElement.insertBefore(craftButton, versieDiv);
    } else if (hudElement) {
        hudElement.appendChild(craftButton);
    }

    // Voeg het hits display toe aan de HUD
    const hitsDiv = document.createElement('div');
    hitsDiv.id = 'hits';
    hitsDiv.textContent = `${translations[currentLanguage].hitsLabel} ${hitsTaken}/${MAX_HITS_ALLOWED}`;
    if (hudElement) {
        hudElement.appendChild(hitsDiv);
    }

    // Event listener voor de taal selector (nu op de parent div)
    document.getElementById('language-selector').addEventListener('click', (e) => {
        // Alleen reageren als er op een SPAN met data-lang wordt geklikt
        if (e.target.tagName === 'SPAN' && e.target.dataset.lang) {
            setLanguage(e.target.dataset.lang);
        }
    });

    // Use the utility function to initialize the Start Game button
    initializeButton('storyline-start-btn', startGame);
    initializeButton('show-leaderboard-btn', showLeaderboard); // Voor een aparte leaderboard knop in de UI, als die er is

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
        alert('Er is een probleem met de game rendering. Probeer de pagina te herladen.');
    }
});