// Security cameras: fixed wall mounts that sweep their cone back and forth.
// A camera's cone is narrower than a guard's but it never blinks, never pauses, and
// it fills the alarm faster than any guard. Its sweep is a rhythm the player can
// learn: cross while the cone is turned away, never while it is coming back.
import { CAMERA_MOUNTS, sightBlocked } from './level.js';

export const CAMERA_HALF_ANGLE = 0.35;

export function createCameras() {
  return CAMERA_MOUNTS.map((mount) => ({
    x: mount.x,
    y: mount.y,
    baseAngle: mount.baseAngle,
    sweep: mount.sweep,
    speed: mount.speed,
    range: mount.range,
    phase: 0,
    angle: mount.baseAngle,
  }));
}

export function updateCameras(cameras, dt) {
  for (const camera of cameras) {
    camera.phase += dt * camera.speed;
    camera.angle = camera.baseAngle + Math.sin(camera.phase) * camera.sweep;
  }
}

/** True when this camera can see the point (px, py) right now. */
export function cameraSees(camera, px, py) {
  const dx = px - camera.x;
  const dy = py - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > camera.range) return false;
  let diff = Math.atan2(dy, dx) - camera.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA_HALF_ANGLE) return false;
  return !sightBlocked(camera.x, camera.y, px, py);
}
