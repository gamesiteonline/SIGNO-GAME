// SIGNO Physics Engine
// Developed by Fahad Mohamed

import type { Vector2, Rect, Platform } from './Types';
import { PHYSICS } from './Types';

export class Physics {
  static checkRectCollision(a: Rect, b: Rect): boolean {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  static resolveCollision(
    entity: { pos: Vector2; vel: Vector2; size: Vector2; grounded: boolean },
    platforms: Platform[]
  ): void {
    entity.grounded = false;

    // Apply gravity
    if (entity.vel.y < PHYSICS.TERMINAL_VELOCITY) {
      entity.vel.y += PHYSICS.GRAVITY * 0.016;
    }

    // Move on X axis and resolve
    entity.pos.x += entity.vel.x * 0.016;

    for (const platform of platforms) {
      if (!platform.crumbling) {
        const rect: Rect = {
          x: platform.x,
          y: platform.y,
          w: platform.w,
          h: platform.h,
        };

        if (this.checkRectCollision(
          { x: entity.pos.x, y: entity.pos.y - entity.size.y, w: entity.size.x, h: entity.size.y },
          rect
        )) {
          if (platform.type === 'one-way') {
            // Only collide if falling down and above platform
            const entityBottom = entity.pos.y;
            const platformTop = platform.y;
            if (entity.vel.y > 0 && entityBottom - entity.vel.y * 0.016 <= platformTop + 5) {
              entity.pos.x -= entity.vel.x * 0.016;
              entity.vel.x = 0;
            }
          } else {
            // Standard collision resolution on X
            if (entity.vel.x > 0) {
              entity.pos.x = platform.x - entity.size.x * 0.5;
            } else if (entity.vel.x < 0) {
              entity.pos.x = platform.x + platform.w + entity.size.x * 0.5;
            }
            entity.vel.x = 0;
          }
        }
      }
    }

    // Move on Y axis and resolve
    entity.pos.y += entity.vel.y * 0.016;

    for (const platform of platforms) {
      if (!platform.crumbling) {
        const rect: Rect = {
          x: platform.x,
          y: platform.y,
          w: platform.w,
          h: platform.h,
        };

        if (this.checkRectCollision(
          { x: entity.pos.x - entity.size.x * 0.5, y: entity.pos.y - entity.size.y, w: entity.size.x, h: entity.size.y },
          rect
        )) {
          if (platform.type === 'one-way') {
            const entityBottom = entity.pos.y;
            const platformTop = platform.y;
            if (entity.vel.y >= 0 && entityBottom - entity.vel.y * 0.016 <= platformTop + 8) {
              entity.pos.y = platformTop;
              entity.vel.y = 0;
              entity.grounded = true;
            }
          } else {
            if (entity.vel.y > 0) {
              // Landing on top
              entity.pos.y = platform.y;
              entity.vel.y = 0;
              entity.grounded = true;
            } else if (entity.vel.y < 0) {
              // Hitting head on bottom
              entity.pos.y = platform.y + platform.h + entity.size.y;
              entity.vel.y = 0;
            }
          }
        }
      }
    }

    // Apply friction
    if (entity.grounded) {
      entity.vel.x *= PHYSICS.FRICTION;
    } else {
      entity.vel.x *= PHYSICS.AIR_FRICTION;
    }
  }

  static pointInRect(px: number, py: number, rect: Rect): boolean {
    return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
  }

  static distance(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
