# SIGNO Gesture Controls - LIMBO Style

## Overview

The SIGNO game now features a **LIMBO-inspired gesture-based control system** that provides an intuitive and immersive gameplay experience on both desktop and mobile devices.

## Control Scheme

### Desktop (Keyboard + Mouse)

| Action | Input |
|--------|-------|
| **Move Left** | `A` or `←` Arrow |
| **Move Right** | `D` or `→` Arrow |
| **Jump** | `W`, `↑` Arrow, or `Space` |
| **Action (Push/Pull)** | `E` or `Ctrl` |
| **Pause** | `Esc` or `P` |

### Mobile (Touch Gestures)

| Action | Gesture |
|--------|---------|
| **Move Left** | Drag finger **left** (>30px) |
| **Move Right** | Drag finger **right** (>30px) |
| **Jump** | Swipe **upward** (>60px) |
| **Action (Push/Pull)** | **Hold** for >300ms without moving |
| **Tap Jump** | Quick tap (alternative jump method) |

## Gesture Details

### Horizontal Movement
- Dragging your finger/mouse left or right across the screen controls the player's movement
- Threshold: 30 pixels of horizontal movement required to register
- Continuous drag maintains movement direction

### Jump Mechanic
- **Upward Swipe**: Swipe your finger upward (60+ pixels) to jump
- **Keyboard**: Press `W`, `Space`, or `↑` Arrow to jump
- **Variable Height**: Hold the jump key/gesture longer for higher jumps
- Quick tap also triggers a jump (alternative method)

### Action/Interaction
- **Long Press**: Hold your finger on the screen for more than 300ms without significant movement
- **Keyboard**: Press `E` or `Ctrl` to interact with objects
- Used for pushing boxes, pulling levers, and other interactions

## Design Philosophy

The gesture control system is inspired by **LIMBO's minimalist approach**:

1. **Intuitive**: Gestures map naturally to player actions (swipe up = jump, drag = move)
2. **Responsive**: Immediate feedback with no complex button layouts
3. **Accessible**: Works seamlessly on touch and keyboard devices
4. **Immersive**: Maintains the dark, atmospheric LIMBO aesthetic

## Implementation Details

### GestureController Class

Located in `src/game/engine/GestureController.ts`, the controller handles:

- **Touch Events**: Captures `touchstart`, `touchmove`, `touchend` events
- **Mouse Events**: Simulates touch events for desktop testing
- **Keyboard Fallback**: Traditional keyboard controls for accessibility
- **Input State Management**: Updates the game's `InputState` in real-time

### Key Features

- **Swipe Threshold**: 30px for horizontal movement, 60px for vertical jump
- **Tap Threshold**: 200ms for distinguishing taps from drags
- **Passive Event Listeners**: Prevents browser default behavior while maintaining performance
- **Cross-platform**: Works on all modern browsers (Chrome, Firefox, Safari, Edge)

## Testing

### Desktop Testing
1. Use keyboard controls (WASD or Arrow Keys)
2. Use mouse drag gestures (simulates touch)
3. Test pause and menu navigation

### Mobile Testing
1. Test on iOS Safari and Android Chrome
2. Verify gesture responsiveness on various screen sizes
3. Test in both portrait and landscape orientations

## Performance Considerations

- Event listeners are attached once during initialization
- Gesture calculations are lightweight (simple distance checks)
- No external gesture libraries required
- Optimized for 60 FPS gameplay

## Future Enhancements

- Customizable gesture sensitivity
- Gesture recording/replay for tutorials
- Haptic feedback on mobile devices
- Gesture visualization for first-time players
- Support for controller/gamepad input

## Credits

- **Gesture System**: Developed by Manus
- **Game**: SIGNO - A LIMBO Tribute
- **Developer**: Fahad Mohamed
- **Company**: GAME SITE ONLINE
