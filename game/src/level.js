// The Marlowe Gallery: one room, three lanes, and everything the thief must read.
// The room is a single fixed layout so a careful player can learn it and plan a route:
// the west lane past the display cases, the middle lane between the pillars, or the
// east lane under the cameras. Cover blocks sight; open floor does not.
export const ROOM = { width: 1280, height: 720, wall: 24 };

// Axis-aligned rectangles the thief, guards and sight lines all collide with.
export const BLOCKERS = [
  // Display cases (glass cabinets): hard cover, and two of them hold small gems.
  { x: 180, y: 140, w: 150, h: 60, kind: 'case' },
  { x: 180, y: 420, w: 150, h: 60, kind: 'case' },
  { x: 950, y: 140, w: 150, h: 60, kind: 'case' },
  { x: 950, y: 420, w: 150, h: 60, kind: 'case' },
  // The sapphire's pedestal in the middle of the room.
  { x: 590, y: 330, w: 100, h: 60, kind: 'pedestal' },
];

// Round pillars: cover you can slip behind from any side.
export const PILLARS = [
  { x: 420, y: 200, r: 26 },
  { x: 860, y: 200, r: 26 },
  { x: 420, y: 520, r: 26 },
  { x: 860, y: 520, r: 26 },
];

export const ENTRANCE = { x: 96, y: 620 };
export const EXIT = { x: 1232, y: 300, w: 24, h: 96 };
export const SAPPHIRE = { x: 640, y: 360 };
export const SAPPHIRE_CHANNEL_SECONDS = 1.2;

// Small gems resting on the display cases. Worth points, never required.
export const GEM_SPOTS = [
  { x: 255, y: 170, value: 100, label: 'Topaz' },
  { x: 255, y: 450, value: 100, label: 'Opal' },
  { x: 1025, y: 170, value: 100, label: 'Ruby' },
  { x: 1025, y: 450, value: 100, label: 'Emerald' },
];

// Where each guard walks. A route is a list of waypoints the guard patrols in order.
export const GUARD_ROUTES = [
  {
    name: 'Rook',
    color: '#e8b64c',
    waypoints: [
      { x: 380, y: 280 },
      { x: 900, y: 280 },
    ],
    speed: 62,
  },
  {
    name: 'Bishop',
    color: '#7fb3e8',
    waypoints: [
      { x: 1050, y: 150 },
      { x: 1050, y: 560 },
    ],
    speed: 55,
  },
  {
    name: 'Knight',
    color: '#c98ae8',
    waypoints: [
      { x: 250, y: 580 },
      { x: 1000, y: 580 },
    ],
    speed: 48,
  },
];

// Wall cameras: a fixed mount, a base facing, and a sweep that never stops.
export const CAMERA_MOUNTS = [
  { x: 640, y: 64, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.55, range: 320 },
  { x: 1256, y: 150, baseAngle: Math.PI, sweep: 0.7, speed: 0.45, range: 300 },
];

export function createLevel() {
  return {
    blockers: BLOCKERS.map((b) => ({ ...b })),
    pillars: PILLARS.map((p) => ({ ...p })),
    gems: GEM_SPOTS.map((g) => ({ ...g, taken: false })),
    sapphireTaken: false,
    channel: 0,
  };
}

/** True when the segment from (x1,y1) to (x2,y2) is cut by a wall, case or pillar. */
export function sightBlocked(x1, y1, x2, y2) {
  for (const b of BLOCKERS) {
    if (segmentHitsRect(x1, y1, x2, y2, b)) return true;
  }
  for (const p of PILLARS) {
    if (segmentHitsCircle(x1, y1, x2, y2, p.x, p.y, p.r)) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: find the overlap of the segment with the rectangle's x and y spans.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  return (px - cx) * (px - cx) + (py - cy) * (py - cy) < r * r;
}

/** Push a circle of radius r out of every wall, blocker and pillar it overlaps. */
export function resolveCircle(body, r) {
  const w = ROOM.wall;
  body.x = Math.max(w + r, Math.min(ROOM.width - w - r, body.x));
  body.y = Math.max(w + r, Math.min(ROOM.height - w - r, body.y));
  for (const b of BLOCKERS) {
    const cx = Math.max(b.x, Math.min(body.x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(body.y, b.y + b.h));
    const dx = body.x - cx;
    const dy = body.y - cy;
    const dSq = dx * dx + dy * dy;
    if (dSq < r * r) {
      if (dSq === 0) {
        body.y = b.y - r;
      } else {
        const d = Math.sqrt(dSq);
        body.x = cx + (dx / d) * r;
        body.y = cy + (dy / d) * r;
      }
    }
  }
  for (const p of PILLARS) {
    const dx = body.x - p.x;
    const dy = body.y - p.y;
    const d = Math.hypot(dx, dy);
    const min = r + p.r;
    if (d < min && d > 0) {
      body.x = p.x + (dx / d) * min;
      body.y = p.y + (dy / d) * min;
    }
  }
}
