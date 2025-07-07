import { entity } from "./Entity";
import { passes } from "./Passes";

export const player_input = (() => {
  const KEYS = {
    a: "a",
    s: "s",
    w: "w",
    d: "d",
    shift: "Shift",
  };

  class PlayerInput extends entity.Component {
    static CLASS_NAME = "PlayerInput";
    current:
      | {
          leftButton: boolean;
          rightButton: boolean;
          mouseX: number;
          mouseY: number;
          mouseXDelta: number;
          mouseYDelta: number;
        }
      | undefined;
    previous:
      | {
          leftButton: boolean;
          rightButton: boolean;
          mouseX: number;
          mouseY: number;
          mouseXDelta: number;
          mouseYDelta: number;
        }
      | undefined;
    keys: { [key: string]: boolean } | undefined;
    previousKeys: object | undefined;

    get NAME() {
      return PlayerInput.CLASS_NAME;
    }

    constructor(params) {
      // NOTE: general input state object
      super();
      this.params_ = params;

      this.current = undefined;
      this.previous = undefined;
      this.previousKeys = undefined;
    }

    InitEntity() {
      this.current = {
        leftButton: false,
        rightButton: false,
        mouseX: 0,
        mouseY: 0,
        mouseXDelta: 0,
        mouseYDelta: 0,
      };
      this.keys = {};
      this.previousKeys = {};
      // this.previous_ = null;

      document.addEventListener(
        "mousedown",
        (e) => this.onMouseDown_(e),
        false
      );
      document.addEventListener("mouseup", (e) => this.onMouseUp_(e), false);
      document.addEventListener(
        "mousemove",
        (e) => this.onMouseMove_(e),
        false
      );
      document.addEventListener("keydown", (e) => this.onKeyDown_(e), false);
      document.addEventListener("keyup", (e) => this.onKeyUp_(e), false);

      console.log(this.Parent);
      this.Parent.Attributes.Input = {
        Keyboard: {
          Current: this.keys,
          Previous: this.previousKeys,
        },
        Mouse: {
          Current: this.current,
          Previous: this.previous,
        },
      };

      this.SetPass(passes.INPUT);
    }

    onMouseDown_(e: MouseEvent) {
      this.onMouseMove_(e);

      switch (e.button) {
        case 0: {
          if (this.current) this.current.leftButton = true;
          break;
        }
        case 2: {
          if (this.current) this.current.rightButton = true;
          break;
        }
      }
    }

    onMouseUp_(e: MouseEvent) {
      this.onMouseMove_(e);

      switch (e.button) {
        case 0: {
          if (this.current) this.current.leftButton = false;
          break;
        }
        case 2: {
          if (this.current) this.current.rightButton = false;
          break;
        }
      }
    }

    onMouseMove_(e: MouseEvent) {
      if (this.current) {
        this.current.mouseX = e.pageX - window.innerWidth / 2;
        this.current.mouseY = e.pageY - window.innerHeight / 2;
      }

      if (this.previous === undefined && this.current) {
        this.previous = { ...this.current };
      }

      if (this.current && this.previous) {
        this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
        this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;
      }
    }

    onKeyDown_(e: KeyboardEvent) {
      if (this.keys) this.keys[e.key] = true;
    }

    onKeyUp_(e: KeyboardEvent) {
      if (this.keys) this.keys[e.key] = false;
    }

    key(key: string) {
      if (this.keys) return !!this.keys[key];
    }

    mouseLeftReleased(checkPrevious = true) {
      return !this.current?.leftButton && this.previous?.leftButton;
    }

    isReady() {
      return this.previous !== null;
    }

    Update(_: number) {
      if (this.previous && this.current) {
        this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
        this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;

        this.previous = { ...this.current };
        this.previousKeys = this.keys;
      }
    }
  }

  return {
    PlayerInput: PlayerInput,
    KEYS: KEYS,
  };
})();
