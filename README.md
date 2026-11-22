# The Marlowe Sapphire

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Joppy26/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Joppy26/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A one-room heist game, built for the [make.fun best heist game bounty](https://make.fun/bounty/best-heist-game-20261122-0559).

You are the thief. Cross the Marlowe Gallery, lift the sapphire from its pedestal,
and slip out the exit door — while three guards walk their patrols, two cameras
sweep the room, and one alarm meter decides whether the night ends in a getaway
or a cell.

## How to play

- **Move:** WASD or arrow keys. Hold **Shift** to sneak — slower, but guards and
  cameras fill the alarm half as fast.
- **Distract:** click the floor to toss a coin (you carry 3). Nearby guards leave
  their route to investigate the noise.
- **Steal:** stand beside the pedestal and hold **E** to lift the Marlowe Sapphire.
  The exit door opens only once it is in your pocket.
- **Escape:** reach the EXIT door on the east wall with the sapphire.
- **Lose:** the alarm hits 100%, or a guard lays a hand on you.

Read before you move: guard vision cones and camera sweeps are drawn on the floor,
and display cases and pillars block sight. Three lanes cross the room — the west
lane past the cases, the middle lane between the pillars, and the red-carpet lane
down the centre, the fastest and the most watched. Gems on the display cases are
worth points but never required, so a careful thief can skip them entirely.

## Run it

Static files, no build step, no network request:

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `game/` with any static HTTP server and open `game/index.html`.

## Shots

`?shot=cover`, `?shot=spotted`, `?shot=alarm` and `?shot=getaway` stage
deterministic frames of the real game for screenshots.

## License

MIT. See [LICENSE](LICENSE).
