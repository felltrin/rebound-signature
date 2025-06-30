import { useEffect } from "react";

import * as THREE from "three";

import SceneInit from "./lib/SceneInit";

function App() {
  useEffect(() => {
    const test = new SceneInit("myThreeJsCanvas");
    test.initialize();
    test.animate();

    const mapLoader = new THREE.TextureLoader();
    const maxAnisotropy = test.renderer.capabilities.getMaxAnisotropy();
    const checkerboard = mapLoader.load("/checkerboard.png");
    checkerboard.anisotropy = maxAnisotropy;
    checkerboard.wrapS = THREE.RepeatWrapping;
    checkerboard.wrapT = THREE.RepeatWrapping;
    checkerboard.repeat.set(32, 32);
    checkerboard.colorSpace = THREE.SRGBColorSpace;

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100, 10, 10),
      new THREE.MeshStandardMaterial({ map: checkerboard })
    );
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(0, -2, 0);

    const boxGeometry = new THREE.BoxGeometry(4, 4, 4);
    const box = new THREE.Mesh(
      boxGeometry,
      loadMaterial_("vintage-tile1_", 0.2)
    );
    box.position.set(10, 0, 0);
    box.castShadow = true;
    box.receiveShadow = true;

    const concreteMaterial = loadMaterial_("concrete3-", 4);

    const wall1 = new THREE.Mesh(
      new THREE.BoxGeometry(100, 50, 4),
      concreteMaterial
    );
    wall1.position.set(0, -10, -50);
    wall1.castShadow = true;
    wall1.receiveShadow = true;

    const wall2 = new THREE.Mesh(
      new THREE.BoxGeometry(100, 50, 4),
      concreteMaterial
    );
    wall2.position.set(0, -10, 50);
    wall2.castShadow = true;
    wall2.receiveShadow = true;

    const wall3 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 50, 100),
      concreteMaterial
    );
    wall3.position.set(50, -10, 0);
    wall3.castShadow = true;
    wall3.receiveShadow = true;

    const wall4 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 50, 100),
      concreteMaterial
    );
    wall4.position.set(-50, -10, 0);
    wall4.castShadow = true;
    wall4.receiveShadow = true;

    const meshes = [plane, box, wall1, wall2, wall3, wall4];

    const objects = [];

    for (let i = 0; i < meshes.length; ++i) {
      const b = new THREE.Box3();
      b.setFromObject(meshes[i]);
      objects.push(b);
    }

    if (test.fpsCamera) {
      test.fpsCamera.objects = objects;
    }

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
      test.scene.add(wall1);
      test.scene.add(wall2);
      test.scene.add(wall3);
      test.scene.add(wall4);
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
