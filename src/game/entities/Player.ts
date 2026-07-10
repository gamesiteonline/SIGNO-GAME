// SIGNO Player Entity
// Developed by Fahad Mohamed

import type { Vector2, Platform, PuzzleElement, InputState, Camera } from '../engine/Types';
import { PHYSICS } from '../engine/Types';
import { Physics } from '../engine/Physics';

export class Player {
  pos: Vector2;
  vel: Vector2 = { x: 0, y: 0 };
  size: Vector2 = { x: 24, y: 48 };
  grounded: boolean = false;
  facing: number = 1; // 1 = right, -1 = left
  isDead: boolean = false;
  isPushing: boolean = false;

  // Animation
  animFrame: number = 0;
  animTimer: number = 0;
  state: 'idle' | 'run' | 'jump' | 'fall' | 'push' | 'die' = 'idle';

  // Image
  private image: HTMLImageElement | null = null;

  // Trail for movement
  trail: { x: number; y: number; alpha: number; life: number }[] = [];

  // Eye glow
  eyeGlow: number = 0.8;

  // Weight and Landing
  private lastGrounded: boolean = true;
  private landingAnim: number = 0;

  // Audio Callbacks
  onJump?: () => void;
  onLand?: () => void;

  // Respawn
  respawnPos: Vector2;

  constructor(x: number, y: number) {
    this.pos = { x, y };
    this.respawnPos = { x, y };
  }

  setImage(img: HTMLImageElement): void {
    this.image = img;
  }

  update(dt: number, input: InputState, platforms: Platform[], puzzles: PuzzleElement[]): void {
    if (this.isDead) {
      this.vel.x *= 0.9;
      this.vel.y *= 0.9;
      this.pos.x += this.vel.x * dt;
      this.pos.y += this.vel.y * dt;
      this.state = 'die';
      return;
    }

    // Detect landing for weight effect
    if (this.grounded && !this.lastGrounded) {
      this.landingAnim = 0.15; // Brief landing "squash"
      this.onLand?.();
    }
    this.lastGrounded = this.grounded;
    if (this.landingAnim > 0) this.landingAnim -= dt;

    // Handle input - More deliberate, momentum-based
    const moveInput = (input.right ? 1 : 0) - (input.left ? 1 : 0);

    if (moveInput !== 0) {
      this.facing = moveInput;
      const speed = this.isPushing ? PHYSICS.PUSH_SPEED : PHYSICS.PLAYER_SPEED;
      
      // Slower acceleration for heavy feel
      const accel = this.grounded ? 800 : 400;

      this.vel.x += moveInput * accel * dt;
      this.vel.x = Physics.clamp(this.vel.x, -speed, speed);
    } else {
      // Natural friction / deceleration
      const friction = this.grounded ? PHYSICS.FRICTION : PHYSICS.AIR_FRICTION;
      this.vel.x *= friction;
    }

    // Jump
    if (input.jump && this.grounded) {
      this.vel.y = PHYSICS.PLAYER_JUMP;
      this.grounded = false;
      this.onJump?.();
    }

    // Variable jump height (improved for gestures)
    if (!input.jump && this.vel.y < -100) {
      this.vel.y *= 0.85;
    }

    // Interaction / push
    this.isPushing = false;
    if (input.action) {
      this.checkPushInteraction(puzzles);
    }

    // Update pushable objects
    for (const puzzle of puzzles) {
      if (puzzle.type === 'box' && puzzle.beingPushed) {
        // Only push if close and aligned
        const dist = Physics.distance(this.pos, {
          x: puzzle.x + puzzle.w / 2,
          y: puzzle.y + puzzle.h / 2
        });
        if (dist > 60 || moveInput === 0 || moveInput !== puzzle.pushDirection) {
          puzzle.beingPushed = false;
          puzzle.pushDirection = undefined;
        }
      }
    }

    // Physics
    Physics.resolveCollision(this, platforms);

    // Update state
    if (!this.grounded) {
      this.state = this.vel.y < 0 ? 'jump' : 'fall';
    } else if (Math.abs(this.vel.x) > 10) {
      this.state = this.isPushing ? 'push' : 'run';
    } else {
      this.state = 'idle';
    }

    // Animation timer
    this.animTimer += dt;
    if (this.animTimer > 0.1) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 8;
    }

    // Trail effect when moving fast
    if (Math.abs(this.vel.x) > 100 && this.grounded) {
      this.trail.push({
        x: this.pos.x,
        y: this.pos.y,
        alpha: 0.3,
        life: 0.3
      });
    }

    // Update trail
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      this.trail[i].alpha = this.trail[i].life / 0.3 * 0.2;
      if (this.trail[i].life <= 0) {
        this.trail.splice(i, 1);
      }
    }

    // Eye glow pulse
    this.eyeGlow = 0.6 + Math.sin(performance.now() / 500) * 0.2;
  }

  checkPushInteraction(puzzles: PuzzleElement[]): void {
    for (const puzzle of puzzles) {
      if (puzzle.type !== 'box') continue;

      const boxCenter = {
        x: puzzle.x + puzzle.w / 2,
        y: puzzle.y + puzzle.h / 2
      };
      const dist = Physics.distance(this.pos, boxCenter);

      if (dist < 50) {
        // Determine push direction
        const dx = boxCenter.x - this.pos.x;
        const dir = dx > 0 ? 1 : -1;

        puzzle.beingPushed = true;
        puzzle.pushDirection = dir;
        this.isPushing = true;
        return;
      }
    }
  }

  die(): void {
    if (this.isDead) return;
    this.isDead = true;
    this.vel.x = (Math.random() - 0.5) * 100;
    this.vel.y = -200;
  }

  respawn(x: number, y: number): void {
    this.isDead = false;
    this.pos.x = x;
    this.pos.y = y;
    this.vel.x = 0;
    this.vel.y = 0;
    this.trail = [];
    this.state = 'idle';
  }

  getCollisionRect() {
    return {
      x: this.pos.x - this.size.x / 2,
      y: this.pos.y - this.size.y,
      w: this.size.x,
      h: this.size.y
    };
  }

  render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    // Render trail
    for (const t of this.trail) {
      ctx.fillStyle = `rgba(0, 0, 0, ${t.alpha})`;
      ctx.fillRect(
        t.x - this.size.x / 2,
        t.y - this.size.y,
        this.size.x,
        this.size.y
      );
    }

    const x = this.pos.x - this.size.x / 2;
    const y = this.pos.y - this.size.y;

    ctx.save();
    
    // Apply landing "squash" effect for weight
    const squash = this.landingAnim > 0 ? 1 + Math.sin(this.landingAnim * 20) * 0.15 : 1;
    const stretch = 1 / squash;
    
    ctx.translate(this.pos.x, this.pos.y);
    ctx.scale(stretch, squash);
    ctx.translate(-this.pos.x, -this.pos.y);

    if (this.image) {
      // Subtle rim light/halo for visibility in dark areas
      const ex1 = this.pos.x + (5 * this.facing);
      const ey1 = this.pos.y - 10;
      
      const glow = ctx.createRadialGradient(ex1, ey1, 0, ex1, ey1, 30);
      glow.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ex1, ey1, 30, 0, Math.PI * 2);
      ctx.fill();

      // Draw sprite image
      ctx.translate(this.pos.x, this.pos.y - this.size.y / 2);
      if (this.facing < 0) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(
        this.image,
        -this.size.x / 2 - 8,
        -this.size.y / 2 - 8,
        this.size.x + 16,
        this.size.y + 16
      );
      ctx.restore();

      // Ensure eyes are always visible even on the sprite path
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${this.eyeGlow})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fff';
      ctx.beginPath();
      ctx.arc(ex1, ey1, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Fallback: draw silhouette
      ctx.fillStyle = '#050505';

      // Body
      ctx.fillRect(x + 4, y + 16, this.size.x - 8, this.size.y - 16);

      // Head
      ctx.beginPath();
      ctx.arc(this.pos.x, y + 12, 10, 0, Math.PI * 2);
      ctx.fill();

      // Hair tufts
      ctx.beginPath();
      ctx.moveTo(this.pos.x - 8, y + 4);
      ctx.lineTo(this.pos.x - 5, y - 4);
      ctx.lineTo(this.pos.x, y + 2);
      ctx.lineTo(this.pos.x + 5, y - 2);
      ctx.lineTo(this.pos.x + 8, y + 4);
      ctx.fill();

      // Procedural Legs - Limbo style (Spidery/Insectoid movement)
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      const renderLeg = (offsetX: number, phase: number) => {
        const time = performance.now() / 1000;
        const anim = this.state === 'run' ? Math.sin(time * 12 + phase) : 0;
        const jumpOffset = this.state === 'jump' ? 10 : (this.state === 'fall' ? -5 : 0);
        
        const legX = this.pos.x + offsetX;
        const legY = this.pos.y - 15;
        
        const footX = legX + (this.state === 'run' ? anim * 15 : 0);
        const footY = this.pos.y + (this.state === 'run' ? -Math.abs(Math.cos(time * 12 + phase)) * 10 : 0) - jumpOffset;

        ctx.beginPath();
        ctx.moveTo(legX, legY);
        // Knee
        const kneeX = legX + (this.state === 'run' ? anim * 5 : 5 * this.facing);
        const kneeY = legY + 10;
        ctx.quadraticCurveTo(kneeX, kneeY, footX, footY);
        ctx.stroke();
      };

      renderLeg(-6, 0);
      renderLeg(6, Math.PI);

      // Arms
      const armSwing = this.state === 'run' ? Math.sin(this.animFrame * 0.8) * 10 : 0;
      ctx.fillRect(x - 2, y + 18 + armSwing, 5, 14);
      ctx.fillRect(x + this.size.x - 3, y + 18 - armSwing, 5, 14);

      // Eye glow - Limbo style
      ctx.fillStyle = `rgba(255, 255, 255, ${this.eyeGlow})`;
      const eyeX1 = this.facing > 0 ? this.pos.x + 2 : this.pos.x - 6;
      const eyeX2 = this.facing > 0 ? this.pos.x + 6 : this.pos.x - 2;
      
      ctx.beginPath();
      ctx.arc(eyeX1, y + 11, 2.5, 0, Math.PI * 2);
      ctx.arc(eyeX2, y + 11, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Eye glow halo - Enhanced for more "soul"
      const drawHalo = (ex: number) => {
        const halo = ctx.createRadialGradient(ex, y + 11, 0, ex, y + 11, 15);
        halo.addColorStop(0, `rgba(255, 255, 255, ${this.eyeGlow * 0.4})`);
        halo.addColorStop(0.3, `rgba(255, 255, 255, ${this.eyeGlow * 0.1})`);
        halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(ex, y + 11, 15, 0, Math.PI * 2);
        ctx.fill();
      };
      drawHalo(eyeX1);
      drawHalo(eyeX2);
    }

    ctx.restore();
  }
}
