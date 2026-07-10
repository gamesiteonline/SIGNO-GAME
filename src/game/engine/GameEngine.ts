// SIGNO Main Game Engine
// Developed by Fahad Mohamed
// Overhauled with Splash Screen support and LIMBO Enemies

import type {
  Camera, LevelData, Platform, Hazard, PuzzleElement,
  Collectible, GameState, InputState,
} from './Types';
import { Physics } from './Physics';
import { Player } from '../entities/Player';
import { ParticleSystem } from '../effects/ParticleSystem';
import { LightingEngine } from '../effects/Lighting';
import { GestureController } from './GestureController';

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number = 0;
  height: number = 0;

  camera: Camera = {
    x: 0, y: 0, targetX: 0, targetY: 0,
    zoom: 1, shakeIntensity: 0, shakeDecay: 0.9
  };

  state: GameState = {
    screen: 'splash',
    currentLevel: 0,
    deaths: 0,
    collectiblesFound: 0,
    totalCollectibles: 0,
    timeElapsed: 0,
    secretsFound: 0,
  };

  input: InputState = {
    left: false, right: false, up: false, down: false,
    jump: false, action: false, pause: false,
  };

  player!: Player;
  platforms: Platform[] = [];
  hazards: Hazard[] = [];
  puzzles: PuzzleElement[] = [];
  collectibles: Collectible[] = [];
  particles: ParticleSystem;
  lighting: LightingEngine;

  currentLevelData: LevelData | null = null;
  bgImages: Map<string, HTMLImageElement> = new Map();
  parallaxImages: Map<string, HTMLImageElement> = new Map();
  playerImage: HTMLImageElement | null = null;

  animFrameId: number = 0;
  lastTime: number = 0;
  running: boolean = false;
  levelTransitionTimer: number = 0;
  deathTimer: number = 0;

  onStateChange?: (state: GameState) => void;
  onDeath?: () => void;
  onCollectible?: (type: string) => void;

  filmGrainCanvas: HTMLCanvasElement | null = null;
  filmGrainCtx: CanvasRenderingContext2D | null = null;
  gestureController: GestureController;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.particles = new ParticleSystem();
    this.lighting = new LightingEngine();
    this.gestureController = new GestureController(this.canvas, this.input);
    this.resize();
    this.setupFilmGrain();

    // Load professional parallax assets
    this.loadParallaxAsset('deep', '/assets/parallax-bg-deep.png');
    this.loadParallaxAsset('mid', '/assets/parallax-bg-mid.png');
    this.loadParallaxAsset('fg', '/assets/parallax-fg.png');
  }

  private loadParallaxAsset(key: string, src: string): void {
    const img = new Image();
    img.src = src;
    img.onload = () => this.parallaxImages.set(key, img);
  }

  setupFilmGrain(): void {
    this.filmGrainCanvas = document.createElement('canvas');
    this.filmGrainCanvas.width = 256;
    this.filmGrainCanvas.height = 256;
    this.filmGrainCtx = this.filmGrainCanvas.getContext('2d');
    this.generateFilmGrain();
  }

  generateFilmGrain(): void {
    if (!this.filmGrainCtx) return;
    const imgData = this.filmGrainCtx.createImageData(256, 256);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = Math.random() * 30; // Reduced for clarity
      imgData.data[i] = v;
      imgData.data[i + 1] = v;
      imgData.data[i + 2] = v;
      imgData.data[i + 3] = 10; // Reduced for clarity
    }
    this.filmGrainCtx.putImageData(imgData, 0, 0);
  }

  resize(): void {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.width = parent.clientWidth;
      this.height = parent.clientHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }

  setScreen(screen: 'splash' | 'title' | 'playing' | 'paused' | 'dead' | 'level-complete' | 'credits'): void {
    this.state.screen = screen;
    this.onStateChange?.(this.state);
  }

  async loadLevel(levelData: LevelData): Promise<void> {
    this.currentLevelData = levelData;
    this.state.currentLevel = levelData.id;
    this.state.totalCollectibles = levelData.collectibles.length;

    if (!this.bgImages.has(levelData.background)) {
      await this.loadImage(levelData.background);
    }

    // Preserve callbacks
    const oldOnJump = this.player?.onJump;
    const oldOnLand = this.player?.onLand;

    this.player = new Player(levelData.playerStart.x, levelData.playerStart.y);
    if (oldOnJump) this.player.onJump = oldOnJump;
    if (oldOnLand) this.player.onLand = oldOnLand;

    if (!this.playerImage) {
      this.playerImage = await this.loadImageToElement('/assets/player-idle.png');
    }
    
    this.platforms = levelData.platforms.map(p => ({ ...p }));
    this.hazards = levelData.hazards.map(h => ({ ...h }));
    this.puzzles = levelData.puzzles.map(p => ({ ...p }));
    this.collectibles = levelData.collectibles.map(c => ({ ...c }));

    this.camera.x = levelData.playerStart.x;
    this.camera.y = levelData.playerStart.y;
    this.camera.targetX = levelData.playerStart.x;
    this.camera.targetY = levelData.playerStart.y;

    this.lighting.setupForLevel(levelData);
    this.particles.setupForLevel(levelData);

    this.deathTimer = 0;
    this.levelTransitionTimer = 0;
  }

  loadImage(src: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.bgImages.set(src, img);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });
  }

  loadImageToElement(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img);
      img.src = src;
    });
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  gameLoop = (time: number): void => {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    if (this.state.screen === 'playing') {
      this.update(dt);
    }

    this.render();
    this.animFrameId = requestAnimationFrame(this.gameLoop);
  };

  update(dt: number): void {
    this.state.timeElapsed += dt;
    this.gestureController.update();
    this.player.update(dt, this.input, this.platforms, this.puzzles);
    this.checkHazardCollisions();
    this.checkCollectibleCollisions();
    this.updatePuzzles(dt);
    this.checkExit();
    this.updateCamera(dt);
    this.particles.update(dt, this.currentLevelData || undefined);
    this.lighting.update(dt, this.player.pos);
    // Trigger any randomized audio updates
    // (Note: AudioManager is handled in Game.tsx, but we could trigger it here if passed)

    if (this.player.isDead) {
      this.deathTimer += dt;
      if (this.deathTimer > 1.5) {
        this.respawn();
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updatePuzzles(_dt: number): void {
    // Basic puzzle logic
  }

  checkHazardCollisions(): void {
    if (this.player.isDead) return;
    const playerRect = this.player.getCollisionRect();
    for (const hazard of this.hazards) {
      if (!hazard.active) continue;
      const hazardRect = { x: hazard.x, y: hazard.y, w: hazard.w, h: hazard.h };
      if (Physics.checkRectCollision(playerRect, hazardRect)) {
        this.killPlayer();
        return;
      }
    }
  }

  checkCollectibleCollisions(): void {
    for (const collectible of this.collectibles) {
      if (collectible.collected) continue;
      const dist = Physics.distance(this.player.pos, { x: collectible.x, y: collectible.y });
      if (dist < 40) {
        collectible.collected = true;
        this.state.collectiblesFound++;
        this.onCollectible?.(collectible.type);
      }
    }
  }



  checkExit(): void {
    if (!this.currentLevelData) return;
    const exit = this.currentLevelData.exitDoor;
    const dist = Physics.distance(this.player.pos, exit);
    if (dist < 60) {
      this.state.screen = 'level-complete';
      this.onStateChange?.(this.state);
    }
  }

  killPlayer(): void {
    if (this.player.isDead) return;
    this.player.die();
    this.state.deaths++;
    this.camera.shakeIntensity = 25; // Violent death shake
    // Add death effect particles
    this.particles.emitDeathEffect(this.player.pos.x, this.player.pos.y - 10);
    this.particles.emitDeathEffect(this.player.pos.x, this.player.pos.y);
    this.onDeath?.();
    this.onDeath?.();
  }

  respawn(): void {
    if (!this.currentLevelData) return;
    this.player.respawn(this.currentLevelData.playerStart.x, this.currentLevelData.playerStart.y);
    this.deathTimer = 0;
  }

  updateCamera(dt: number): void {
    this.camera.targetX = this.player.pos.x;
    this.camera.targetY = this.player.pos.y - 50;
    
    // Zoom out slightly based on speed
    const targetZoom = Math.abs(this.player.vel.x) > 100 ? 0.95 : 1.0;
    this.camera.zoom = Physics.lerp(this.camera.zoom, targetZoom, 0.05);

    const lerpFactor = 1 - Math.pow(0.005, dt); // Smoother follow
    this.camera.x = Physics.lerp(this.camera.x, this.camera.targetX, lerpFactor);
    this.camera.y = Physics.lerp(this.camera.y, this.camera.targetY, lerpFactor);

    // Apply Screen Shake
    if (this.camera.shakeIntensity > 0) {
      this.camera.x += (Math.random() - 0.5) * this.camera.shakeIntensity;
      this.camera.y += (Math.random() - 0.5) * this.camera.shakeIntensity;
      this.camera.shakeIntensity *= this.camera.shakeDecay;
      if (this.camera.shakeIntensity < 0.1) this.camera.shakeIntensity = 0;
    }
  }

  render(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Base background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);

    if (this.state.screen === 'splash' || this.state.screen === 'title') return;
    if (!this.currentLevelData) return;

    // --- PROFESSIONAL PARALLAX LAYERS ---
    
    // Deepest Background (Layer 5)
    this.renderTextureAsset(ctx, 'deep', 0.05, 0.4, 15);
    
    // Mid Background (Layer 3)
    this.renderTextureAsset(ctx, 'mid', 0.2, 0.7, 5);

    // --- GAMEPLAY PLANE ---
    ctx.save();
    
    // Apply dynamic zoom
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    this.renderPlatforms(ctx);
    this.renderHazards(ctx);
    this.renderPlayer(ctx);
    this.particles.render(ctx, this.camera);

    ctx.restore();

    // Foreground (Layer 0)
    this.renderTextureAsset(ctx, 'fg', 1.5, 1.0, 4);

    this.lighting.render(ctx, w, h, this.camera);
    this.renderVignette(ctx, w, h);
  }

  private renderTextureAsset(
    ctx: CanvasRenderingContext2D, 
    key: string, 
    speed: number, 
    opacity: number, 
    blur: number
  ): void {
    const img = this.parallaxImages.get(key);
    if (!img) return;

    const w = this.width;
    const h = this.height;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    if (blur > 0) ctx.filter = `blur(${blur}px)`;

    const offsetX = -(this.camera.x * speed) % w;
    
    // Draw twice for seamless tiling
    ctx.drawImage(img, offsetX, 0, w, h);
    ctx.drawImage(img, offsetX + w, 0, w, h);
    if (offsetX > 0) ctx.drawImage(img, offsetX - w, 0, w, h);
    
    ctx.restore();
  }



  renderPlatforms(ctx: CanvasRenderingContext2D): void {
    const time = performance.now() / 1000;
    for (const p of this.platforms) {
      // High contrast silhouette look
      ctx.fillStyle = '#050505';
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Render Interactive Grass on top of platforms
      if (p.h > 10) {
        ctx.fillStyle = '#000';
        for (let gx = p.x; gx < p.x + p.w; gx += 8) {
          const distToPlayer = Math.abs(gx - this.player.pos.x);
          const sway = Math.sin(time * 2 + gx * 0.1) * 3;
          const interact = distToPlayer < 30 ? (gx - this.player.pos.x) * 0.5 : 0;
          
          ctx.beginPath();
          ctx.moveTo(gx, p.y);
          ctx.lineTo(gx + sway + interact, p.y - 12 - Math.sin(gx) * 5);
          ctx.lineTo(gx + 4, p.y);
          ctx.fill();
        }
      }

      // Subtle edge for definition
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.w, p.y);
      ctx.stroke();
    }
  }

  renderHazards(ctx: CanvasRenderingContext2D): void {
    const time = performance.now() / 1000;
    for (const h of this.hazards) {
      if (h.type === 'spider') {
        this.renderSpider(ctx, h, time);
      } else if (h.type === 'creature') {
        this.renderCreature(ctx, h, time);
      } else if (h.type === 'saw') {
        this.renderSaw(ctx, h, time);
      } else {
        ctx.fillStyle = '#111';
        ctx.fillRect(h.x, h.y, h.w, h.h);
      }
    }
  }

  renderSpider(ctx: CanvasRenderingContext2D, h: Hazard, time: number): void {
    const x = h.x + h.w / 2;
    const y = h.y + h.h / 2;
    const size = h.w / 2;

    // Body
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (8 tiny glowing eyes)
    const eyeGlow = 0.5 + Math.sin(time * 3) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${eyeGlow})`;
    for (let i = 0; i < 8; i++) {
      const ex = x - 10 + (i % 4) * 6;
      const ey = y - 5 + Math.floor(i / 4) * 6;
      ctx.beginPath();
      ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Procedural Legs
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1;
      
      // Leg animation
      const animOffset = time * 4 + (i * 0.5);
      const kneeX = x + side * (size + 20 + Math.sin(animOffset) * 10);
      const kneeY = y - (20 + Math.cos(animOffset) * 15);
      
      const footX = x + side * (size + 40 + Math.sin(animOffset + 0.5) * 20);
      const footY = y + size + 10 + Math.cos(animOffset) * 5;

      ctx.beginPath();
      ctx.moveTo(x + side * size * 0.8, y);
      ctx.quadraticCurveTo(kneeX, kneeY, footX, footY);
      ctx.stroke();
    }
  }

  renderCreature(ctx: CanvasRenderingContext2D, h: Hazard, time: number): void {
    ctx.fillStyle = '#000';
    const bob = Math.sin(time * 3) * 10;
    ctx.beginPath();
    ctx.arc(h.x + h.w / 2, h.y + h.h / 2 + bob, h.w / 2, 0, Math.PI * 2);
    ctx.fill();
    // Glowing eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(h.x + h.w / 2, h.y + h.h / 2 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  renderSaw(ctx: CanvasRenderingContext2D, h: Hazard, time: number): void {
    ctx.save();
    ctx.translate(h.x + h.w / 2, h.y + h.h / 2);
    ctx.rotate(time * 10);
    ctx.fillStyle = '#111';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const r = i % 2 === 0 ? h.w / 2 : h.w / 3;
      const a = (i / 12) * Math.PI * 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.fill();
    ctx.restore();
  }

  renderPlayer(ctx: CanvasRenderingContext2D): void {
    if (!this.player.isDead || this.deathTimer < 0.5) {
      this.player.render(ctx, this.camera);
    }
  }

  renderVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const grad = ctx.createRadialGradient(w / 2, h / 2, w / 3, w / 2, h / 2, w / 1.2);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.6)'); // Lighter vignette
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  getState(): GameState {
    return this.state;
  }
}
