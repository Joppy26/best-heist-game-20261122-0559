// The Marlowe Sapphire: a one-room heist. The thief crosses the gallery, lifts the
// sapphire from its pedestal, and reaches the exit before the alarm peaks.
// Loop: title -> play -> caught or escaped -> restart. One fixed timestep update,
// one draw per animation frame, and a frozen staged frame for ?shot= captures.
import { ROOM, ENTRANCE, EXIT, SAPPHIRE, SAPPHIRE_CHANNEL_SECONDS, createLevel, resolveCircle } from './level.js';
import { createGuards, updateGuards, guardSees, distractGuard } from './guards.js';
import { createCameras, updateCameras, cameraSees } from './cameras.js';
import { createInput, moveDirection, endFrame } from './input.js';
import { createSound } from './sound.js';
import { draw, SCREEN_TITLE, SCREEN_PLAY, SCREEN_CAUGHT, SCREEN_ESCAPED } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const input = createInput(canvas);
const sound = createSound();

const PLAYER_SPEED = 175;
const SNEAK_SPEED = 95;
const COIN_THROW_RANGE = 430;
const COIN_INVESTIGATE_RADIUS = 260;

const state = {
  screen: SCREEN_TITLE,
  time: 0,
  alarm: 0,
  score: 0,
  best: 0,
  coins: 3,
  message: '',
  messageT: 0,
  level: createLevel(),
  guards: createGuards(),
  cameras: createCameras(),
  player: {
    x: ENTRANCE.x,
    y: ENTRANCE.y,
    r: 14,
    sneak: false,
    moving: false,
    channel: 0,
    facing: -Math.PI / 2,
  },
  coinsThrown: [],
  stepT: 0,
  blipT: 0,
};

function say(text, seconds) {
  state.message = text;
  state.messageT = seconds || 3;
  status.textContent = text;
}

function reset() {
  state.screen = SCREEN_PLAY;
  state.time = 0;
  state.alarm = 0;
  state.score = 0;
  state.coins = 3;
  state.message = '';
  state.messageT = 0;
  state.level = createLevel();
  state.guards = createGuards();
  state.cameras = createCameras();
  state.player.x = ENTRANCE.x;
  state.player.y = ENTRANCE.y;
  state.player.channel = 0;
  state.player.sneak = false;
  state.coinsThrown = [];
  say('Cross the gallery. The sapphire waits on the pedestal.', 4);
}

function throwCoin(target) {
  if (state.coins <= 0) {
    say('No coins left. Move carefully.', 2);
    return;
  }
  const dx = target.x - state.player.x;
  const dy = target.y - state.player.y;
  if (Math.hypot(dx, dy) > COIN_THROW_RANGE) {
    say('Too far to throw. Get closer.', 2);
    return;
  }
  state.coins -= 1;
  const coin = { x: state.player.x, y: state.player.y, tx: target.x, ty: target.y, t: 0, ringing: false, ring: 0 };
  state.coinsThrown.push(coin);
  sound.coin();
}

function update(dt) {
  if (state.screen !== SCREEN_PLAY) return;
  state.time += dt;
  const player = state.player;
  const dir = moveDirection(input);
  player.sneak = input.keys.has('shift');
  const speed = player.sneak ? SNEAK_SPEED : PLAYER_SPEED;
  const len = Math.hypot(dir.x, dir.y);
  player.moving = len > 0;
  if (len > 0) {
    const nx = (dir.x / len) * speed * dt;
    const ny = (dir.y / len) * speed * dt;
    player.x += nx;
    player.y += ny;
    player.facing = Math.atan2(dir.y, dir.x);
    state.stepT += dt;
    if (state.stepT > (player.sneak ? 0.55 : 0.38)) {
      state.stepT = 0;
      sound.step();
    }
  }
  resolveCircle(player, player.r);

  // Thrown coins fly, land, ring, and pull nearby guards over to look.
  for (const coin of state.coinsThrown) {
    if (!coin.ringing) {
      coin.t += dt / 0.35;
      const k = Math.min(1, coin.t);
      coin.x = coin.x + (coin.tx - coin.x) * k * 0.4;
      coin.y = coin.y + (coin.ty - coin.y) * k * 0.4;
      if (k >= 1) {
        coin.ringing = true;
        coin.ring = 6;
        for (const guard of state.guards) {
          if (Math.hypot(guard.x - coin.x, guard.y - coin.y) < COIN_INVESTIGATE_RADIUS) {
            distractGuard(guard, coin.x, coin.y);
          }
        }
      }
    } else {
      coin.ring += dt * 120;
    }
  }
  state.coinsThrown = state.coinsThrown.filter((c) => !c.ringing || c.ring < 90);

  // Mouse: a click in the room throws a coin at that spot.
  if (input.clicked && input.clicked.y > 56) {
    throwCoin(input.clicked);
  }

  updateCameras(state.cameras, dt);

  // Eyes on the thief: guards and cameras both feed the same alarm meter.
  let seenByGuard = false;
  let seenByCamera = false;
  for (const guard of state.guards) {
    if (guardSees(guard, player.x, player.y)) seenByGuard = true;
  }
  for (const camera of state.cameras) {
    if (cameraSees(camera, player.x, player.y)) seenByCamera = true;
  }
  const sneakFactor = player.sneak ? 0.5 : 1;
  if (seenByGuard) state.alarm += 22 * sneakFactor * dt;
  if (seenByCamera) state.alarm += 30 * sneakFactor * dt;
  if (!seenByGuard && !seenByCamera) state.alarm = Math.max(0, state.alarm - 6 * dt);
  if (state.alarm > 0) {
    state.blipT -= dt;
    if (state.blipT <= 0) {
      state.blipT = state.alarm > 65 ? 0.45 : 1.1;
      sound.alarmBlip(state.alarm);
    }
  }
  state.alarm = Math.min(100, state.alarm);

  const caughtByGuard = updateGuards(state.guards, dt, player, state.alarm, seenByCamera);
  if (caughtByGuard || state.alarm >= 100) {
    endGame(false, caughtByGuard ? 'A guard caught you in the open.' : 'The alarm peaked. The doors locked.');
    return;
  }

  // Gems: walk over one to pocket it.
  for (const gem of state.level.gems) {
    if (!gem.taken && Math.hypot(gem.x - player.x, gem.y - player.y) < 30) {
      gem.taken = true;
      state.score += gem.value;
      sound.pickup();
      say(`Pocketed the ${gem.label} — +${gem.value}.`, 2);
    }
  }

  // The sapphire: stand at the pedestal and hold E to lift it.
  const nearPedestal = Math.hypot(SAPPHIRE.x - player.x, SAPPHIRE.y - player.y) < 62;
  if (!state.level.sapphireTaken && nearPedestal && input.keys.has('e')) {
    player.channel += dt / SAPPHIRE_CHANNEL_SECONDS;
    if (Math.floor(player.channel * 10) !== Math.floor((player.channel - dt / SAPPHIRE_CHANNEL_SECONDS) * 10)) {
      sound.channelTick();
    }
    if (player.channel >= 1) {
      state.level.sapphireTaken = true;
      state.score += 1000;
      player.channel = 0;
      sound.pickup();
      say('The Marlowe Sapphire is yours. Get to the EXIT door!', 4);
    }
  } else {
    player.channel = Math.max(0, player.channel - dt * 2);
  }

  // The getaway: the exit only opens once the sapphire is lifted.
  if (state.level.sapphireTaken) {
    if (player.x + player.r > EXIT.x && player.y > EXIT.y && player.y < EXIT.y + EXIT.h) {
      const timeBonus = Math.max(0, Math.round((180 - state.time) * 5));
      state.score += timeBonus;
      endGame(true, `Out in ${Math.floor(state.time)}s with a ${timeBonus} point time bonus.`);
      return;
    }
  } else if (player.x + player.r > EXIT.x - 4 && player.y > EXIT.y && player.y < EXIT.y + EXIT.h) {
    say('Locked. The exit opens only once the sapphire is lifted.', 2);
    player.x = EXIT.x - 4 - player.r;
  }

  if (state.messageT > 0) {
    state.messageT -= dt;
    if (state.messageT <= 0) state.message = '';
  }
}

function endGame(won, note) {
  state.screen = won ? SCREEN_ESCAPED : SCREEN_CAUGHT;
  state.best = Math.max(state.best, state.score);
  status.textContent = note;
  if (won) sound.win();
  else sound.caught();
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000 || 0);
  frame.last = now;
  if (!frame.frozen) {
    if (state.screen === SCREEN_TITLE && (input.pressedKeys.has('enter') || input.clicked)) {
      sound.ensure();
      sound.click();
      reset();
    } else if ((state.screen === SCREEN_CAUGHT || state.screen === SCREEN_ESCAPED) && input.pressedKeys.has('r')) {
      sound.ensure();
      reset();
    } else if (state.screen === SCREEN_TITLE && input.clicked) {
      sound.ensure();
    }
    update(dt);
  }
  draw(ctx, state);
  endFrame(input);
}

// Staged captures: ?shot=cover|spotted|alarm|getaway freezes one honest frame of the
// real game, so a screenshot is a render of the code, not a mock-up.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(shot, state);
  frame.frozen = true;
  state.screen = SCREEN_PLAY;
  draw(ctx, state);
}

canvas.width = ROOM.width;
canvas.height = ROOM.height;
requestAnimationFrame(frame);
