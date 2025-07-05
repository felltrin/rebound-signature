import * as THREE from "three";
import { entity } from "./Entity";

export const ammojs_component = (() => {
  class RigidBody {
    transform: Ammo.btTransform | undefined;
    motionState: Ammo.btDefaultMotionState | undefined;
    shape: Ammo.btBoxShape | undefined;
    inertia: Ammo.btVector3 | undefined;
    info: Ammo.btRigidBodyConstructionInfo | undefined;
    body: Ammo.btRigidBody | undefined;

    constructor() {
      this.transform = undefined;
      this.motionState = undefined;
      this.shape = undefined;
      this.inertia = undefined;
      this.info = undefined;
      this.body = undefined;
    }

    setRestitution(val) {
      this.body.setRestitution(val);
    }

    setFriction(val) {
      this.body.setFriction(val);
    }

    setRollingFriction(val) {
      this.body.setRollingFriction(val);
    }

    initBox(
      mass: number,
      pos: THREE.Vector3,
      quat: THREE.Quaternion,
      size: THREE.Vector3
    ) {
      this.transform = new Ammo.btTransform();
      this.transform.setIdentity();
      this.transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      this.transform.setRotation(
        new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
      );
      this.motionState = new Ammo.btDefaultMotionState(this.transform);

      const btSize = new Ammo.btVector3(
        size.x * 0.5,
        size.y * 0.5,
        size.z * 0.5
      );
      this.shape = new Ammo.btBoxShape(btSize);
      this.shape.setMargin(0.05);

      this.inertia = new Ammo.btVector3(0, 0, 0);
      if (mass > 0) {
        this.shape.calculateLocalInertia(mass, this.inertia);
      }

      this.info = new Ammo.btRigidBodyConstructionInfo(
        mass,
        this.motionState,
        this.shape,
        this.inertia
      );
      this.body = new Ammo.btRigidBody(this.info);

      Ammo.destroy(btSize);
    }
  }

  class AmmoJSController extends entity.Component {
    collisionConfiguration: Ammo.btDefaultCollisionConfiguration | undefined;
    broadphase: Ammo.btDbvtBroadphase | undefined;
    solver: Ammo.btSequentialImpulseConstraintSolver | undefined;
    dispatcher: Ammo.btCollisionDispatcher | undefined;
    physicsWorld: Ammo.btDiscreteDynamicsWorld | undefined;
    tmpTransform: Ammo.btTransform | undefined;
    rigidBodies: { mesh: THREE.Mesh; rigidBody: any }[];

    constructor() {
      super();
      this.tmpTransform = undefined;
      this.collisionConfiguration = undefined;
      this.broadphase = undefined;
      this.solver = undefined;
      this.dispatcher = undefined;
      this.physicsWorld = undefined;
      this.rigidBodies = [];
    }

    initialize() {
      this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
      this.dispatcher = new Ammo.btCollisionDispatcher(
        this.collisionConfiguration
      );
      this.broadphase = new Ammo.btDbvtBroadphase();
      this.solver = new Ammo.btSequentialImpulseConstraintSolver();
      this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
        this.dispatcher,
        this.broadphase,
        this.solver,
        this.collisionConfiguration
      );
      this.physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
      this.tmpTransform = new Ammo.btTransform();
    }

    rigidBodyUpdate(timeElapsedS: number | undefined) {
      this.physicsWorld.stepSimulation(timeElapsedS, 10);
      for (let i = 0; i < this.rigidBodies.length; ++i) {
        this.rigidBodies[i].rigidBody.motionState.getWorldTransform(
          this.tmpTransform
        );
        const pos = this.tmpTransform.getOrigin();
        const quat = this.tmpTransform.getRotation();
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

    createBox(
      mass: number,
      pos: THREE.Vector3,
      quat: THREE.Quaternion,
      size: THREE.Vector3
    ) {
      const box = new RigidBody();
      box.initBox(mass, pos, quat, size);

      this.physicsWorld.addRigidBody(box.body);

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
