import { useEffect } from "react";

import * as THREE from "three";

import SceneInit from "./lib/SceneInit";
import { entity } from "./lib/Entity";
import { gltf_component } from "./lib/GLTFComponent";
import { entity_manager } from "./lib/EntityManager";

function App() {
  useEffect(() => {
    const test = new SceneInit("myThreeJsCanvas");
    test.initialize();
    test.animate();

    const boxGeometry = new THREE.BoxGeometry(4, 4, 4);
    const box = new THREE.Mesh(
      boxGeometry,
      loadMaterial_("vintage-tile1_", 0.2)
    );
    box.position.set(10, 0, 0);
    box.castShadow = true;
    box.receiveShadow = true;

    const entityManager = new entity_manager.EntityManager();
    // load fences
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
      fence.SetPosition(new THREE.Vector3(7.7 * i - 42.3, -2, -50 + 7.7 / 2));
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
      fence.SetPosition(new THREE.Vector3(7.7 * i - 42.3, -2, 50 - 7.7 / 2));
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
      fence.SetPosition(new THREE.Vector3(50 - 7.7 / 2, -2, 7.7 * i - 42.3));
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
      fence.SetPosition(new THREE.Vector3(-50 + 7.7 / 2, -2, 7.7 * i - 42.3));
      fence.SetQuaternion(q);
      entityManager.Add(fence);
      fence.SetActive(false);
    }

    const gravelMaterial = loadMaterial_("rocky-dunes1_", 100);

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100, 10, 10),
      gravelMaterial
    );
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(0, -2, 0);

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

      const metalMap = mapLoader.load("/freepbr/" + name + "metallic.png");
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

      const roughnessMap = mapLoader.load("/freepbr/" + name + "roughness.png");
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
  }, []);

  return (
    <>
      <canvas id="myThreeJsCanvas" />
    </>
  );
}

export default App;
