// Keyboard and mouse, in one place. The canvas reports its own size, so mouse
// clicks are translated from screen pixels into the game's 1280x720 room.
import { ROOM } from './level.js';

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouseX: ROOM.width / 2,
    mouseY: ROOM.height / 2,
    clicked: null, // {x, y} in room coordinates, consumed once per frame
    pressedKeys: new Set(), // keys pressed since last frame, consumed once
  };

  function toRoom(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * ROOM.width,
      y: ((clientY - rect.top) / rect.height) * ROOM.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (!event.repeat) input.pressedKeys.add(event.key.toLowerCase());
    input.keys.add(event.key.toLowerCase());
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.key.toLowerCase());
  });
  canvas.addEventListener('mousemove', (event) => {
    const p = toRoom(event.clientX, event.clientY);
    input.mouseX = p.x;
    input.mouseY = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = toRoom(event.clientX, event.clientY);
    input.mouseX = p.x;
    input.mouseY = p.y;
    input.clicked = p;
  });
  window.addEventListener('blur', () => input.keys.clear());
  return input;
}

/** -1, 0 or 1 on each axis from WASD or the arrow keys. */
export function moveDirection(input) {
  const left = input.keys.has('a') || input.keys.has('arrowleft');
  const right = input.keys.has('d') || input.keys.has('arrowright');
  const up = input.keys.has('w') || input.keys.has('arrowup');
  const down = input.keys.has('s') || input.keys.has('arrowdown');
  return { x: (right ? 1 : 0) - (left ? 1 : 0), y: (down ? 1 : 0) - (up ? 1 : 0) };
}

export function endFrame(input) {
  input.clicked = null;
  input.pressedKeys.clear();
}
