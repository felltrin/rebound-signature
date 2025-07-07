import * as THREE from "three";

import { player_input } from "./PlayerInput";
import { entity } from "./Entity";

import { passes } from "./Passes";
import { math } from "./Math";

export const first_person_camera = (() => {
  class FirstPersonCamera extends entity.Component {
    static CLASS_NAME = "FirstPersonCamera";
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
      this.translation = new THREE.Vector3(0, 1, 0);
      this.objects = undefined;

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
      this.phi = 0;
      this.theta = 0;
      this.phiSpeed = 8;
      this.thetaSpeed = 5;
      this.walkSpeed_ = 10;
      this.strafeSpeed_ = 10;

      // Uncomment this when spawner is implemented
      this.Parent.Attributes.FPSCamera = {
        group: this.group_,
      };

      this.SetPass(passes.CAMERA);
    }

    Update(timeElapsed: number) {
      this.updateRotation(timeElapsed);
      this.updateCamera(timeElapsed);
      this.updateTranslation(timeElapsed);

      // Uncomment this when spawner is implemented
      this.Parent.SetPosition(this.translation);
      this.Parent.SetQuaternion(this.rotation);
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
      const input = this.GetComponent("PlayerInput");

      let forwardVelocity = 0;
      if (input.key(player_input.KEYS.shift)) {
        forwardVelocity = input.key(player_input.KEYS.w) ? 1.5 : 0;
      } else {
        forwardVelocity =
          (input.key(player_input.KEYS.w) ? 1 : 0) +
          (input.key(player_input.KEYS.s) ? -1 : 0);
      }
      const strafeVelocity =
        (input.key(player_input.KEYS.a) ? 1 : 0) +
        (input.key(player_input.KEYS.d) ? -1 : 0);

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
      const input = this.GetComponent("PlayerInput");

      const xh = input.current.mouseXDelta / window.innerWidth;
      const yh = input.current.mouseYDelta / window.innerHeight;

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
