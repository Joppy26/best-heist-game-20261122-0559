// Guards: patrol routes, vision cones, suspicion, and the fair caught moment.
// A guard only raises the alarm while it can actually see the thief: inside its cone,
// within range, and with no case or pillar between them. Seeing the thief makes the
// guard turn toward them and, once the alarm is high, give chase. A guard that reaches
// the thief catches them; a guard that loses sight goes back to its route.
import { GUARD_ROUTES, resolveCircle, sightBlocked } from './level.js';

export const GUARD_RANGE = 250;
export const GUARD_HALF_ANGLE = 0.6;
export const CHASE_ALARM = 65;
export const CATCH_DISTANCE = 26;

export function createGuards() {
  return GUARD_ROUTES.map((route) => ({
    name: route.name,
    color: route.color,
    x: route.waypoints[0].x,
    y: route.waypoints[0].y,
    angle: 0,
    waypoints: route.waypoints,
    waypointIndex: 1,
    speed: route.speed,
    mode: 'patrol', // patrol | investigate | chase
    investigateX: 0,
    investigateY: 0,
    investigateT: 0,
    suspicion: 0, // 0..1, how sure this guard is that something is wrong
    pauseT: 0,
  }));
}

/** True when this guard can see the point (px, py) right now. */
export function guardSees(guard, px, py) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_RANGE) return false;
  let diff = Math.atan2(dy, dx) - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > GUARD_HALF_ANGLE) return false;
  return !sightBlocked(guard.x, guard.y, px, py);
}

/** Send a guard to look at a noise. Used by the thrown coin. */
export function distractGuard(guard, x, y) {
  if (guard.mode === 'chase') return;
  guard.mode = 'investigate';
  guard.investigateX = x;
  guard.investigateY = y;
  guard.investigateT = 4;
}

function moveToward(guard, tx, ty, dt, speed) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
  return dist - step < 1;
}

/**
 * Step every guard. Returns true when a guard has caught the thief.
 * `seen` is whether any eye (guard or camera) has the thief this frame.
 */
export function updateGuards(guards, dt, player, alarm, seenByCamera) {
  let caught = false;
  for (const guard of guards) {
    const sees = guardSees(guard, player.x, player.y);
    if (sees) {
      guard.suspicion = Math.min(1, guard.suspicion + dt * 1.4);
      guard.angle = Math.atan2(player.y - guard.y, player.x - guard.x);
    } else {
      guard.suspicion = Math.max(0, guard.suspicion - dt * 0.35);
    }
    if (guard.suspicion > 0.55 && guard.mode === 'patrol') {
      guard.mode = 'investigate';
      guard.investigateX = player.x;
      guard.investigateY = player.y;
      guard.investigateT = 3;
    }
    if (alarm >= CHASE_ALARM || seenByCamera) {
      guard.mode = 'chase';
    }
    if (guard.mode === 'chase') {
      moveToward(guard, player.x, player.y, dt, guard.speed * 1.45);
      if (!sees && guard.suspicion <= 0 && alarm < CHASE_ALARM) guard.mode = 'patrol';
    } else if (guard.mode === 'investigate') {
      const arrived = moveToward(guard, guard.investigateX, guard.investigateY, dt, guard.speed * 1.15);
      guard.investigateT -= dt;
      if (arrived || guard.investigateT <= 0) {
        guard.mode = 'patrol';
        guard.pauseT = 1.2;
      }
    } else {
      if (guard.pauseT > 0) {
        guard.pauseT -= dt;
      } else {
        const target = guard.waypoints[guard.waypointIndex];
        if (moveToward(guard, target.x, target.y, dt, guard.speed)) {
          guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
          guard.pauseT = 0.8;
        }
      }
    }
    resolveCircle(guard, 14);
    if (Math.hypot(player.x - guard.x, player.y - guard.y) < CATCH_DISTANCE) caught = true;
  }
  return caught;
}
