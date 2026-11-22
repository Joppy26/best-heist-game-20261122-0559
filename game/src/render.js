// Drawing: one top-down frame of the whole gallery, all in code, no images.
// Safe cover is dark wood and glass, danger is warm amber and red, loot glows
// violet, so the player can read the room at a glance. The HUD rides on top of
// the room so the alarm meter, loot, coins and time are always in the same frame.
import { ROOM, EXIT, SAPPHIRE } from './level.js';
import { GUARD_RANGE, GUARD_HALF_ANGLE } from './guards.js';
import { CAMERA_HALF_ANGLE as CAM_HALF } from './cameras.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

const FLOOR_A = '#241d18';
const FLOOR_B = '#2b231c';
const CARPET = '#4a1f2b';
const WALL = '#17120f';
const WALL_TOP = '#3a2c22';

function cone(ctx, x, y, angle, range, halfAngle, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawCone(ctx, x, y, angle, range, halfAngle, hot) {
  const alpha = hot ? 0.34 : 0.16;
  const color = hot ? '255, 70, 60' : '255, 200, 90';
  cone(ctx, x, y, angle, range, halfAngle, `rgba(${color}, ${alpha})`);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.strokeStyle = `rgba(${color}, 0.45)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx) {
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(0, 0, ROOM.width, ROOM.height);
  const tile = 80;
  for (let y = 0; y < ROOM.height; y += tile) {
    for (let x = 0; x < ROOM.width; x += tile) {
      if (((x + y) / tile) % 2 === 0) {
        ctx.fillStyle = FLOOR_B;
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }
  // The crimson runner down the middle: the boldest, most exposed route.
  ctx.fillStyle = CARPET;
  ctx.fillRect(560, ROOM.wall, 160, ROOM.height - ROOM.wall * 2);
  ctx.strokeStyle = 'rgba(232, 182, 76, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(564, ROOM.wall + 4, 152, ROOM.height - ROOM.wall * 2 - 8);
  // Skirting.
  ctx.fillStyle = WALL_TOP;
  ctx.fillRect(0, 0, ROOM.width, ROOM.wall);
  ctx.fillRect(0, ROOM.height - ROOM.wall, ROOM.width, ROOM.wall);
  ctx.fillRect(0, 0, ROOM.wall, ROOM.height);
  ctx.fillRect(ROOM.width - ROOM.wall, 0, ROOM.wall, ROOM.height);
}

function drawCasesAndPillars(ctx, level) {
  for (const b of level.blockers) {
    if (b.kind === 'pedestal') continue;
    ctx.fillStyle = '#101c26';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(160, 210, 235, 0.28)';
    ctx.fillRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);
    ctx.strokeStyle = '#c8a24a';
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(b.x + 10, b.y + b.h - 8);
    ctx.lineTo(b.x + b.w - 30, b.y + 8);
    ctx.stroke();
  }
  for (const p of level.pillars) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = '#3a2c22';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r - 6, 0, Math.PI * 2);
    ctx.fillStyle = '#57453a';
    ctx.fill();
    ctx.strokeStyle = '#c8a24a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPedestalAndLoot(ctx, level, time) {
  const ped = level.blockers.find((b) => b.kind === 'pedestal');
  ctx.fillStyle = '#1c1410';
  ctx.fillRect(ped.x, ped.y, ped.w, ped.h);
  ctx.strokeStyle = '#c8a24a';
  ctx.lineWidth = 3;
  ctx.strokeRect(ped.x, ped.y, ped.w, ped.h);
  for (const gem of level.gems) {
    if (gem.taken) continue;
    const pulse = 1 + Math.sin(time * 3 + gem.x) * 0.12;
    ctx.save();
    ctx.translate(gem.x, gem.y);
    ctx.scale(pulse, pulse);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#8be8ff';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeStyle = '#e8f8ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.restore();
  }
  if (!level.sapphireTaken) {
    const glow = 26 + Math.sin(time * 2.4) * 6;
    const grad = ctx.createRadialGradient(SAPPHIRE.x, SAPPHIRE.y, 4, SAPPHIRE.x, SAPPHIRE.y, glow + 26);
    grad.addColorStop(0, 'rgba(190, 120, 255, 0.85)');
    grad.addColorStop(1, 'rgba(190, 120, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(SAPPHIRE.x, SAPPHIRE.y, glow + 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(SAPPHIRE.x, SAPPHIRE.y - 6);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#c98aff';
    ctx.fillRect(-13, -13, 26, 26);
    ctx.strokeStyle = '#f2e4ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-13, -13, 26, 26);
    ctx.restore();
    ctx.fillStyle = '#f2e4ff';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE MARLOWE SAPPHIRE', SAPPHIRE.x, SAPPHIRE.y + 34);
  }
}

function drawExit(ctx, sapphireTaken, time) {
  const open = sapphireTaken;
  ctx.fillStyle = open ? '#1d3a24' : '#2c2118';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = open ? '#7be89a' : '#8a6a3a';
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = open ? '#b8ffcc' : '#c8a24a';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(EXIT.x - 14, EXIT.y + EXIT.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(open ? 'EXIT — GO!' : 'EXIT', 0, 0);
  ctx.restore();
  if (open) {
    ctx.fillStyle = `rgba(123, 232, 154, ${0.25 + Math.sin(time * 4) * 0.12})`;
    ctx.fillRect(EXIT.x - 60, EXIT.y - 8, 60, EXIT.h + 16);
  }
}

function drawGuards(ctx, guards) {
  for (const guard of guards) {
    const hot = guard.mode === 'chase' || guard.suspicion > 0.55;
    drawCone(ctx, guard.x, guard.y, guard.angle, GUARD_RANGE, GUARD_HALF_ANGLE, hot);
  }
  for (const guard of guards) {
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#20242c';
    ctx.fill();
    ctx.strokeStyle = guard.color;
    ctx.lineWidth = 3;
    ctx.stroke();
    // Facing tick and cap brim.
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * 20, guard.y + Math.sin(guard.angle) * 20);
    ctx.strokeStyle = guard.color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = guard.color;
    ctx.fill();
    // Suspicion "?" over a guard that smells something.
    if (guard.suspicion > 0.25 && guard.mode !== 'chase') {
      ctx.fillStyle = '#ffd25e';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, guard.y - 22);
    }
    if (guard.mode === 'chase') {
      ctx.fillStyle = '#ff5040';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 22);
    }
    ctx.fillStyle = '#e8ddc8';
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.name, guard.x, guard.y + 28);
  }
}

function drawCameras(ctx, cameras) {
  for (const camera of cameras) {
    drawCone(ctx, camera.x, camera.y, camera.angle, camera.range, CAM_HALF, false);
  }
  for (const camera of cameras) {
    ctx.fillStyle = '#20242c';
    ctx.strokeStyle = '#8be8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(camera.x, camera.y);
    ctx.lineTo(camera.x + Math.cos(camera.angle) * 16, camera.y + Math.sin(camera.angle) * 16);
    ctx.strokeStyle = '#8be8ff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ff5040';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, player, time) {
  const bob = Math.sin(time * 8) * (player.moving ? 1.5 : 0);
  // A soft violet ring under the thief so the player always reads at a glance,
  // even on the dark carpet.
  ctx.beginPath();
  ctx.arc(player.x, player.y + 10, 20, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(201, 138, 255, 0.18)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(player.x, player.y + 10, 20, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(201, 138, 255, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.save();
  ctx.translate(player.x, player.y + bob * 0.3);
  // Cloak.
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.quadraticCurveTo(13, -4, 11, 13);
  ctx.lineTo(-11, 13);
  ctx.quadraticCurveTo(-13, -4, 0, -16);
  ctx.fillStyle = player.sneak ? '#3a2c4a' : '#4a2c5a';
  ctx.fill();
  ctx.strokeStyle = '#c98aff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Hood and face shadow.
  ctx.beginPath();
  ctx.arc(0, -6, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#241a30';
  ctx.fill();
  ctx.strokeStyle = '#c98aff';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -6, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#e8ddc8';
  ctx.fill();
  ctx.restore();
  if (player.channel > 0) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * player.channel);
    ctx.strokeStyle = '#c98aff';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
}

function drawCoins(ctx, coins) {
  for (const coin of coins) {
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd25e';
    ctx.fill();
    ctx.strokeStyle = '#8a6a1a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (coin.ringing) {
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.ring, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 210, 94, ${Math.max(0, 1 - coin.ring / 90)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(10, 8, 6, 0.82)';
  ctx.fillRect(0, 0, ROOM.width, 52);
  ctx.strokeStyle = '#3a2c22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 52);
  ctx.lineTo(ROOM.width, 52);
  ctx.stroke();
  // Alarm meter.
  ctx.fillStyle = '#e8ddc8';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', 24, 32);
  const ax = 96;
  const aw = 300;
  ctx.fillStyle = '#1c1410';
  ctx.fillRect(ax, 16, aw, 20);
  const frac = state.alarm / 100;
  const grad = ctx.createLinearGradient(ax, 0, ax + aw, 0);
  grad.addColorStop(0, '#e8b64c');
  grad.addColorStop(0.65, '#e87c2c');
  grad.addColorStop(1, '#ff3b30');
  ctx.fillStyle = grad;
  ctx.fillRect(ax + 2, 18, Math.max(0, (aw - 4) * frac), 16);
  ctx.strokeStyle = '#c8a24a';
  ctx.lineWidth = 2;
  ctx.strokeRect(ax, 16, aw, 20);
  ctx.fillStyle = state.alarm >= 65 ? '#ff5040' : '#e8ddc8';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(`${Math.floor(state.alarm)}%`, ax + aw + 12, 32);
  if (state.alarm >= 65) {
    ctx.fillStyle = `rgba(255, 80, 64, ${0.6 + Math.sin(state.time * 6) * 0.4})`;
    ctx.fillText('HUNTED', ax + aw + 70, 32);
  }
  // Loot, tools, time.
  ctx.fillStyle = '#e8ddc8';
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'left';
  const gems = state.level.gems.filter((g) => g.taken).length;
  ctx.fillText(`Loot ${gems}/4 gems  ${state.level.sapphireTaken ? '◆ Sapphire!' : '◇ Sapphire'}`, 560, 32);
  ctx.fillText(`Coins ${state.coins}  •  Score ${state.score}`, 830, 32);
  const minutes = Math.floor(state.time / 60);
  const seconds = Math.floor(state.time % 60);
  ctx.textAlign = 'right';
  ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, ROOM.width - 24, 32);
  ctx.textAlign = 'left';
  if (state.message) {
    ctx.fillStyle = '#ffd25e';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, ROOM.width / 2, 78);
  }
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(8, 6, 5, 0.78)';
  ctx.fillRect(0, 0, ROOM.width, ROOM.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c98aff';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('THE MARLOWE SAPPHIRE', ROOM.width / 2, 210);
  ctx.fillStyle = '#e8b64c';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('One room. Three guards. Two cameras. One way out.', ROOM.width / 2, 258);
  ctx.fillStyle = '#e8ddc8';
  ctx.font = '18px Georgia, serif';
  const lines = [
    'WASD or arrows to move — hold SHIFT to sneak (slower, harder to spot).',
    'Click the floor to toss a coin: guards go look at the noise. You carry 3.',
    'Hold E beside the pedestal to lift the sapphire, then reach the EXIT door.',
    'If the alarm hits 100%, or a guard lays a hand on you, the night is over.',
    'Gems on the display cases are worth points. The red carpet is the fastest route — and the most watched.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, ROOM.width / 2, 320 + i * 30));
  const pulse = 0.75 + Math.sin(state.time * 3) * 0.25;
  ctx.fillStyle = `rgba(232, 182, 76, ${pulse})`;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('Press ENTER or click to begin the heist', ROOM.width / 2, 540);
  ctx.fillStyle = '#9a8a78';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('An original game. No likeness, music or level from any other game.', ROOM.width / 2, 590);
}

function drawEnd(ctx, state, won) {
  ctx.fillStyle = 'rgba(8, 6, 5, 0.8)';
  ctx.fillRect(0, 0, ROOM.width, ROOM.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#7be89a' : '#ff5040';
  ctx.font = 'bold 56px Georgia, serif';
  ctx.fillText(won ? 'CLEAN GETAWAY' : 'CAUGHT', ROOM.width / 2, 260);
  ctx.fillStyle = '#e8ddc8';
  ctx.font = '22px Georgia, serif';
  ctx.fillText(
    won
      ? `The sapphire is yours. Score ${state.score} — the gallery never saw you coming.`
      : 'The alarm hit its peak, or a guard caught up with you. The sapphire stays in its case.',
    ROOM.width / 2,
    320,
  );
  ctx.font = '18px Georgia, serif';
  ctx.fillText(`Score ${state.score}   •   Time ${Math.floor(state.time)}s   •   Best ${state.best}`, ROOM.width / 2, 370);
  const pulse = 0.75 + Math.sin(state.time * 3) * 0.25;
  ctx.fillStyle = `rgba(232, 182, 76, ${pulse})`;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('Press R to run it again', ROOM.width / 2, 440);
}

export function draw(ctx, state) {
  ctx.clearRect(0, 0, ROOM.width, ROOM.height);
  drawFloor(ctx);
  drawCasesAndPillars(ctx, state.level);
  drawPedestalAndLoot(ctx, state.level, state.time);
  drawExit(ctx, state.level.sapphireTaken, state.time);
  drawCameras(ctx, state.cameras);
  drawGuards(ctx, state.guards);
  drawCoins(ctx, state.coinsThrown);
  drawPlayer(ctx, state.player, state.time);
  drawHud(ctx, state);
  if (state.screen === SCREEN_TITLE) drawTitle(ctx, state);
  if (state.screen === SCREEN_CAUGHT) drawEnd(ctx, state, false);
  if (state.screen === SCREEN_ESCAPED) drawEnd(ctx, state, true);
}
