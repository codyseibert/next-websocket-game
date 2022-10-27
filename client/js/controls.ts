import { TControlMap } from "../../src/constants";
import {
  emitControls,
  emitJump,
  emitMoveLeft,
  emitMoveRight,
  emitUse,
} from "./socket";

export enum CTR_ACTIONS {
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
  JUMP = "jump",
  USE = "use",
}

export type KeyMap = Record<string, CTR_ACTIONS>;

let keyMap: KeyMap = {};
export const defaultKeymap: KeyMap = {
  w: CTR_ACTIONS.UP,
  s: CTR_ACTIONS.DOWN,
  a: CTR_ACTIONS.LEFT,
  d: CTR_ACTIONS.RIGHT,
  e: CTR_ACTIONS.USE,
  " ": CTR_ACTIONS.JUMP,
};

export const activeControls: TControlMap = {
  up: false,
  down: false,
  left: false,
  right: false,
  use: false,
  jump: false,
};

document.addEventListener("keydown", (e) => {
  activeControls[keyMap[e.key]] = true;

  if (keyMap[e.key] === CTR_ACTIONS.JUMP) {
    emitJump();
  }

  if (keyMap[e.key] === CTR_ACTIONS.USE) {
    emitUse();
  }
});

document.addEventListener("keyup", (e) => {
  activeControls[keyMap[e.key]] = false;
});

export function setKeymap(map: KeyMap) {
  keyMap = map;
}

export function getKeymap(): KeyMap {
  return { ...keyMap };
}

export function isCommandDown(command: CTR_ACTIONS) {
  return !!activeControls[command];
}

export function getClientControls() {
  return activeControls;
}
