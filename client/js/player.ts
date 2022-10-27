import playerRUrl from "../images/playerR.png";
import playerLUrl from "../images/playerL.png";
import playerR_2Url from "../images/playerR_2.png";
import playerL_2Url from "../images/playerL_2.png";
import playerR_1Url from "../images/playerR_1.png";
import playerL_1Url from "../images/playerL_1.png";
import bgUrl from "../images/bg.png";
import zombieRUrl from "../images/zombieR.png";
import zombieLUrl from "../images/zombieL.png";

import {
  DRAW_HITBOX,
  INTERPOLATE_RATE,
  INTERPOLATION_SPEED,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
} from "./constants";
import {
  emitJump,
  emitMoveLeft,
  emitMoveRight,
  emitUse,
  getMyPlayerId,
} from "./socket";
import { Camera } from "./camera";
import { CONTROLS, TICK_RATE } from "../../src/constants";
import { getClientControls } from "./controls";
import { handlePlayerXMovement } from "../../src/physics/handlePlayerXMovement";
import { handlePlayerYMovement } from "../../src/physics/handlePlayerYMovement";
import { getCollidables } from "./map";
import { handlePlayerJump } from "../../src/physics/handlePlayerJump";

const bgImage = new Image();
bgImage.src = bgUrl;
const playerImageR = new Image();
playerImageR.src = playerRUrl;
const playerImageL = new Image();
playerImageL.src = playerLUrl;
const playerImageR_2 = new Image();
playerImageR_2.src = playerR_2Url;
const playerImageL_2 = new Image();
playerImageL_2.src = playerL_2Url;
const playerImageR_1 = new Image();
playerImageR_1.src = playerR_1Url;
const playerImageL_1 = new Image();
playerImageL_1.src = playerL_1Url;
const zombieImageR = new Image();
zombieImageR.src = zombieRUrl;
const zombieImageL = new Image();
zombieImageL.src = zombieLUrl;

let players: TPlayer[] = [];

type TInterpolation = {
  x: number;
  y: number;
  t: number;
};

const interpolations: Record<string, TInterpolation> = {};

export function getInterpolations() {
  return interpolations;
}

const drawPlayerFactory =
  (ctx: CanvasRenderingContext2D, player: TPlayer, camera: Camera) =>
  (leftImage, rightImage) => {
    ctx.drawImage(
      player.facingRight ? rightImage : leftImage,
      0,
      0,
      PLAYER_WIDTH,
      PLAYER_HEIGHT,
      player.x - camera.cx,
      player.y - camera.cy,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );
  };

export function drawPlayers(ctx: CanvasRenderingContext2D, camera: Camera) {
  for (let player of players) {
    const drawPlayer = drawPlayerFactory(ctx, player, camera);

    if (DRAW_HITBOX) {
      ctx.fillRect(
        interpolations[player.id].x - camera.cx,
        interpolations[player.id].y - camera.cy,
        PLAYER_WIDTH,
        PLAYER_HEIGHT
      );
    }

    if (player.isZombie) {
      drawPlayer(zombieImageL, zombieImageR);
    } else {
      switch (player.health) {
        case 3:
          drawPlayer(playerImageL, playerImageR);
          break;
        case 2:
          drawPlayer(playerImageL_2, playerImageR_2);
          break;
        case 1:
          drawPlayer(playerImageL_1, playerImageR_1);
          break;
      }
    }

    ctx.fillStyle = player.isZombie ? "#00FF00" : "#0000ff";
    ctx.font = `16px Verdana`;
    ctx.fillText(
      player.name,
      player.x - 10 - camera.cx,
      player.y - 10 - camera.cy
    );
  }
}

let canJump = true;

export function updatePlayers(delta: number) {
  const myPlayer = getMyPlayer();
  const clientControls = getClientControls();
  if (myPlayer) {
    handlePlayerXMovement(myPlayer, delta, clientControls, () => {
      emitMoveRight(delta);
    });
    handlePlayerYMovement(
      myPlayer,
      delta,
      () => (canJump = true),
      getCollidables
    );
    handlePlayerJump(
      myPlayer,
      canJump,
      clientControls,
      () => (canJump = false)
    );

    // const target = interpolations[myPlayer.id];
    // const dx = target.x - myPlayer.x;
    // const dy = target.y - myPlayer.y;
    // const distance = Math.sqrt(dx * dx + dy * dy);
    // if (distance > 300) {
    //   myPlayer.x = target.x;
    //   myPlayer.y = target.y;
    // }
  }

  // for (let player of players) {
  //   const target = interpolations[player.id];
  //   if (!target) continue;
  //   if (player.id === getMyPlayerId()) continue;
  //   const t = target.t / (1000 / TICK_RATE);
  //   const tx = Math.abs(target.x - player.x)
  //   player.x = player.x * (1 - t) + t * target.x;
  //   player.y = player.y * (1 - t) + t * target.y;
  //   target.t += delta;
  // }
}

export function interpolatePlayers(delta: number) {
  for (let player of players) {
    const target = interpolations[player.id];
    if (!target) continue;
    if (player.id === getMyPlayerId()) continue;
    const t = target.t / (1000 / 4);
    player.x = player.x * (1 - t) + t * target.x;
    player.y = player.y * (1 - t) + t * target.y;
    target.t += delta;
  }
}

export function setPlayers(newPlayers: TPlayer[]) {
  // someone new joined
  for (const player of newPlayers) {
    if (!players.find((p) => p.id === player.id)) {
      players.push(player);
      interpolations[player.id] = {
        x: player.x,
        y: player.y,
        t: 0,
      };
    }
  }

  // someone left
  for (const player of players) {
    const index = newPlayers.findIndex((p) => p.id === player.id);
    const playerIndex = players.findIndex((p) => p.id === player.id);
    if (index === -1) {
      players.splice(playerIndex, 1);
      delete interpolations[player.id];
    }
  }

  // sync players with server state
  for (const player of newPlayers) {
    const matchingPlayer = players.find((p) => p.id === player.id);
    if (!matchingPlayer) continue;
    const { x, y, vx, vy, ...props } = player;
    Object.assign(matchingPlayer, props);
    interpolations[player.id].y = player.y;
    interpolations[player.id].x = player.x;
    interpolations[player.id].t = 0;
  }
}

export function getMyPlayer() {
  return players.find((player) => player.id === getMyPlayerId());
}

export function getPlayers() {
  return players;
}
