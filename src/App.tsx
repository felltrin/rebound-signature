import { useEffect } from "react";

import * as THREE from "three";

import SceneInit from "./lib/SceneInit";

function App() {
  useEffect(() => {
    const test = new SceneInit("myThreeJsCanvas");
    test.initialize();
    test.animate();

    const groundGeometry = new THREE.PlaneGeometry(100, 100, 10, 10);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.castShadow = false;
    ground.receiveShadow = true;
    ground.rotation.x = -Math.PI / 2;

    const boxGeometry = new THREE.BoxGeometry(16, 16, 1);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0, 1, 0);
    box.castShadow = true;
    box.receiveShadow = true;

    if (test.scene) {
      test.scene.add(ground);
      test.scene.add(box);
    }
  }, []);

  return (
    <>
      <canvas id="myThreeJsCanvas" />
    </>
  );
}

export default App;
