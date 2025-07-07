import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";

import { entity_manager } from "./EntityManager";
import { gltf_component } from "./GLTFComponent";
import { entity } from "./Entity";
import { ammojs_component } from "./AmmoJSComponent";
import { spawners } from "./Spawners";

type EntityManager = InstanceType<typeof entity_manager>;
type AmmoJSController = InstanceType<typeof ammojs_component>;

export default class SceneInit {
  scene: THREE.Scene | undefined;
  camera: THREE.PerspectiveCamera | undefined;
  renderer: THREE.WebGLRenderer | undefined;
  clock: THREE.Clock | undefined;
  ambientLight: THREE.AmbientLight | undefined;
  directionalLight: THREE.DirectionalLight | undefined;
  stats: Stats | undefined;
  entityManager: EntityManager | undefined;
  ammoJsController: AmmoJSController | undefined;
  uniforms: any;
  fov: number;
  nearPlane: number;
  farPlane: number;
  canvasId: string;

  constructor(canvasId: string) {
    // NOTE: Core components to initialize Three.js app.
    this.scene = undefined;
    this.camera = undefined;
    this.renderer = undefined;

    // NOTE: Camera params;
    this.fov = 60;
    this.nearPlane = 1;
    this.farPlane = 1000;
    this.canvasId = canvasId;

    // NOTE: Additional components.
    this.clock = undefined;
    this.stats = undefined;

    // NOTE: Lighting is basically required.
    this.ambientLight = undefined;
    this.directionalLight = undefined;

    // NOTE: Physics components
    this.ammoJsController = undefined;
    this.entityManager = undefined;
  }

  initialize() {
    this.entityManager = new entity_manager.EntityManager();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );

    // NOTE: Specify a canvas which is already created in the HTML.
    // const canvas = document.getElementById(this.canvasId);
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById(this.canvasId) as HTMLCanvasElement,
      // NOTE: Anti-aliasing smooths out the edges.
      antialias: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    // ambient light which is for the whole scene
    // this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    // this.ambientLight.castShadow = true;
    // this.ambientLight.receiveShadow = true;
    // this.scene.add(this.ambientLight);

    // directional light - parallel sun rays
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    // this.directionalLight.castShadow = true;
    this.directionalLight.position.set(0, 32, 64);
    this.scene.add(this.directionalLight);

    // if window resizes
    window.addEventListener("resize", () => this.onWindowResize(), false);

    // NOTE: Load space background.
    // this.loader = new THREE.TextureLoader();
    // this.scene.background = this.loader.load('./pics/space.jpeg');

    // NOTE: Declare uniforms to pass into glsl shaders.
    // this.uniforms = {
    //   u_time: { type: 'f', value: 1.0 },
    //   colorB: { type: 'vec3', value: new THREE.Color(0xfff000) },
    //   colorA: { type: 'vec3', value: new THREE.Color(0xffffff) },
    // };
    this._LoadFences();

    const tileMaterial = this.loadMaterial_("vintage-tile1_", 0.2);
    const gravelMaterial = this.loadMaterial_("rocky-dunes1_", 100);

    const boxGeometry = new THREE.BoxGeometry(4, 4, 4);
    const box = new THREE.Mesh(boxGeometry, tileMaterial);
    box.position.set(0, 4, -10);
    box.castShadow = true;
    box.receiveShadow = true;

    const plane = new THREE.Mesh(
      new THREE.BoxGeometry(100, 1, 100),
      gravelMaterial
    );
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.position.set(0, -2, 0);

    const ammojs = new entity.Entity();
    ammojs.AddComponent(new ammojs_component.AmmoJSController());
    this.entityManager.Add(ammojs, "physics");

    const ammojs_ = ammojs.GetComponent("AmmoJSController");
    this.ammoJsController = ammojs_;

    const rbBox = ammojs_.CreateBox(
      1,
      box.position,
      box.quaternion,
      new THREE.Vector3(4, 4, 4)
    );
    ammojs_.rigidBodies.push({ mesh: box, rigidBody: rbBox });

    const rbPlane = ammojs_.CreateBox(
      0,
      plane.position,
      plane.quaternion,
      new THREE.Vector3(100, 1, 100)
    );

    if (this.scene) {
      this.scene.background = new THREE.CubeTextureLoader()
        .setPath("/skybox/")
        .load([
          "posx.jpg",
          "negx.jpg",
          "posy.jpg",
          "negy.jpg",
          "posz.jpg",
          "negz.jpg",
        ]);
      this.scene.add(box);
      this.scene.add(plane);
    }

    const params = {
      camera: this.camera,
      scene: this.scene,
    };

    const spawner = new entity.Entity();
    spawner.AddComponent(new spawners.PlayerSpawner(params));
    this.entityManager.Add(spawner, "spawners");

    spawner.GetComponent("PlayerSpawner").Spawn();
  }

  animate() {
    // NOTE: Window is implied.
    // requestAnimationFrame(this.animate.bind(this));
    window.requestAnimationFrame(this.animate.bind(this));
    const t = this.clock?.getDelta();
    this.entityManager.Update(t);
    this.ammoJsController?.RigidBodyUpdate(t);
    this.render();
    if (this.stats && this.clock && t) {
      this.stats.update();
    }
  }

  render() {
    // NOTE: Update uniform data on each render.
    // this.uniforms.u_time.value += this.clock.getDelta();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onWindowResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  /**
   * Loads in the fence border for the map
   *
   * @returns void
   */
  _LoadFences() {
    for (let i = 0; i < 12; i++) {
      const fence = new entity.Entity();
      fence.AddComponent(
        new gltf_component.StaticModelComponent({
          scene: this.scene,
          resourcePath: "/industrial/GLB/",
          resourceName: "Fence.glb",
          position: new THREE.Vector3(0, 0, 0),
          scale: 1,
        })
      );
      this.entityManager.Add(fence);
      fence.SetActive(false);
      fence.SetPosition(new THREE.Vector3(7.7 * i - 42.3, -2, -50 + 7.7 / 2));
    }

    for (let i = 0; i < 12; i++) {
      const fence = new entity.Entity();
      fence.AddComponent(
        new gltf_component.StaticModelComponent({
          scene: this.scene,
          resourcePath: "/industrial/GLB/",
          resourceName: "Fence.glb",
          position: new THREE.Vector3(0, 0, 0),
          scale: 1,
        })
      );
      this.entityManager.Add(fence);
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
          scene: this.scene,
          resourcePath: "/industrial/GLB/",
          resourceName: "Fence.glb",
          scale: 1,
        })
      );
      fence.SetPosition(new THREE.Vector3(50 - 7.7 / 2, -2, 7.7 * i - 42.3));
      fence.SetQuaternion(q);
      this.entityManager.Add(fence);
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
          scene: this.scene,
          resourcePath: "/industrial/GLB/",
          resourceName: "Fence.glb",
          scale: 1,
        })
      );
      fence.SetPosition(new THREE.Vector3(-50 + 7.7 / 2, -2, 7.7 * i - 42.3));
      fence.SetQuaternion(q);
      this.entityManager.Add(fence);
      fence.SetActive(false);
    }
  }

  /**
   * Loads in a material based on the textures in freepbr
   *
   * @param name specific texture the dev wants
   * @param tiling how many tiles are each mapping
   * @returns a mesh standard material to be used in a THREE.Mesh
   */
  loadMaterial_(name: string, tiling: number) {
    const mapLoader = new THREE.TextureLoader();
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

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
}
