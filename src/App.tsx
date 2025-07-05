import { useEffect } from "react";

import * as THREE from "three";

import SceneInit from "./lib/SceneInit";
import { entity } from "./lib/Entity";
import { gltf_component } from "./lib/GLTFComponent";
import { entity_manager } from "./lib/EntityManager";
// import { ammojs_component } from "./lib/AmmoJsComponent";

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

  createBox(
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

    const btSize = new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
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

function App() {
  useEffect(() => {
    const ammoSetup = async () => {
      try {
        Ammo().then((lib) => {
          Ammo = lib;

          const test = new SceneInit("myThreeJsCanvas");
          test.initialize();
          test.animate();

          const entityManager = new entity_manager.EntityManager();
          // _LoadFences();

          const tileMaterial = loadMaterial_("vintage-tile1_", 0.2);
          const gravelMaterial = loadMaterial_("rocky-dunes1_", 100);

          const boxGeometry = new THREE.BoxGeometry(4, 4, 4);
          const box = new THREE.Mesh(boxGeometry, tileMaterial);
          box.position.set(10, 4, 0);
          box.castShadow = true;
          box.receiveShadow = true;

          const rbBox = new RigidBody();
          rbBox.createBox(
            1,
            box.position,
            box.quaternion,
            new THREE.Vector3(4, 4, 4)
          );
          rbBox.setRestitution(0.5);
          rbBox.setFriction(1);
          rbBox.setRollingFriction(5);
          test.physicsWorld.addRigidBody(rbBox.body);
          test.rigidBodies.push({ mesh: box, rigidBody: rbBox });

          const plane = new THREE.Mesh(
            // new THREE.PlaneGeometry(100, 100, 10, 10),
            new THREE.BoxGeometry(100, 1, 100),
            gravelMaterial
          );
          plane.castShadow = false;
          plane.receiveShadow = true;
          // plane.rotation.x = -Math.PI / 2;
          plane.position.set(0, -2, 0);

          const rbPlane = new RigidBody();
          rbPlane.createBox(
            0,
            plane.position,
            plane.quaternion,
            new THREE.Vector3(100, 1, 100)
          );
          test.physicsWorld.addRigidBody(rbPlane.body);

          if (test.scene) {
            test.scene.background = new THREE.CubeTextureLoader()
              .setPath("/skybox/")
              .load([
                "posx.jpg",
                "negx.jpg",
                "posy.jpg",
                "negy.jpg",
                "posz.jpg",
                "negz.jpg",
              ]);
            test.scene.add(box);
            test.scene.add(plane);
          }
          console.log("world loaded");

          /**
           * Loads in a material based on the textures in freepbr
           *
           * @param name specific texture the dev wants
           * @param tiling how many tiles are each mapping
           * @returns a mesh standard material to be used in a THREE.Mesh
           */
          function loadMaterial_(name: string, tiling: number) {
            const mapLoader = new THREE.TextureLoader();
            const maxAnisotropy = test.renderer.capabilities.getMaxAnisotropy();

            const metalMap = mapLoader.load(
              "/freepbr/" + name + "metallic.png"
            );
            metalMap.anisotropy = maxAnisotropy;
            metalMap.wrapS = THREE.RepeatWrapping;
            metalMap.wrapT = THREE.RepeatWrapping;
            metalMap.repeat.set(tiling, tiling);

            const albedo = mapLoader.load("/freepbr/" + name + "albedo.png");
            albedo.anisotropy = maxAnisotropy;
            albedo.wrapS = THREE.RepeatWrapping;
            albedo.wrapT = THREE.RepeatWrapping;
            albedo.repeat.set(tiling, tiling);
            albedo.colorSpace = THREE.SRGBColorSpace;

            const normalMap = mapLoader.load("/freepbr/" + name + "normal.png");
            normalMap.anisotropy = maxAnisotropy;
            normalMap.wrapS = THREE.RepeatWrapping;
            normalMap.wrapT = THREE.RepeatWrapping;
            normalMap.repeat.set(tiling, tiling);

            const roughnessMap = mapLoader.load(
              "/freepbr/" + name + "roughness.png"
            );
            roughnessMap.anisotropy = maxAnisotropy;
            roughnessMap.wrapS = THREE.RepeatWrapping;
            roughnessMap.wrapT = THREE.RepeatWrapping;
            roughnessMap.repeat.set(tiling, tiling);

            const material = new THREE.MeshStandardMaterial({
              metalnessMap: metalMap,
              map: albedo,
              normalMap: normalMap,
              roughnessMap: roughnessMap,
            });

            return material;
          }

          /**
           * Loads in the fence border for the map
           *
           * @returns void
           */
          function _LoadFences() {
            for (let i = 0; i < 12; i++) {
              const fence = new entity.Entity();
              fence.AddComponent(
                new gltf_component.StaticModelComponent({
                  scene: test.scene,
                  resourcePath: "/industrial/GLB/",
                  resourceName: "Fence.glb",
                  position: new THREE.Vector3(0, 0, 0),
                  scale: 1,
                })
              );
              entityManager.Add(fence);
              fence.SetActive(false);
              fence.SetPosition(
                new THREE.Vector3(7.7 * i - 42.3, -2, -50 + 7.7 / 2)
              );
            }

            for (let i = 0; i < 12; i++) {
              const fence = new entity.Entity();
              fence.AddComponent(
                new gltf_component.StaticModelComponent({
                  scene: test.scene,
                  resourcePath: "/industrial/GLB/",
                  resourceName: "Fence.glb",
                  position: new THREE.Vector3(0, 0, 0),
                  scale: 1,
                })
              );
              entityManager.Add(fence);
              fence.SetActive(false);
              fence.SetPosition(
                new THREE.Vector3(7.7 * i - 42.3, -2, 50 - 7.7 / 2)
              );
            }

            for (let i = 0; i < 12; i++) {
              const fence = new entity.Entity();
              const q = new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(0, 1, 0).normalize(),
                Math.PI / 2
              );
              fence.AddComponent(
                new gltf_component.StaticModelComponent({
                  scene: test.scene,
                  resourcePath: "/industrial/GLB/",
                  resourceName: "Fence.glb",
                  scale: 1,
                })
              );
              fence.SetPosition(
                new THREE.Vector3(50 - 7.7 / 2, -2, 7.7 * i - 42.3)
              );
              fence.SetQuaternion(q);
              entityManager.Add(fence);
              fence.SetActive(false);
            }

            for (let i = 0; i < 12; i++) {
              const fence = new entity.Entity();
              const q = new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(0, 1, 0).normalize(),
                Math.PI / 2
              );
              fence.AddComponent(
                new gltf_component.StaticModelComponent({
                  scene: test.scene,
                  resourcePath: "/industrial/GLB/",
                  resourceName: "Fence.glb",
                  scale: 1,
                })
              );
              fence.SetPosition(
                new THREE.Vector3(-50 + 7.7 / 2, -2, 7.7 * i - 42.3)
              );
              fence.SetQuaternion(q);
              entityManager.Add(fence);
              fence.SetActive(false);
            }
          }
        });
      } catch {
        console.log("failed to instantiate scene with ammo.js");
      }
    };
    ammoSetup();

    // const ammojs = new entity.Entity();
    // ammojs.AddComponent(new ammojs_component.AmmoJSController());
    // entityManager.Add(ammojs, "physics");

    // const ammojs_ = ammojs.GetComponent("AmmoJSController");

    // const meshes = [];

    // const objects = [];

    // for (let i = 0; i < meshes.length; ++i) {
    //   const b = new THREE.Box3();
    //   b.setFromObject(meshes[i]);
    //   objects.push(b);
    // }

    // if (test.fpsCamera) {
    //   test.fpsCamera.objects = objects;
    // }
  }, []);

  return (
    <>
      <canvas id="myThreeJsCanvas" />
    </>
  );
}

export default App;
