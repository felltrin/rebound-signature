import * as THREE from "three";

const KEYS = {
  a: "a",
  s: "s",
  w: "w",
  d: "d",
};

function clamp(x: number, a: number, b: number) {
  return Math.min(Math.max(x, a), b);
}

class PlayerInput {
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

  constructor() {
    // NOTE: general input state object
    this.current = undefined;
    this.previous = undefined;
    this.previousKeys = undefined;
  }

  initialize() {
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

    document.addEventListener("mousedown", (e) => this.onMouseDown(e), false);
    document.addEventListener("mouseup", (e) => this.onMouseUp(e), false);
    document.addEventListener("mousemove", (e) => this.onMouseMove(e), false);
    document.addEventListener("keydown", (e) => this.onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this.onKeyUp(e), false);
  }

  onMouseDown(e: MouseEvent) {
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

  onMouseUp(e: MouseEvent) {
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

  onMouseMove(e: MouseEvent) {
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

  onKeyDown(e: KeyboardEvent) {
    if (this.keys) this.keys[e.key] = true;
    console.log(e.key);
  }

  onKeyUp(e: KeyboardEvent) {
    if (this.keys) this.keys[e.key] = false;
    console.log(e.key);
  }

  key(key: string) {
    if (this.keys) return !!this.keys[key];
  }

  update(_: number) {
    if (this.previous && this.current) {
      this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
      this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;

      this.previous = { ...this.current };
    }
  }
}

export default class FirstPersonCamera {
  translation: THREE.Vector3 | undefined;
  input: PlayerInput | undefined;
  objects: THREE.Box3[] | undefined;
  camera: THREE.PerspectiveCamera;
  rotation: THREE.Quaternion;
  phi: number;
  theta: number;
  phiSpeed: number;
  thetaSpeed: number;
  headBobActive: boolean;
  headBobTimer: number;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.rotation = new THREE.Quaternion();
    this.translation = new THREE.Vector3();
    this.objects = undefined;
    this.input = undefined;

    // NOTE: extra things for translation
    this.headBobActive = false;
    this.headBobTimer = 0;
    this.phi = 0;
    this.theta = 0;
    this.phiSpeed = 8;
    this.thetaSpeed = 5;
  }

  initialize() {
    this.input = new PlayerInput();
    this.input.initialize();
  }

  update(timeElapsed: number) {
    this.updateRotation();
    this.updateCamera(timeElapsed);
    this.updateTranslation(timeElapsed);
    this.updateHeadBob(timeElapsed);
    if (this.input) {
      this.input.update(timeElapsed);
    }
  }

  updateHeadBob(timeElapsed: number) {
    if (this.headBobActive) {
      const waveLength = Math.PI;
      const nextStep =
        1 + Math.floor(((this.headBobTimer + 0.000001) * 10) / waveLength);
      const nextStepTime = (nextStep * waveLength) / 10;
      this.headBobTimer = Math.min(
        this.headBobTimer + timeElapsed,
        nextStepTime
      );

      if (this.headBobTimer == nextStepTime) {
        this.headBobActive = false;
      }
    }
  }

  updateCamera(_: number) {
    this.camera.quaternion.copy(this.rotation);
    if (this.translation) this.camera.position.copy(this.translation);
    this.camera.position.y = Math.sin(this.headBobTimer * 10) * 0.5;

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.rotation);

    const dir = forward.clone();

    forward.multiplyScalar(100);
    if (this.translation) {
      forward.add(this.translation);
    }

    let closest = forward;
    const result = new THREE.Vector3();
    const ray = new THREE.Ray(this.translation, dir);
    if (this.objects) {
      for (let i = 0; i < this.objects.length; ++i) {
        if (ray.intersectBox(this.objects[i], result)) {
          if (result.distanceTo(ray.origin) < closest.distanceTo(ray.origin)) {
            closest = result.clone();
          }
        }
      }
    }

    this.camera.lookAt(closest);
  }

  updateTranslation(timeElapsed: number) {
    const forwardVelocity =
      (this.input?.key(KEYS.w) ? 1 : 0) + (this.input?.key(KEYS.s) ? -1 : 0);
    const strafeVelocity =
      (this.input?.key(KEYS.a) ? 1 : 0) + (this.input?.key(KEYS.d) ? -1 : 0);

    const qx = new THREE.Quaternion();
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi);

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(qx);
    forward.multiplyScalar(forwardVelocity * timeElapsed * 10);

    const left = new THREE.Vector3(-1, 0, 0);
    left.applyQuaternion(qx);
    left.multiplyScalar(strafeVelocity * timeElapsed * 10);

    this.translation?.add(forward);
    this.translation?.add(left);

    if (forwardVelocity != 0 || strafeVelocity != 0) {
      this.headBobActive = true;
    }
  }

  updateRotation() {
    let xh, yh;
    if (this.input && this.input.current) {
      xh = this.input.current.mouseXDelta / window.innerWidth;
      yh = this.input.current.mouseYDelta / window.innerHeight;
    }

    if (xh && yh) {
      this.phi += -xh * this.phiSpeed;
      this.theta = clamp(
        this.theta + -yh * this.thetaSpeed,
        -Math.PI / 3,
        Math.PI / 3
      );
    }

    const qx = new THREE.Quaternion();
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi);
    const qz = new THREE.Quaternion();
    qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta);

    const q = new THREE.Quaternion();
    q.multiply(qx);
    q.multiply(qz);

    this.rotation?.copy(q);
  }
}
