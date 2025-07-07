import * as THREE from "three";

import { player_input } from "./PlayerInput";
import { entity } from "./Entity";

import { passes } from "./Passes";
import { math } from "./Math";

export const first_person_camera = (() => {
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
    }

    onKeyUp(e: KeyboardEvent) {
      if (this.keys) this.keys[e.key] = false;
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

  class FirstPersonCamera extends entity.Component {
    static CLASS_NAME = "FirstPersonCamera";
    input: PlayerInput | undefined;
    objects: THREE.Box3[] | undefined;
    translation: THREE.Vector3;
    camera: THREE.PerspectiveCamera;
    rotation: THREE.Quaternion;
    phi: number;
    theta: number;
    phiSpeed: number;
    thetaSpeed: number;
    walkSpeed_: number;
    strafeSpeed_: number;

    get NAME() {
      return FirstPersonCamera.CLASS_NAME;
    }

    constructor(params) {
      super();

      this.params_ = params;
      this.camera = params.camera;
      this.group_ = new THREE.Group();
      this.params_.scene.add(this.group_);

      this.rotation = new THREE.Quaternion();
      this.translation = new THREE.Vector3();
      this.objects = undefined;
      this.input = undefined;

      // NOTE: extra things for translation
      this.phi = 0;
      this.theta = 0;
      this.phiSpeed = 0;
      this.thetaSpeed = 0;
      this.walkSpeed_ = 0;
      this.strafeSpeed_ = 0;
    }

    Destroy() {
      this.params_.scene.remove(this.group_);
    }

    InitEntity() {
      this.input = new PlayerInput();
      this.input.initialize();

      this.phi = 0;
      this.theta = 0;
      this.phiSpeed = 8;
      this.thetaSpeed = 5;
      this.walkSpeed_ = 10;
      this.strafeSpeed_ = 10;

      // Uncomment this when spawner is implemented
      // this.Parent.Attributes.FPSCamera = {
      //   group: this.group_,
      // };

      this.SetPass(passes.CAMERA);
    }

    Update(timeElapsed: number) {
      console.log("begin updating now");
      this.updateRotation(timeElapsed);
      this.updateCamera(timeElapsed);
      this.updateTranslation(timeElapsed);
      if (this.input) {
        this.input.update(timeElapsed);
      }

      // Uncomment this when spawner is implemented
      // this.Parent.SetPosition(this.translation);
      // this.Parent.SetQuaternion(this.rotation);
    }

    updateCamera(_: number) {
      this.camera.quaternion.copy(this.rotation);
      if (this.translation) this.camera.position.copy(this.translation);
      this.group_.position.copy(this.translation);
      this.group_.quaternion.copy(this.rotation);

      // const forward = new THREE.Vector3(0, 0, -1);
      // forward.applyQuaternion(this.rotation);

      // const dir = forward.clone();

      // forward.multiplyScalar(100);
      // if (this.translation) {
      //   forward.add(this.translation);
      // }

      // let closest = forward;
      // const result = new THREE.Vector3();
      // const ray = new THREE.Ray(this.translation, dir);
      // if (this.objects) {
      //   for (let i = 0; i < this.objects.length; ++i) {
      //     if (ray.intersectBox(this.objects[i], result)) {
      //       if (
      //         result.distanceTo(ray.origin) < closest.distanceTo(ray.origin)
      //       ) {
      //         closest = result.clone();
      //       }
      //     }
      //   }
      // }

      // this.camera.lookAt(closest);
    }

    updateTranslation(timeElapsed: number) {
      let forwardVelocity = 0;
      if (this.input?.key(player_input.KEYS.shift)) {
        forwardVelocity = this.input?.key(player_input.KEYS.w) ? 1.5 : 0;
      } else {
        forwardVelocity =
          (this.input?.key(player_input.KEYS.w) ? 1 : 0) +
          (this.input?.key(player_input.KEYS.s) ? -1 : 0);
      }
      const strafeVelocity =
        (this.input?.key(player_input.KEYS.a) ? 1 : 0) +
        (this.input?.key(player_input.KEYS.d) ? -1 : 0);

      const qx = new THREE.Quaternion();
      qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi);

      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(qx);
      forward.multiplyScalar(forwardVelocity * timeElapsed * this.walkSpeed_);

      const left = new THREE.Vector3(-1, 0, 0);
      left.applyQuaternion(qx);
      left.multiplyScalar(strafeVelocity * timeElapsed * this.strafeSpeed_);

      this.translation?.add(forward);
      this.translation?.add(left);

      // uncomment when KinematicCharacterController is implemented
      // const walk = forward.clone().add(left);

      // this.Parent.Attributes.Physics.CharacterController.setWalkDirection(walk);
      // const t = this.Parent.Attributes.Physics.CharacterController.body_.getWorldTransform();
      // const pos = t.getOrigin();
      // const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z());

      // this.translation_.lerp(pos3, 0.75);
    }

    updateRotation(timeElapsedS) {
      // Uncomment when spawner is implemented
      // const input = this.GetComponent("PlayerInput");

      let xh, yh;
      if (this.input && this.input.current) {
        xh = this.input.current.mouseXDelta / window.innerWidth;
        yh = this.input.current.mouseYDelta / window.innerHeight;
      }

      if (xh && yh) {
        this.phi += -xh * this.phiSpeed;
        this.theta = math.clamp(
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

      const t = 1.0 - Math.pow(0.01, 5 * timeElapsedS);
      this.rotation.slerp(q, t);
    }
  }

  return {
    FirstPersonCamera: FirstPersonCamera,
  };
})();
