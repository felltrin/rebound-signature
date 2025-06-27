import * as THREE from "three";
import SceneInit from "./SceneInit";

export default class DevEnvironment {
  boxGeometry: THREE.BoxGeometry | undefined;
  boxMaterial: THREE.MeshBasicMaterial | undefined;
  box: THREE.Mesh | undefined;
  groundGeometry: THREE.PlaneGeometry | undefined;
  groundMaterial: THREE.MeshPhongMaterial | undefined;
  ground: THREE.Mesh | undefined;
  mapLoader: THREE.TextureLoader | undefined;
  checkerboard: THREE.Texture | undefined;
  sceneInit: SceneInit;

  constructor(sceneInit: SceneInit) {
    // provides the basic three js scene properties
    this.sceneInit = sceneInit;

    // NOTE: box
    this.boxGeometry = undefined;
    this.boxMaterial = undefined;
    this.box = undefined;

    // NOTE: plane
    this.groundGeometry = undefined;
    this.groundMaterial = undefined;
    this.ground = undefined;

    // NOTE: checkerboard params
    this.mapLoader = undefined;
    this.checkerboard = undefined;
  }

  initialize() {
    this.boxGeometry = new THREE.BoxGeometry(16, 16, 1);
    this.boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.box = new THREE.Mesh(this.boxGeometry, this.boxMaterial);
    this.box.position.set(0, 1, 0);
    this.box.castShadow = true;
    this.box.receiveShadow = true;

    this.groundGeometry = new THREE.PlaneGeometry(100, 100, 10, 10);
    this.groundMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    this.ground = new THREE.Mesh(this.groundGeometry, this.groundMaterial);
    this.ground.castShadow = false;
    this.ground.receiveShadow = true;
    this.ground.rotation.x = -Math.PI / 2;

    this.mapLoader = new THREE.TextureLoader();
    const maxAnisotropy =
      this.sceneInit.renderer?.capabilities.getMaxAnisotropy;
    this.checkerboard = this.mapLoader.load("/checkerboard.png");
    this.checkerboard.anisotropy = maxAnisotropy;
    this.checkerboard.wrapS = THREE.RepeatWrapping;
    this.checkerboard.wrapT = THREE.RepeatWrapping;
    this.checkerboard.repeat.set(32, 32);
    this.checkerboard.colorSpace = THREE.SRGBColorSpace;

    if (this.sceneInit.scene) {
      this.sceneInit.scene.background = new THREE.CubeTextureLoader()
        .setPath("/skybox/")
        .load([
          "posx.jpg",
          "negx.jpg",
          "posy.jpg",
          "negy.jpg",
          "posz.jpg",
          "negz.jpg",
        ]);
      this.sceneInit.scene.add(this.ground);
      this.sceneInit.scene.add(this.box);
    }
  }
}
