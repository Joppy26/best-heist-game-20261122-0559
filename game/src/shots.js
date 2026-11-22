// Staged screenshot scenes. Each one places the real game state — the same guards,
// cameras, loot and alarm the player meets — at fixed positions, so a capture is a
// deterministic frame of the game itself. Nothing here draws anything the game
// cannot draw; it only chooses where everyone stands.
import { SCREEN_PLAY } from './render.js';

function placeGuard(state, index, x, y, angle, mode, suspicion) {
  const guard = state.guards[index];
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.mode = mode || 'patrol';
  guard.suspicion = suspicion || 0;
}

export function stageShot(name, state) {
  state.screen = SCREEN_PLAY;
  state.time = 42;
  state.coins = 2;
  state.message = '';
  state.messageT = 0;
  state.coinsThrown = [];
  state.player.channel = 0;
  if (name === 'spotted') {
    // The thief frozen at the edge of Rook's cone, alarm climbing, Rook suspicious.
    state.alarm = 62;
    state.score = 200;
    state.level.gems[0].taken = true;
    state.level.gems[1].taken = true;
    state.player.x = 470;
    state.player.y = 340;
    state.player.sneak = true;
    placeGuard(state, 0, 560, 280, Math.PI / 4, 'investigate', 0.8);
    placeGuard(state, 1, 1050, 300, Math.PI, 'patrol', 0);
    placeGuard(state, 2, 700, 580, Math.PI, 'patrol', 0);
    state.cameras[0].angle = Math.PI / 2 - 0.6;
    state.cameras[1].angle = Math.PI + 0.4;
    state.message = 'Rook smells something. Move — now.';
    state.messageT = 99;
  } else if (name === 'alarm') {
    // The alarm nearly peaked, a camera has the thief, and the guards are hunting.
    state.alarm = 88;
    state.score = 300;
    state.level.gems[0].taken = true;
    state.level.gems[1].taken = true;
    state.level.gems[2].taken = true;
    state.player.x = 700;
    state.player.y = 470;
    state.player.sneak = false;
    placeGuard(state, 0, 640, 380, Math.PI / 3, 'chase', 1);
    placeGuard(state, 1, 980, 420, Math.PI * 0.85, 'chase', 1);
    placeGuard(state, 2, 520, 580, -Math.PI / 4, 'chase', 1);
    state.cameras[0].angle = Math.PI / 2 + 0.35;
    state.cameras[1].angle = Math.PI - 0.3;
    state.message = 'ALARM 88% — run for cover!';
    state.messageT = 99;
  } else if (name === 'getaway') {
    // Sapphire lifted, every gem pocketed, thief at the open exit door.
    state.alarm = 41;
    state.score = 1400;
    state.level.sapphireTaken = true;
    for (const gem of state.level.gems) gem.taken = true;
    state.player.x = 1200;
    state.player.y = 348;
    state.player.sneak = false;
    placeGuard(state, 0, 760, 280, Math.PI, 'patrol', 0.2);
    placeGuard(state, 1, 1050, 520, -Math.PI / 2, 'investigate', 0.4);
    placeGuard(state, 2, 420, 580, 0, 'patrol', 0);
    state.cameras[0].angle = Math.PI / 2 - 0.7;
    state.cameras[1].angle = Math.PI + 0.5;
    state.message = 'Sapphire secured. Out the door!';
    state.messageT = 99;
  } else {
    // Cover: the full room mid-heist — thief, cones, cameras, loot and alarm in one frame.
    state.alarm = 34;
    state.score = 200;
    state.level.gems[0].taken = true;
    state.level.gems[1].taken = true;
    state.player.x = 520;
    state.player.y = 480;
    state.player.sneak = true;
    placeGuard(state, 0, 620, 280, Math.PI / 3, 'patrol', 0.3);
    placeGuard(state, 1, 1050, 260, Math.PI / 2, 'patrol', 0);
    placeGuard(state, 2, 600, 580, Math.PI, 'patrol', 0);
    state.cameras[0].angle = Math.PI / 2 + 0.5;
    state.cameras[1].angle = Math.PI - 0.5;
    state.coinsThrown = [{ x: 760, y: 380, tx: 760, ty: 380, t: 1, ringing: true, ring: 40 }];
    state.message = 'Stay out of the cones. The sapphire is on the pedestal.';
    state.messageT = 99;
  }
}
