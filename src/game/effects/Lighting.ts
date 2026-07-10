// SIGNO Dynamic Lighting Engine
// Developed by Fahad Mohamed
// Enhanced with advanced visual effects

import type { LightSource, LevelData } from '../engine/Types';

export class LightingEngine {
  lights: LightSource[] = [];
  ambientLight: number = 0.35; // Balanced for visibility and mood
  fogColor: string = '#0a0a0a'; // Deeper fog for atmosphere
  fogDensity: number = 0.2; // Adjusted for better depth perception
  lightCanvas: HTMLCanvasElement | null = null;
  lightCtx: CanvasRenderingContext2D | null = null;
  private bloomCanvas: HTMLCanvasElement | null = null;
  private bloomCtx: CanvasRenderingContext2D | null = null;
  private lastUpdate: number = 0;

  setupForLevel(level: LevelData): void {
    this.lights = [];
    this.fogColor = level.fogColor;
    this.fogDensity = level.fogDensity;

    // Create light overlay canvas
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = 800;
    this.lightCanvas.height = 600;
    this.lightCtx = this.lightCanvas.getContext('2d');

    // Create bloom canvas for glow effects
    this.bloomCanvas = document.createElement('canvas');
    this.bloomCanvas.width = 800;
    this.bloomCanvas.height = 600;
    this.bloomCtx = this.bloomCanvas.getContext('2d');

    // Add ambient lights based on level theme with enhanced variety
    if (level.theme === 'forest') {
      this.ambientLight = 0.18;
      // Moonlight from above with subtle variation
      this.lights.push({
        x: level.width / 2,
        y: -150,
        radius: 700,
        color: '#b8c8d8',
        intensity: 0.35,
        flicker: false,
        flickerSpeed: 0
      });
      // Fireflies with varied colors and patterns
      for (let i = 0; i < 12; i++) {
        this.lights.push({
          x: 100 + Math.random() * (level.width - 200),
          y: 150 + Math.random() * (level.height - 300),
          radius: 40 + Math.random() * 30,
          color: ['#aaff88', '#88ffaa', '#88ffcc'][Math.floor(Math.random() * 3)],
          intensity: 0.25 + Math.random() * 0.2,
          flicker: true,
          flickerSpeed: 1.5 + Math.random() * 2
        });
      }
      // Distant firefly clusters
      for (let i = 0; i < 3; i++) {
        this.lights.push({
          x: level.width * 0.2 + Math.random() * level.width * 0.6,
          y: level.height * 0.3 + Math.random() * level.height * 0.4,
          radius: 80 + Math.random() * 40,
          color: '#aaff88',
          intensity: 0.15 + Math.random() * 0.1,
          flicker: true,
          flickerSpeed: 0.5 + Math.random() * 1
        });
      }
    } else if (level.theme === 'industrial') {
      this.ambientLight = 0.1;
      // Harsh overhead lights with industrial feel
      for (let i = 0; i < 8; i++) {
        this.lights.push({
          x: 200 + i * 350,
          y: 80,
          radius: 200,
          color: '#ffeebb',
          intensity: 0.4 + Math.random() * 0.15,
          flicker: Math.random() > 0.3,
          flickerSpeed: 3 + Math.random() * 4
        });
      }
      // Red warning lights with pulsating effect
      for (let i = 0; i < 5; i++) {
        this.lights.push({
          x: 400 + i * 400,
          y: 200,
          radius: 60 + Math.random() * 20,
          color: '#ff6666',
          intensity: 0.35 + Math.random() * 0.15,
          flicker: true,
          flickerSpeed: 2 + Math.random() * 2
        });
      }
      // Ambient glow from machinery
      for (let i = 0; i < 4; i++) {
        this.lights.push({
          x: level.width * 0.2 + i * level.width * 0.2,
          y: level.height * 0.7,
          radius: 150 + Math.random() * 100,
          color: '#ffcc99',
          intensity: 0.2 + Math.random() * 0.1,
          flicker: true,
          flickerSpeed: 0.8 + Math.random() * 0.7
        });
      }
    } else if (level.theme === 'cave') {
      this.ambientLight = 0.08;
      // Bioluminescent glows with varied colors
      const biolumColors = ['#66ccff', '#99ffcc', '#cc99ff', '#ffcc99'];
      for (let i = 0; i < 15; i++) {
        this.lights.push({
          x: 50 + Math.random() * (level.width - 100),
          y: 50 + Math.random() * (level.height - 100),
          radius: 30 + Math.random() * 40,
          color: biolumColors[Math.floor(Math.random() * biolumColors.length)],
          intensity: 0.2 + Math.random() * 0.25,
          flicker: true,
          flickerSpeed: 0.8 + Math.random() * 1.5
        });
      }
      // Crystal light beams with rays
      for (let i = 0; i < 5; i++) {
        this.lights.push({
          x: 300 + i * 400,
          y: 100,
          radius: 120,
          color: '#99ccff',
          intensity: 0.3 + Math.random() * 0.15,
          flicker: true,
          flickerSpeed: 1 + Math.random() * 1.5
        });
        // Add light rays
        this.lights.push({
          x: 300 + i * 400,
          y: 50,
          radius: 300,
          color: '#99ccff',
          intensity: 0.08,
          flicker: true,
          flickerSpeed: 0.5
        });
      }
      // Distant glow from depths
      this.lights.push({
        x: level.width / 2,
        y: level.height * 0.8,
        radius: 400,
        color: '#336699',
        intensity: 0.15,
        flicker: true,
        flickerSpeed: 0.3
      });
    } else if (level.theme === 'graveyard') {
      this.ambientLight = 0.12;
      // Moonlight with cold tone
      this.lights.push({
        x: level.width * 0.7,
        y: -100,
        radius: 600,
        color: '#8899bb',
        intensity: 0.25,
        flicker: false,
        flickerSpeed: 0
      });
      // Ghostly lights with ethereal quality
      for (let i = 0; i < 8; i++) {
        this.lights.push({
          x: 150 + Math.random() * (level.width - 300),
          y: 150 + Math.random() * (level.height - 300),
          radius: 35 + Math.random() * 25,
          color: ['#88aadd', '#99bbff', '#aaccff'][Math.floor(Math.random() * 3)],
          intensity: 0.18 + Math.random() * 0.12,
          flicker: true,
          flickerSpeed: 0.8 + Math.random() * 1.2
        });
      }
      // Fog lights for depth
      for (let i = 0; i < 3; i++) {
        this.lights.push({
          x: level.width * 0.2 + i * level.width * 0.3,
          y: level.height * 0.5,
          radius: 200 + Math.random() * 100,
          color: '#778899',
          intensity: 0.12 + Math.random() * 0.08,
          flicker: true,
          flickerSpeed: 0.3 + Math.random() * 0.4
        });
      }
    } else if (level.theme === 'void') {
      this.ambientLight = 0.05;
      // Single harsh light with cosmic feel
      this.lights.push({
        x: level.width / 2,
        y: level.height / 2,
        radius: 900,
        color: '#ffffff',
        intensity: 0.18,
        flicker: true,
        flickerSpeed: 6
      });
      // Distant stars
      for (let i = 0; i < 20; i++) {
        this.lights.push({
          x: Math.random() * level.width,
          y: Math.random() * level.height * 0.6,
          radius: 2 + Math.random() * 3,
          color: '#ffffff',
          intensity: 0.05 + Math.random() * 0.1,
          flicker: true,
          flickerSpeed: 0.5 + Math.random() * 1.5
        });
      }
      // Subtle nebula glow
      this.lights.push({
        x: level.width * 0.3,
        y: level.height * 0.4,
        radius: 300,
        color: '#663399',
        intensity: 0.12,
        flicker: true,
        flickerSpeed: 0.2
      });
      this.lights.push({
        x: level.width * 0.7,
        y: level.height * 0.6,
        radius: 250,
        color: '#336699',
        intensity: 0.1,
        flicker: true,
        flickerSpeed: 0.15
      });
    }
  }

  // Enhanced update with better flicker patterns and player interaction
  update(dt: number, playerPos: { x: number; y: number }): void {
    // Throttle updates for performance
    const now = Date.now();
    if (now - this.lastUpdate < 16) { // ~60fps
      return;
    }
    this.lastUpdate = now;

    const time = performance.now() / 1000;
    for (const light of this.lights) {
      if (light.flicker) {
        // More sophisticated flicker patterns
        const baseFlicker = Math.sin(time * light.flickerSpeed) * 0.1;
        const harmonicFlicker = Math.sin(time * light.flickerSpeed * 1.7) * 0.05;
        const noiseFlicker = (Math.sin(time * 13.7) * Math.sin(time * 17.3)) * 0.03;
        const flicker = baseFlicker + harmonicFlicker + noiseFlicker;
        light.intensity = Math.max(0.03, light.intensity + flicker * dt * 0.5);
      }

      // Add subtle pulse to some lights for life
      if (light.pulse !== undefined) {
        const pulse = Math.sin(time * light.pulseSpeed) * 0.1 + 0.9;
        light.intensity = light.baseIntensity * pulse;
      }
    }
  }

  // Enhanced method to add dynamic lights (e.g., from player, hazards)
  addDynamicLight(light: LightSource): void {
    this.lights.push(light);
  }

  // Remove dynamic light (for cleanup)
  removeDynamicLight(light: LightSource): void {
    const index = this.lights.indexOf(light);
    if (index > -1) {
      this.lights.splice(index, 1);
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    screenW: number,
    screenH: number,
    camera: { x: number; y: number }
  ): void {
    if (!this.lightCanvas || !this.lightCtx || !this.bloomCanvas || !this.bloomCtx) return;

    // Resize canvases if needed
    if (this.lightCanvas.width !== screenW || this.lightCanvas.height !== screenH) {
      this.lightCanvas.width = screenW;
      this.lightCanvas.height = screenH;
      this.bloomCanvas.width = screenW;
      this.bloomCanvas.height = screenH;
    }

    const lctx = this.lightCtx;
    const bctx = this.bloomCtx;

    // Clear with ambient darkness
    lctx.fillStyle = `rgba(0, 0, 0, ${1 - this.ambientLight})`;
    lctx.fillRect(0, 0, screenW, screenH);

    // Set blend mode to cut out light
    lctx.globalCompositeOperation = 'destination-out';

    // Render each light to both light and bloom canvases
    for (const light of this.lights) {
      const screenX = light.x - camera.x + screenW / 2;
      const screenY = light.y - camera.y + screenH / 2;

      // Check if light is on screen (with buffer)
      const buffer = 100;
      if (screenX + light.radius < -buffer || screenX - light.radius > screenW + buffer ||
          screenY + light.radius < -buffer || screenY - light.radius > screenH + buffer) {
        continue;
      }

      const gradient = lctx.createRadialGradient(
        screenX, screenY, 0,
        screenX, screenY, light.radius
      );

      const alpha = light.intensity;
      gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(0, 0, 0, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      lctx.fillStyle = gradient;
      lctx.beginPath();
      lctx.arc(screenX, screenY, light.radius, 0, Math.PI * 2);
      lctx.fill();

      // Add to bloom for glow effect (only for bright lights)
      if (light.intensity > 0.2) {
        const bloomGradient = bctx.createRadialGradient(
          screenX, screenY, 0,
          screenX, screenY, light.radius * 2
        );

        const bloomAlpha = light.intensity * 0.4;
        bloomGradient.addColorStop(0, `rgba(0, 0, 0, ${bloomAlpha})`);
        bloomGradient.addColorStop(0.7, `rgba(0, 0, 0, ${bloomAlpha * 0.3})`);
        bloomGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        bctx.fillStyle = bloomGradient;
        bctx.beginPath();
        bctx.arc(screenX, screenY, light.radius * 2, 0, Math.PI * 2);
        bctx.fill();
      }
    }

    // Reset blend mode
    lctx.globalCompositeOperation = 'source-over';
    bctx.globalCompositeOperation = 'source-over';

    // Draw the lighting overlay
    ctx.save();
    ctx.globalAlpha = 0.85; // Slightly increased for better contrast
    ctx.drawImage(this.lightCanvas, 0, 0);
    ctx.restore();

    // Apply bloom effect
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.3;
    ctx.filter = 'blur(8px)';
    ctx.drawImage(this.bloomCanvas, 0, 0);
    ctx.restore();

    // Add volumetric fog effect with depth
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.1;
    // Multiple layered blurs for rich volumetric feel
    ctx.filter = 'blur(10px) contrast(110%)';
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.filter = 'blur(25px) brightness(110%)';
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.filter = 'blur(50px) brightness(90%)';
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();

    // High-end contrast adjustment with lift
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, screenW, screenH);
    ctx.restore();

    // Render colored light tints with enhanced blending
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const light of this.lights) {
      const screenX = light.x - camera.x + screenW / 2;
      const screenY = light.y - camera.y + screenH / 2;

      if (screenX + light.radius < 0 || screenX - light.radius > screenW ||
          screenY + light.radius < 0 || screenY - light.radius > screenH) {
        continue;
      }

      const gradient = ctx.createRadialGradient(
        screenX, screenY, 0,
        screenX, screenY, light.radius
      );

      const alpha = light.intensity * 0.35;
      gradient.addColorStop(0, light.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, light.color + '00');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, light.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Add subtle vignette for focus
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.15;
    const vignette = ctx.createRadialGradient(
      screenW / 2, screenH / 2, 0,
      screenW / 2, screenH / 2, Math.max(screenW, screenH)
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, screenW, screenH);
    ctx.restore();
  }
}
