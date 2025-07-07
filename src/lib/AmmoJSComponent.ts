import * as THREE from "three";
import { entity } from "./Entity";

export const ammojs_component = (() => {
  class RigidBody {
    transform_: Ammo.btTransform | undefined;
    motionState_: Ammo.btDefaultMotionState | undefined;
    shape_: Ammo.btBoxShape | undefined;
    inertia_: Ammo.btVector3 | undefined;
    info_: Ammo.btRigidBodyConstructionInfo | undefined;
    body_: Ammo.btRigidBody | undefined;

    constructor() {
      this.transform_ = undefined;
      this.motionState_ = undefined;
      this.shape_ = undefined;
      this.inertia_ = undefined;
      this.info_ = undefined;
      this.body_ = undefined;
    }

    Destroy() {
      Ammo.Destroy(this.transform_);
      Ammo.Destroy(this.motionState_);
      Ammo.Destroy(this.shape_);
      Ammo.Destroy(this.inertia_);
      Ammo.Destroy(this.info_);
      Ammo.Destroy(this.body_);

      if (this.mesh_) {
        Ammo.Destory(this.mesh_);
      }
    }

    setRestitution(val) {
      this.body_.setRestitution(val);
    }

    setFriction(val) {
      this.body_.setFriction(val);
    }

    setRollingFriction(val) {
      this.body_.setRollingFriction(val);
    }

    InitBox(
      mass: number,
      pos: THREE.Vector3,
      quat: THREE.Quaternion,
      size: THREE.Vector3
    ) {
      this.transform_ = new Ammo.btTransform();
      this.transform_.setIdentity();
      this.transform_.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      this.transform_.setRotation(
        new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
      );
      this.motionState_ = new Ammo.btDefaultMotionState(this.transform_);

      const btSize = new Ammo.btVector3(
        size.x * 0.5,
        size.y * 0.5,
        size.z * 0.5
      );
      this.shape_ = new Ammo.btBoxShape(btSize);
      this.shape_.setMargin(0.05);

      this.inertia_ = new Ammo.btVector3(0, 0, 0);
      if (mass > 0) {
        this.shape_.calculateLocalInertia(mass, this.inertia_);
      }

      this.info_ = new Ammo.btRigidBodyConstructionInfo(
        mass,
        this.motionState_,
        this.shape_,
        this.inertia_
      );
      this.body_ = new Ammo.btRigidBody(this.info_);

      Ammo.destroy(btSize);
    }
  }

  class AmmoJSController extends entity.Component {
    static CLASS_NAME = "AmmoJSController";
    collisionConfiguration_: Ammo.btDefaultCollisionConfiguration | undefined;
    broadphase_: Ammo.btDbvtBroadphase | undefined;
    solver_: Ammo.btSequentialImpulseConstraintSolver | undefined;
    dispatcher_: Ammo.btCollisionDispatcher | undefined;
    physicsWorld_: Ammo.btDiscreteDynamicsWorld | undefined;
    tmpTransform_: Ammo.btTransform | undefined;
    rigidBodies: { mesh: THREE.Mesh; rigidBody: any }[];

    get NAME() {
      return AmmoJSController.CLASS_NAME;
    }

    constructor() {
      super();
      this.tmpTransform_ = undefined;
      this.collisionConfiguration_ = undefined;
      this.broadphase_ = undefined;
      this.solver_ = undefined;
      this.dispatcher_ = undefined;
      this.physicsWorld_ = undefined;
      this.rigidBodies = [];
    }

    Destroy() {
      Ammo.Destroy(this.physicsWorld_);
      Ammo.Destory(this.solver_);
      Ammo.Destory(this.broadphase_);
      Ammo.Destory(this.dispatcher_);
      Ammo.Destory(this.collisionConfiguration_);
    }

    InitEntity() {
      this.collisionConfiguration_ = new Ammo.btDefaultCollisionConfiguration();
      this.dispatcher_ = new Ammo.btCollisionDispatcher(
        this.collisionConfiguration_
      );
      this.broadphase_ = new Ammo.btDbvtBroadphase();
      this.solver_ = new Ammo.btSequentialImpulseConstraintSolver();
      this.physicsWorld_ = new Ammo.btDiscreteDynamicsWorld(
        this.dispatcher_,
        this.broadphase_,
        this.solver_,
        this.collisionConfiguration_
      );
      this.physicsWorld_.setGravity(new Ammo.btVector3(0, -10, 0));
      this.tmpTransform_ = new Ammo.btTransform();
    }

    // similar to StepSimulation
    // rigidBodyUpdate(timeElapsedS: number | undefined) {
    RigidBodyUpdate(timeElapsedS: number | undefined) {
      this.physicsWorld_.stepSimulation(timeElapsedS, 10);
      for (let i = 0; i < this.rigidBodies.length; ++i) {
        this.rigidBodies[i].rigidBody.motionState_.getWorldTransform(
          this.tmpTransform_
        );
        const pos = this.tmpTransform_.getOrigin();
        const quat = this.tmpTransform_.getRotation();
        const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z());
        const quat3 = new THREE.Quaternion(
          quat.x(),
          quat.y(),
          quat.z(),
          quat.w()
        );

        this.rigidBodies[i].mesh.position.copy(pos3);
        this.rigidBodies[i].mesh.quaternion.copy(quat3);
      }
    }

    CreateBox(
      mass: number,
      pos: THREE.Vector3,
      quat: THREE.Quaternion,
      size: THREE.Vector3
    ) {
      const box = new RigidBody();
      box.InitBox(mass, pos, quat, size);

      this.physicsWorld_.addRigidBody(box.body_);

      box.setRestitution(0.5);
      box.setFriction(1);
      box.setRollingFriction(5);

      return box;
    }
  }

  return {
    AmmoJSController: AmmoJSController,
  };
})();
