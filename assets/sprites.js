// Game sprites and animations
const SPRITES = {
    player: {
        idle: [0, 0, 32, 32],
        walking: [
            [32, 0, 32, 32],
            [64, 0, 32, 32],
            [96, 0, 32, 32]
        ]
    },
    crystal: {
        idle: [0, 32, 16, 16],
        collected: [
            [16, 32, 16, 16],
            [32, 32, 16, 16],
            [48, 32, 16, 16]
        ]
    },
    enemy: {
        idle: [0, 48, 32, 32],
        moving: [
            [32, 48, 32, 32],
            [64, 48, 32, 32]
        ]
    },
    portal: {
        active: [
            [0, 80, 48, 48],
            [48, 80, 48, 48],
            [96, 80, 48, 48]
        ]
    }
};

// Load game assets
const gameAssets = new Image();
gameAssets.src = 'assets/spritesheet.png';
