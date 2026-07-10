// SIGNO Game Engine - Core Types
// Developed by Fahad Mohamed

export default {};

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Entity {
  id: string;
  pos: Vector2;
  vel: Vector2;
  size: Vector2;
  grounded: boolean;
  active: boolean;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D, camera: Camera): void;
}

export interface Camera {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  zoom: number;
  shakeIntensity: number;
  shakeDecay: number;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'solid' | 'one-way' | 'movable' | 'crumbling';
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
  moveOffset?: number;
  crumbleTimer?: number;
  crumbling?: boolean;
  originalX?: number;
  originalY?: number;
}

export interface Hazard {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'spikes' | 'saw' | 'water' | 'crusher' | 'laser' | 'electro' | 'spider' | 'creature';
  active: boolean;
  cycleTime?: number;
  cycleOffset?: number;
  damage?: number;
}

export interface PuzzleElement {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'box' | 'switch' | 'lever' | 'platform' | 'door' | 'rope' | 'magnet';
  activated: boolean;
  targetId?: string;
  mass?: number;
  beingPushed?: boolean;
  pushDirection?: number;
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  type: 'firefly' | 'secret' | 'signo-rune';
  collected: boolean;
  glowIntensity: number;
}

export interface LevelData {
  id: number;
  name: string;
  subtitle: string;
  theme: 'forest' | 'industrial' | 'cave' | 'graveyard' | 'void';
  background: string;
  fogColor: string;
  fogDensity: number;
  gravity: number;
  playerStart: Vector2;
  platforms: Platform[];
  hazards: Hazard[];
  puzzles: PuzzleElement[];
  collectibles: Collectible[];
  width: number;
  height: number;
  parallaxLayers: ParallaxLayer[];
  ambientParticles: string;
  exitDoor: Vector2;
}

export interface ParallaxLayer {
  image: string;
  speed: number;
  opacity: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: 'dust' | 'fog' | 'spark' | 'water' | 'firefly' | 'death' | 'leaf' | 'rain';
}

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
  flicker: boolean;
  flickerSpeed: number;
}

export interface GameState {
  screen: 'splash' | 'title' | 'playing' | 'paused' | 'dead' | 'level-complete' | 'credits';
  currentLevel: number;
  deaths: number;
  collectiblesFound: number;
  totalCollectibles: number;
  timeElapsed: number;
  secretsFound: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  action: boolean;
  pause: boolean;
}

export interface AudioState {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

export const PHYSICS = {
  GRAVITY: 2400, // Heavier gravity
  TERMINAL_VELOCITY: 1500,
  PLAYER_SPEED: 160, // Slower, deliberate movement
  PLAYER_JUMP: -620, // Stronger jump to fight heavy gravity
  PLAYER_AIR_CONTROL: 0.4, // Less air control = more momentum-based
  FRICTION: 0.7, // More drag when stopping
  AIR_FRICTION: 0.98, // Retain more momentum in air
  PUSH_SPEED: 80, // Heavy pushing
  WATER_GRAVITY: 800,
  WATER_JUMP: -400,
  WATER_SPEED: 100,
} as const;

export const TILE = {
  SIZE: 40,
} as const;
