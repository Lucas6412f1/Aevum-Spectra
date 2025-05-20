// main.js
// ChronoQuest v0.1.1 First Public Release
// Game title
const gameTitle = 'ChronoQuest';
const gameVersion = '0.1.1';
const gameVersionSuffix = 'Early alpha';
const gameTitleElement = document.getElementById('game-title');
gameTitleElement.textContent = gameTitle;

// Game engine
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    DIALOG: 'dialog',
    LEVEL_COMPLETE: 'level_complete'
};

// Game settings
const TILE_SIZE = 32;
const PLAYER_SPEED = 4;
const ENEMY_SPEED = 2;
const CRYSTAL_SPAWN_RATE = 0.02;
const MAX_CRYSTALS = 8;

// Game state variables
let gameStarted = false;
let currentState = GAME_STATE.MENU;
let score = 0;
let questGoal = 5;
let questProgress = 0;
let questDone = false;
let currentLevel = 1;

// Game objects
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
    portals: []
};

// Keyboard input handling
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// Multi-language support
const translations = {
  nl: {
    welcome: "Welkom bij ChronoQuest!",
    score: "Score",
    level: "Level",
    quest: "Opdracht",
    progress: "Voortgang", 
    version: "Versie",
    startGame: "Start spel",
    versionSuffix: "Vroege alpha",
    questMessage: "Verzamel kristallen en bereik de portaal!",
    questComplete: "Level voltooid!",
    levelComplete: "Level voltooid! Op naar het volgende tijdperk!",
    story: {
      title: "ChronoQuest",
      intro: "In het jaar 2150 ontdek jij, een briljante uitvinder en avonturier, een mysterieuze tijdmachine die verborgen ligt onder de ruïnes van een oude stad. Deze technologie stelt je in staat om door verschillende tijdperken te reizen — van oorlogstijdperken in het verleden tot dystopische toekomstscenario's.",
      conflict: "Maar de tijdlijn is ernstig verstoord. Oorlogen dreigen uit te breken die de toekomst kunnen vernietigen. Duistere krachten manipuleren gebeurtenissen om chaos te zaaien en macht te grijpen.",
      mission: "Jouw missie is helder: stop oorlogen voordat ze beginnen, voorkom rampen en red onschuldige mensen. Elk succes brengt de wereld een stukje dichter bij vrede en een betere toekomst.",
      gameplay: "Met je slimme uitvindingen en moedige acties moet je puzzels oplossen, vijanden slim te slim af zijn en belangrijke keuzes maken die de loop van de geschiedenis veranderen. Alleen jij kunt het tij keren en een betere wereld creëren — één tijdperk tegelijk."
    }
  },
  en: {
    welcome: "Welcome to ChronoQuest!",
    score: "Score",
    level: "Level", 
    quest: "Quest",
    progress: "Progress",
    version: "Version",
    startGame: "Start game",
    versionSuffix: "Early alpha",
    questMessage: "Collect crystals and reach the portal!",
    questComplete: "Level complete!",
    levelComplete: "Level complete! On to the next era!",
    story: {
      title: "ChronoQuest",
      intro: "In the year 2150, you, a brilliant inventor and adventurer, discover a mysterious time machine hidden beneath the ruins of an ancient city. This technology allows you to travel through different eras — from wartorn periods in the past to dystopian future scenarios.",
      conflict: "But the timeline is severely disturbed. Wars threaten to break out that could destroy the future. Dark forces are manipulating events to sow chaos and seize power.",
      mission: "Your mission is clear: stop wars before they begin, prevent disasters, and save innocent people. Each success brings the world one step closer to peace and a better future.",
      gameplay: "With your clever inventions and brave actions, you must solve puzzles, outsmart enemies, and make important choices that change the course of history. Only you can turn the tide and create a better world — one era at a time."
    }
  }
};

let currentLanguage = 'en';

function getCurrentLanguage() {
  return translations[currentLanguage] || translations['nl']; // Fallback to English
}

function setLanguage(lang) {
  if (!translations[lang]) {
    console.warn(`Language ${lang} not found, falling back to English`);
    lang = 'en';
  }
  
  currentLanguage = lang;
  
  // Update all UI elements
  updateGameText();
  updateHUD();
  
  // Update language selector UI
  document.querySelectorAll('#language-selector span').forEach(span => {
    span.classList.toggle('active', span.getAttribute('data-lang') === lang);
  });
}

function updateGameText() {
  const lang = getCurrentLanguage();
  
  // Update title
  const gameTitleElement = document.getElementById('game-title');
  if (gameTitleElement) {
    gameTitleElement.textContent = lang.story.title;
  }
  
  // Update storyline if visible
  if (currentState === GAME_STATE.MENU) {
    updateStorylineContent(currentLanguage);
  }
}

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Center player at start
function resetPlayer() {
    gameObjects.player.x = canvas.width / 2 - gameObjects.player.size / 2;
    gameObjects.player.y = canvas.height / 2 - gameObjects.player.size / 2;
}

function startGame() {
    const storylineElement = document.getElementById('storyline');
    if (storylineElement) {
        storylineElement.style.display = 'none';
    }
    gameStarted = true;
    currentState = GAME_STATE.PLAYING;
    resetPlayer();
    initializeLevel();
    gameLoop();
    updateHUD();
}

function initializeLevel() {
    gameObjects.crystals = [];
    gameObjects.enemies = [];
    gameObjects.portals = [];
    // Add initial crystals
    for (let i = 0; i < 3; i++) {
        spawnCrystal();
    }
    // Add enemies based on level
    for (let i = 0; i < Math.min(currentLevel, 5); i++) {
        spawnEnemy();
    }
    // Add portal
    gameObjects.portals.push({
        x: canvas.width * 0.8,
        y: canvas.height * 0.8,
        size: 48
    });
}

function spawnCrystal() {
    const margin = 100;
    gameObjects.crystals.push({
        x: margin + Math.random() * (canvas.width - margin * 2),
        y: margin + Math.random() * (canvas.height - margin * 2),
        size: 16,
        collected: false
    });
}

function spawnEnemy() {
    gameObjects.enemies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: TILE_SIZE,
        speed: ENEMY_SPEED,
        direction: Math.random() * Math.PI * 2
    });
}

function rectsCollide(a, b) {
    return (
        a.x < b.x + b.size &&
        a.x + a.size > b.x &&
        a.y < b.y + b.size &&
        a.y + a.size > b.y
    );
}

// Tijdperk data
const eras = [
  {
    id: 0,
    name: { nl: 'Prehistorie', en: 'Prehistory' },
    quest: { nl: 'Verzamel 5 kristallen en craft een Tijdkristal!', en: 'Collect 5 crystals and craft a Time Crystal!' },
    requiredCrystals: 5,
    crafted: false
  },
  {
    id: 1,
    name: { nl: 'Toekomst', en: 'Future' },
    quest: { nl: 'Craft een Energiecel en bereik het portaal!', en: 'Craft an Energy Cell and reach the portal!' },
    requiredCrystals: 7,
    crafted: false
  }
];
let selectedEra = 0;

// Tijdmachine UI
function showTimeMachine() {
  currentState = GAME_STATE.DIALOG;
  gameStarted = false;
  const overlay = document.createElement('div');
  overlay.id = 'timemachine-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(10,10,30,0.95)';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '1000';
  overlay.innerHTML = `
    <h2 style="color:#fff;">🕰️ Tijdmachine</h2>
    <div id="era-select" style="margin:20px;">
      ${eras.map((era, i) => `
        <div style="display:inline-block;position:relative;margin:8px;">
          <button data-era="${i}" style="margin:0;padding:12px 24px;font-size:1.1em;position:relative;">
            ${era.name[currentLanguage]}
          </button>
          ${era.crafted && i === selectedEra ? `<span style='position:absolute;top:-18px;right:-8px;background:#2ecc40;color:#fff;font-size:0.95em;padding:2px 10px;border-radius:12px;font-weight:bold;'>${currentLanguage === 'nl' ? 'Level klaar!' : 'Level completed!'}</span>` : ''}
        </div>
      `).join('')}
    </div>
    <div id="era-quest" style="color:#fff;font-size:1.1em;margin-bottom:20px;"></div>
    <button id="start-era" style="padding:10px 30px;font-size:1.1em;">Start</button>
  `;
  document.body.appendChild(overlay);
  // Era select
  document.querySelectorAll('#era-select button').forEach(btn => {
    btn.onclick = e => {
      selectedEra = parseInt(btn.getAttribute('data-era'));
      document.getElementById('era-quest').textContent = eras[selectedEra].quest[currentLanguage];
    };
  });
  // Start era
  document.getElementById('start-era').onclick = () => {
    document.body.removeChild(overlay);
    startEra(selectedEra);
  };
  // Init quest tekst
  document.getElementById('era-quest').textContent = eras[selectedEra].quest[currentLanguage];
}

function startEra(eraId) {
  currentLevel = eraId + 1;
  questGoal = eras[eraId].requiredCrystals;
  questProgress = 0;
  eras[eraId].crafted = false;
  gameStarted = true;
  currentState = GAME_STATE.PLAYING;
  resetPlayer();
  initializeLevel();
  updateHUD();
  gameLoop();
}

// Crafting systeem
function tryCraft() {
  const era = eras[selectedEra];
  if (!era.crafted && questProgress >= era.requiredCrystals) {
    era.crafted = true;
    score += 25;
    updateHUD();
    alert(currentLanguage === 'nl' ? 'Je hebt een item gecraft!' : 'You crafted an item!');
  }
}

// Pas HUD aan voor tijdperk en crafting
function updateHUD() {
  const lang = getCurrentLanguage();
  const era = eras[selectedEra];
  document.getElementById('score').textContent = `${lang.score}: ${score}`;
  document.getElementById('level').textContent = `${lang.level}: ${era.name[currentLanguage]}`;
  document.getElementById('opdracht').textContent = `${lang.quest}: ${era.quest[currentLanguage]}`;
  document.getElementById('voortgang').textContent = `${lang.progress}: ${questProgress}/${era.requiredCrystals}`;
  document.getElementById('versie').textContent = `${lang.version}: ${gameVersion} ${lang.versionSuffix}`;
  // Crafting knop
  let craftBtn = document.getElementById('craft-btn');
  if (!craftBtn) {
    craftBtn = document.createElement('button');
    craftBtn.id = 'craft-btn';
    craftBtn.style.margin = '8px';
    craftBtn.textContent = currentLanguage === 'nl' ? 'Craft item' : 'Craft item';
    craftBtn.onclick = tryCraft;
    document.getElementById('hud').appendChild(craftBtn);
  }
  craftBtn.disabled = era.crafted || questProgress < era.requiredCrystals;
  craftBtn.textContent = era.crafted ? (currentLanguage === 'nl' ? 'Gecraft!' : 'Crafted!') : (currentLanguage === 'nl' ? 'Craft item' : 'Craft item');
}

// Pas portaal logica aan: alleen open als gecraft is
function gameLoop() {
    if (!gameStarted) return;
    updatePlayer();
    updateEnemies();
    // Crystal autospawn
    const activeCrystals = gameObjects.crystals.filter(c => !c.collected).length;
    if (activeCrystals < MAX_CRYSTALS && Math.random() < CRYSTAL_SPAWN_RATE) {
        spawnCrystal();
    }
    // Crystals
    gameObjects.crystals.forEach(crystal => {
        if (!crystal.collected && rectsCollide(gameObjects.player, crystal)) {
            crystal.collected = true;
            questProgress++;
            score += 10;
            updateHUD();
        }
    });
    // Enemies
    gameObjects.enemies.forEach(enemy => {
        if (rectsCollide(gameObjects.player, enemy)) {
            resetPlayer();
            questProgress = Math.max(0, questProgress - 1);
            score = Math.max(0, score - 5);
            updateHUD();
        }
    });
    // Portal: alleen als gecraft is
    if (eras[selectedEra].crafted) {
        gameObjects.portals.forEach(portal => {
            if (rectsCollide(gameObjects.player, portal)) {
                // Voltooi era of ga naar tijdmachine
                if (selectedEra < eras.length - 1) {
                    // Groen label tonen
                    showCompletedLabel();
                    setTimeout(showTimeMachine, 1200); // delay zodat label zichtbaar is
                } else {
                    alert(currentLanguage === 'nl' ? 'Je hebt het spel uitgespeeld!' : 'You finished the game!');
                    location.reload();
                }
                gameStarted = false;
            }
        });
    }
    drawGame();
    requestAnimationFrame(gameLoop);
}

function updatePlayer() {
    let dx = 0, dy = 0;
    if (keys['ArrowLeft'] || keys['a']) dx -= gameObjects.player.speed;
    if (keys['ArrowRight'] || keys['d']) dx += gameObjects.player.speed;
    if (keys['ArrowUp'] || keys['w']) dy -= gameObjects.player.speed;
    if (keys['ArrowDown'] || keys['s']) dy += gameObjects.player.speed;
    const newX = gameObjects.player.x + dx;
    const newY = gameObjects.player.y + dy;
    if (newX >= 0 && newX <= canvas.width - gameObjects.player.size) {
        gameObjects.player.x = newX;
    }
    if (newY >= 0 && newY <= canvas.height - gameObjects.player.size) {
        gameObjects.player.y = newY;
    }
}

function updateEnemies() {
    gameObjects.enemies.forEach(enemy => {
        enemy.x += Math.cos(enemy.direction) * enemy.speed;
        enemy.y += Math.sin(enemy.direction) * enemy.speed;
        if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.size) {
            enemy.direction = Math.PI - enemy.direction;
        }
        if (enemy.y <= 0 || enemy.y >= canvas.height - enemy.size) {
            enemy.direction = -enemy.direction;
        }
    });
}

function drawGame() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw player
    ctx.fillStyle = 'blue';
    ctx.fillRect(gameObjects.player.x, gameObjects.player.y, gameObjects.player.size, gameObjects.player.size);
    // Draw crystals
    ctx.fillStyle = 'yellow';
    gameObjects.crystals.forEach(crystal => {
        if (!crystal.collected) {
            ctx.fillRect(crystal.x, crystal.y, crystal.size, crystal.size);
        }
    });
    // Draw enemies
    ctx.fillStyle = 'red';
    gameObjects.enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
    });
    // Draw portal
    ctx.fillStyle = 'purple';
    gameObjects.portals.forEach(portal => {
        ctx.fillRect(portal.x, portal.y, portal.size, portal.size);
    });
}

function updateStorylineContent(lang) {
    const content = translations[lang].story;
    const storylineContent = document.getElementById('storyline-content');
    
    if (storylineContent) {
        storylineContent.innerHTML = `
            <h1><strong>${content.title}</strong></h1>
            <p>${content.intro}</p>
            <p>${content.conflict}</p>
            <p>${content.mission}</p>
            <p>${content.gameplay}</p>
            <button onclick="startGame()">${translations[lang].startGame}</button>
        `;
    }
}

// Groen label tonen bij het voltooien van een tijdperk
function showCompletedLabel() {
    let label = document.createElement('div');
    label.textContent = currentLanguage === 'nl' ? 'Level klaar!' : 'Level completed!';
    label.style.position = 'fixed';
    label.style.top = '40%';
    label.style.left = '50%';
    label.style.transform = 'translate(-50%, -50%)';
    label.style.background = '#2ecc40';
    label.style.color = '#fff';
    label.style.fontSize = '2em';
    label.style.fontWeight = 'bold';
    label.style.padding = '24px 48px';
    label.style.borderRadius = '16px';
    label.style.boxShadow = '0 4px 24px #0008';
    label.style.zIndex = '2000';
    label.style.opacity = '0.95';
    document.body.appendChild(label);
    setTimeout(() => label.remove(), 1000);
}

// Start standaard in het menu, niet direct in tijdmachine UI
window.onload = function() {
  // Toon het storyline scherm zoals voorheen
  updateStorylineContent(currentLanguage);
};
