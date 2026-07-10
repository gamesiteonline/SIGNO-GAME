// SIGNO Professional Split-Screen Controller
// Developed by Fahad Mohamed & Manus
// Left: Movement | Right: Jump & Actions

import type { InputState } from './Types';

export class GestureController {
  private input: InputState;
  private canvas: HTMLCanvasElement;
  
  // Tracking multiple touches
  private leftTouchId: number | null = null;
  private rightTouchId: number | null = null;
  
  private leftStartPos: { x: number, y: number } | null = null;
  private rightStartPos: { x: number, y: number } | null = null;

  constructor(canvas: HTMLCanvasElement, input: InputState) {
    this.canvas = canvas;
    this.input = input;
    this.setupListeners();
  }

  private setupListeners(): void {
    // Mouse fallback for desktop (Left half = Move, Right half = Jump)
    this.canvas.addEventListener('mousedown', (e) => {
      const isRightSide = e.clientX > window.innerWidth / 2;
      if (isRightSide) {
        this.input.jump = true;
      } else {
        this.leftStartPos = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.leftStartPos) {
        const dx = e.clientX - this.leftStartPos.x;
        if (dx > 20) {
          this.input.right = true;
          this.input.left = false;
        } else if (dx < -20) {
          this.input.left = true;
          this.input.right = false;
        } else {
          this.input.left = false;
          this.input.right = false;
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.leftStartPos = null;
      this.input.left = false;
      this.input.right = false;
      this.input.jump = false;
    });

    // Multi-touch for Mobile (Crucial for moving and jumping simultaneously)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const isRightSide = touch.clientX > window.innerWidth / 2;

        if (isRightSide && this.rightTouchId === null) {
          this.rightTouchId = touch.identifier;
          this.rightStartPos = { x: touch.clientX, y: touch.clientY };
          this.input.jump = true;
          this.input.action = true; // Also trigger action on tap
          console.log('Right touch started at', this.rightStartPos);
        } else if (!isRightSide && this.leftTouchId === null) {
          this.leftTouchId = touch.identifier;
          this.leftStartPos = { x: touch.clientX, y: touch.clientY };
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        
        if (touch.identifier === this.leftTouchId && this.leftStartPos) {
          const dx = touch.clientX - this.leftStartPos.x;
          if (dx > 20) {
            this.input.right = true;
            this.input.left = false;
          } else if (dx < -20) {
            this.input.left = true;
            this.input.right = false;
          } else {
            this.input.left = false;
            this.input.right = false;
          }
        }
      }
    }, { passive: false });

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.leftTouchId) {
          this.leftTouchId = null;
          this.leftStartPos = null;
          this.input.left = false;
          this.input.right = false;
        } else if (touch.identifier === this.rightTouchId) {
          this.rightTouchId = null;
          this.rightStartPos = null;
          this.input.jump = false;
          this.input.action = false;
        }
      }
    };

    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Keyboard fallback remains
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowLeft': case 'a': this.input.left = true; break;
      case 'ArrowRight': case 'd': this.input.right = true; break;
      case 'ArrowUp': case 'w': case ' ': this.input.jump = true; break;
      case 'ArrowDown': case 's': this.input.down = true; break;
      case 'e': case 'Control': this.input.action = true; break;
      case 'Escape': case 'p': this.input.pause = !this.input.pause; break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowLeft': case 'a': this.input.left = false; break;
      case 'ArrowRight': case 'd': this.input.right = false; break;
      case 'ArrowUp': case 'w': case ' ': this.input.jump = false; break;
      case 'ArrowDown': case 's': this.input.down = false; break;
      case 'e': case 'Control': this.input.action = false; break;
    }
  }

  update(): void {
    // Logic updated via listeners
  }
}
