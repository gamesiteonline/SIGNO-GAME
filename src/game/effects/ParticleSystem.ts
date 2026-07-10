// SIGNO Particle System
// Developed by Fahad Mohamed
// Enhanced with advanced visual effects

import type { Particle, LevelData, Camera } from '../engine/Types';

export class ParticleSystem {
  particles: Particle[] = [];
  maxParticles: number = 800; // Increased for richer effects
  private lastEmitTime: number = 0;
  private readonly EmitInterval: number = 50; // ms

  setupForLevel(level: LevelData): void {
    this.particles = [];
    // Pre-populate with ambient particles based on theme
    const ambientCount = level.theme === 'cave' ? 80 : level.theme === 'forest' ? 60 : 40;
    for (let i = 0; i < ambientCount; i++) {
      this.emitAmbientParticle(level);
    }
  }

  private emitAmbientParticle(level: LevelData): void {
    switch (level.theme) {
      case 'forest':
        this.emit({
          x: Math.random() * (level.width * 1.2) - level.width * 0.1,
          y: Math.random() * level.height,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 8 + Math.random() * 12,
          maxLife: 20,
          size: 0.5 + Math.random() * 1.5,
          color: `rgba(${100 + Math.random() * 100}, ${150 + Math.random() * 100}, ${100 + Math.random() * 100}, ${0.1 + Math.random() * 0.2})`,
          alpha: 0.1 + Math.random() * 0.2,
          type: 'leaf'
        });
        break;
      case 'cave':
        this.emit({
          x: Math.random() * (level.width * 1.2) - level.width * 0.1,
          y: Math.random() * level.height,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 10 + Math.random() * 15,
          maxLife: 25,
          size: 0.5 + Math.random() * 2,
          color: `rgba(${150 + Math.random() * 100}, ${200 + Math.random() * 50}, ${255}, ${0.1 + Math.random() * 0.3})`,
          alpha: 0.15 + Math.random() * 0.25,
          type: 'spark'
        });
        break;
      case 'industrial':
        this.emit({
          x: Math.random() * (level.width * 1.2) - level.width * 0.1,
          y: Math.random() * level.height,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 6 + Math.random() * 10,
          maxLife: 16,
          size: 0.5 + Math.random() * 1.5,
          color: `rgba(${200 + Math.random() * 50}, ${150 + Math.random() * 50}, ${100 + Math.random() * 50}, ${0.1 + Math.random() * 0.2})`,
          alpha: 0.1 + Math.random() * 0.2,
          type: 'smoke'
        });
        break;
      case 'graveyard':
        this.emit({
          x: Math.random() * (level.width * 1.2) - level.width * 0.1,
          y: Math.random() * level.height,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 8 + Math.random() * 12,
          maxLife: 18,
          size: 0.5 + Math.random() * 2,
          color: `rgba(${200}, ${200}, ${220}, ${0.1 + Math.random() * 0.2})`,
          alpha: 0.1 + Math.random() * 0.2,
          type: 'fog'
        });
        break;
      case 'void':
        this.emit({
          x: Math.random() * (level.width * 1.2) - level.width * 0.1,
          y: Math.random() * level.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 12 + Math.random() * 18,
          maxLife: 30,
          size: 0.5 + Math.random() * 2,
          color: `rgba(${200 + Math.random() * 55}, ${200 + Math.random() * 55}, ${220 + Math.random() * 35}, ${0.1 + Math.random() * 0.2})`,
          alpha: 0.1 + Math.random() * 0.2,
          type: 'void_particle'
        });
        break;
      default:
        this.emitAmbientDust(level);
    }
  }

  private emitAmbientDust(level: LevelData): void {
    this.emit({
      x: Math.random() * level.width,
      y: Math.random() * level.height,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 4 + Math.random() * 8,
      maxLife: 12,
      size: 0.5 + Math.random() * 1.5,
      color: 'rgba(255, 255, 255, 0.15)',
      alpha: 0.1,
      type: 'dust'
    });
  }

  emit(particle: Particle): void {
    // Rate limiting for performance
    const now = Date.now();
    if (now - this.lastEmitTime < this.EmitInterval && this.particles.length > 100) {
      return;
    }
    this.lastEmitTime = now;

    if (this.particles.length >= this.maxParticles) {
      // Remove oldest particles instead of just shifting
      this.particles.splice(0, Math.floor(this.particles.length * 0.1));
    }
    this.particles.push(particle);
  }

  emitBurst(x: number, y: number, count: number, type: Particle['type'], color: string, options: { speed?: number; gravity?: boolean; decay?: number } = {}): void {
    const { speed = 100, gravity = true, decay = 0.95 } = options;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const particleSpeed = speed + Math.random() * 50;
      this.emit({
        x, y,
        vx: Math.cos(angle) * particleSpeed,
        vy: Math.sin(angle) * particleSpeed - (gravity ? 30 : 0),
        life: 0.3 + Math.random() * 0.7,
        maxLife: 1,
        size: 0.5 + Math.random() * 1.5,
        color,
        alpha: 0.4 + Math.random() * 0.4,
        type
      });
    }
  }

  emitDeathEffect(x: number, y: number): void {
    // Blood splatter effect
    this.emitBurst(x, y, 15, 'death', '#8b0000', { speed: 200, gravity: true, decay: 0.9 });
    // Smoke particles
    this.emitBurst(x, y + 20, 8, 'smoke', '#444444', { speed: 50, gravity: false, decay: 0.95 });
    // Debris
    this.emitBurst(x, y, 5, 'dust', '#666666', { speed: 100, gravity: true, decay: 0.92 });
  }

  emitLandingEffect(x: number, y: number): void {
    // Dust kickup
    this.emitBurst(x, y, 8, 'dust', '#ffffff', { speed: 150, gravity: true });
    // Small sparks
    this.emitBurst(x, y, 5, 'spark', '#ffffcc', { speed: 100, gravity: true });
  }

  emitJumpEffect(x: number, y: number): void {
    // Foot puff
    this.emitBurst(x, y + 10, 3, 'dust', '#ffffff', { speed: 50, gravity: true });
  }

  update(dt: number, level?: LevelData): void {
    // Emit ambient particles based on level theme with better distribution
    if (level && Math.random() < 0.15) {
      this.emitAmbientParticle(level);
    }

    // Enhanced weather effects
    if (level) {
      switch (level.theme) {
        case 'forest':
          // Occasional falling leaves
          if (Math.random() < 0.02) {
            this.emit({
              x: Math.random() * (level.width * 1.2) - level.width * 0.1,
              y: -20,
              vx: (Math.random() - 0.5) * 20,
              vy: 50 + Math.random() * 30,
              life: 3 + Math.random() * 4,
              maxLife: 7,
              size: 1 + Math.random() * 2,
              color: `rgba(${100 + Math.random() * 100}, ${50 + Math.random() * 100}, ${20 + Math.random() * 50}, 0.8)`,
              alpha: 0.7,
              type: 'leaf'
            });
          }
          // Fireflies in forest areas
          if (Math.random() < 0.03) {
            this.emit({
              x: Math.random() * (level.width * 1.2) - level.width * 0.1,
              y: Math.random() * (level.height * 0.8) + level.height * 0.1,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              life: 2 + Math.random() * 3,
              maxLife: 5,
              size: 0.5 + Math.random() * 1,
              color: `rgba(${100 + Math.random() * 155}, ${200 + Math.random() * 55}, ${100 + Math.random() * 155}, ${0.5 + Math.random() * 0.5})`,
              alpha: 0.3 + Math.random() * 0.4,
              type: 'firefly'
            });
          }
          break;
        case 'cave':
          // Dripping water particles
          if (Math.random() < 0.015) {
            this.emit({
              x: Math.random() * (level.width * 1.2) - level.width * 0.1,
              y: -10,
              vx: (Math.random() - 0.5) * 5,
              vy: 100 + Math.random() * 100,
              life: 1.5,
              maxLife: 1.5,
              size: 0.8 + Math.random() * 0.7,
              color: 'rgba(180, 220, 255, 0.7)',
              alpha: 0.5,
              type: 'water'
            });
          }
          break;
        case 'industrial':
          // Sparks from machinery
          if (Math.random() < 0.01) {
            this.emit({
              x: Math.random() * (level.width * 1.2) - level.width * 0.1,
              y: Math.random() * level.height * 0.3 + level.height * 0.1,
              vx: (Math.random() - 0.5) * 100,
              vy: (Math.random() - 0.5) * 100,
              life: 0.2,
              maxLife: 0.2,
              size: 0.5 + Math.random() * 1.5,
              color: 'rgba(255, 180, 100, 0.9)',
              alpha: 0.8,
              type: 'spark'
            });
          }
          break;
        case 'graveyard':
          // Mist particles
          if (Math.random() < 0.02) {
            this.emit({
              x: Math.random() * (level.width * 1.2) - level.width * 0.1,
              y: Math.random() * level.height,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              life: 4 + Math.random() * 6,
              maxLife: 10,
              size: 1 + Math.random() * 2,
              color: 'rgba(200, 200, 220, 0.3)',
              alpha: 0.2,
              type: 'fog'
            });
          }
          break;
        case 'void':
          // Distant stars/particles
          if (Math.random() < 0.005) {
            this.emit({
              x: Math.random() * (level.width * 1.5) - level.width * 0.25,
              y: Math.random() * (level.height * 1.5) - level.height * 0.25,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              life: 5 + Math.random() * 10,
              maxLife: 15,
              size: 0.3 + Math.random() * 0.7,
              color: `rgba(${150 + Math.random() * 100}, ${150 + Math.random() * 100}, ${200 + Math.random() * 55}, ${0.05 + Math.random() * 0.15})`,
              alpha: 0.05 + Math.random() * 0.1,
              type: 'void_particle'
            });
          }
          break;
      }

      // Rain for appropriate themes
      if ((level.theme === 'forest' || level.theme === 'void') && Math.random() < 0.1) {
        for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
          this.emit({
            x: Math.random() * (level.width * 1.2) - level.width * 0.1,
            y: -50,
            vx: -15 - Math.random() * 20,
            vy: 400 + Math.random() * 200,
            life: 1.5,
            maxLife: 1.5,
            size: 0.7 + Math.random() * 0.6,
            color: 'rgba(200, 220, 255, 0.2)',
            alpha: 0.15,
            type: 'rain'
          });
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Update position
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Enhanced type-specific physics
      switch (p.type) {
        case 'dust':
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.alpha = (p.life / p.maxLife) * 0.4;
          break;

        case 'fog':
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.alpha = (p.life / p.maxLife) * 0.2;
          p.size += dt * 3;
          break;

        case 'spark':
          p.vy += 250 * dt; // Increased gravity
          p.alpha = (p.life / p.maxLife) * 0.8;
          p.size *= 0.98;
          // Add fading sparkle
          if (Math.random() < 0.3) {
            p.alpha *= 0.7;
          }
          break;

        case 'water':
          p.vy += 350 * dt;
          p.vx *= 0.96;
          p.alpha = (p.life / p.maxLife) * 0.5;
          // Add ripples
          if (Math.random() < 0.2) {
            p.size *= 1.02;
          }
          break;

        case 'firefly:
          +=   (  (Math.random()  -  0.5))  *  40  *  dt;
          p.y          +=   (  (Math.random()  -  0.5))  *  40  *  dt;
          p.vx         *=  0.96;
          p.vy         *=  0.96;
          p.alpha      =  0.4  +  Math.sin(  performance.now()  /  180  +  p.x  *  0.02  +  p.y  *  0.01)  *  0.3;
          break;

        case 'death':
          p.vy += 120 * dt;
          p.vx *= 0.97;
          p.alpha = (p.life / p.maxLife) * 0.7;
          p.size *= 0.99;
          // Add fading embers
          if (Math.random() < 0.1) {
            p.alpha *= 0.5;
          }
          break;

        case 'leaf':
          p.vx += Math.sin(performance.now() / 400 + p.y * 0.015) * 15 * dt;
          p.vy += 40 * dt;
          p.vx *= 0.96;
          p.alpha = (p.life / p.maxLife) * 0.5;
          // Add gentle rotation
          p.size *= 0.999;
          break;

        case 'smoke':
          p.vy -= 10 * dt; // Smoke rises
          p.vx *= 0.98;
          p.alpha = (p.life / p.maxLife) * 0.3;
          p.size += dt * 4;
          break;

        case 'void_particle':
          p.vx += (Math.random() - 0.5) * 3 * dt;
          p.vy += (Math.random() - 0.5) * 3 * dt;
          p.vx *= 0.99;
          p.vy *= 0.99;
          p.alpha = (p.life / p.maxLife) * 0.15;
          p.size *= 1.001; // Very slow pulse
          break;

        case 'rain':
          // Rain falls fast and straight with slight wind
          p.vx += (Math.sin(performance.now() / 1000) * 5) * dt;
          break;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    ctx.save();

    // Sort particles by depth for proper rendering (farther first)
    const sortedParticles = [...this.particles].sort((a, b) =>
      (a.y || 0) - (b.y || 0)
    );

    for (const p of sortedParticles) {
      ctx.globalAlpha = p.alpha;

      switch (p.type) {
        case 'dust':
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'fog':
          const fogGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          fogGrad.addColorStop(0, p.color);
          fogGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = fogGrad;
          ctx.fillRect(p.x - p.size * 1.5, p.y - p.size * 1.5, p.size * 3, p.size * 3);
          break;

        case 'spark':
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = Math.min(8, p.size * 4);
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          ctx.shadowBlur = 0;
          break;

        case 'water':
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'firefly':
          ctx.fillStyle = p.color;
          const glowSize = p.size * (1 + Math.sin(performance.now() / 150) * 0.3);
          ctx.shadowColor = p.color;
          ctx.shadowBlur = glowSize * 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;

        case 'death':
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;

        case 'leaf':
          ctx.fillStyle = p.color;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.sin(performance.now() / 300) * 0.2);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;

        case 'smoke':
          const smokeGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
          smokeGrad.addColorStop(0, p.color);
          smokeGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = smokeGrad;
          ctx.fillRect(p.x - p.size * 2, p.y - p.size * 2, p.size * 4, p.size * 4);
          break;

        case 'void_particle':
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          // Add subtle outer glow
          const glowGrad = ctx.createRadialGradient(p.x, p.y, p.size, p.x, p.y, p.size * 3);
          glowGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
          glowGrad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.globalAlpha = p.alpha * 0.3;
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'rain':
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(0.5, p.size * 0.7);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 0.03, p.y + p.vy * 0.03);
          ctx.stroke();
          break;

        default:
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
      }
    }

    ctx.restore();
  }
}
