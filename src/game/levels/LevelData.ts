// SIGNO Level Definitions
// Developed by Fahad Mohamed
// Overhauled with 20 Intensive LIMBO-style Stages

import type { LevelData } from '../engine/Types';

const generateLevel = (id: number): LevelData => {
  const themes = ['forest', 'cave', 'industrial', 'graveyard', 'void'];
  const theme = themes[id % themes.length];
  const names = [
    'The Edge of Darkness', 'Whispers of Iron', 'Beneath the Surface', 'Echoes of the Past', 'The Silent Void',
    'Shadows of the Canopy', 'Mechanical Heart', 'Abyssal Chasm', 'Forgotten Rituals', 'Entropy',
    'The Spider\'s Den', 'Steam and Sorrow', 'Crystal Silence', 'Grave Desecration', 'Singularity',
    'Twilight Woods', 'Iron Cathedral', 'Deep Echo', 'The Final Rest', 'Beyond the Veil'
  ];

  return {
    id,
    name: names[id - 1] || `Stage ${id}`,
    subtitle: `Chapter ${id}`,
    theme: theme as any,
    background: `/assets/bg-${theme}.jpg`,
    fogColor: '#050505',
    fogDensity: 0.3 + (id * 0.01),
    gravity: 2400,
    playerStart: { x: 100, y: 500 },
    width: 4000 + (id * 500), // Very long stages
    height: 1000,
    ambientParticles: theme === 'industrial' ? 'spark' : 'dust',
    exitDoor: { x: 3800 + (id * 500), y: 500 },
    parallaxLayers: [
      { image: '', speed: 0.05, opacity: 0.4 },
      { image: '', speed: 0.1, opacity: 0.5 },
      { image: '', speed: 0.2, opacity: 0.7 },
      { image: '', speed: 0.4, opacity: 0.9 },
      { image: '', speed: 1.5, opacity: 1.0 }
    ],
    platforms: [
      { id: `g1-${id}`, x: 0, y: 600, w: 600, h: 400, type: 'solid' },
      { id: `g2-${id}`, x: 800, y: 650, w: 1000, h: 400, type: 'solid' },
      { id: `g3-${id}`, x: 2000, y: 550, w: 800, h: 450, type: 'solid' },
      { id: `g4-${id}`, x: 3000, y: 600, w: 2000 + (id * 500), h: 400, type: 'solid' },
    ],
    hazards: [
      // Limbo style enemies (represented as types for engine to render)
      { id: `spider-${id}`, x: 1200, y: 550, w: 80, h: 80, type: 'spider', active: true },
      { id: `creature-${id}`, x: 2500, y: 450, w: 60, h: 60, type: 'creature', active: true, cycleTime: 4 },
      { id: `saw-${id}`, x: 3200, y: 500, w: 100, h: 100, type: 'saw', active: true },
      { id: `spikes-${id}`, x: 600, y: 600, w: 200, h: 20, type: 'spikes', active: true },
    ],
    puzzles: [
      { id: `box-${id}`, x: 1000, y: 560, w: 40, h: 40, type: 'box', activated: false, mass: 1 },
    ],
    collectibles: [
      { id: `rune-${id}`, x: 1500, y: 400, type: 'signo-rune', collected: false, glowIntensity: 1 },
    ]
  };
};

export const LEVELS: LevelData[] = Array.from({ length: 20 }, (_, i) => generateLevel(i + 1));
