import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";

function clamp(x, a, b) {
  return Math.min(Math.max(x, a), b);
}

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
  keys: object | undefined;
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

  onMouseDown(e) {
    switch (e.button) {
      case "0": {
        if (this.current) this.current.leftButton = true;
        break;
      }
      case "2": {
        if (this.current) this.current.rightButton = true;
        break;
      }
    }
  }

  onMouseUp(e) {
    switch (e.button) {
      case "0": {
        if (this.current) this.current.leftButton = false;
        break;
      }
      case "2": {
        if (this.current) this.current.rightButton = false;
        break;
      }
    }
  }

  onMouseMove(e) {
    this.current.mouseX = e.pageX - window.innerWidth / 2;
    this.current.mouseY = e.pageY - window.innerHeight / 2;

    if (this.previous === undefined) {
      this.previous = { ...this.current };
    }

    this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
    this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;
  }

  onKeyDown(e) {
    this.keys[e.keyCode] = true;
  }

  onKeyUp(e) {
    this.keys[e.keyCode] = false;
  }

  update() {
    this.previous = { ...this.current };
  }
}

class FirstPersonCamera {
  camera: THREE.PerspectiveCamera;
  rotation: THREE.Quaternion;
  translation: THREE.Vector3 | undefined;
  input: PlayerInput | undefined;
  phi: number;
  theta: number;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.input = undefined;
    this.rotation = new THREE.Quaternion();
    this.translation = undefined;
    this.phi = 0;
    this.theta = 0;
  }

  initialize() {
    this.input = new PlayerInput();
    this.input.initialize();
  }

  update(timeElapsed) {
    this.updateRotation(timeElapsed);
    this.updateCamera(timeElapsed);
  }

  updateCamera(_) {
    this.camera.quaternion.copy(this.rotation);
  }

  updateRotation(timeElapsed) {
    const xh = this.input.current.mouseXDelta / window.innerWidth;
    const yh = this.input.current.mouseYDelta / window.innerHeight;

    this.phi += -xh * 5;
    this.theta = clamp(this.theta + -yh * 5, -Math.PI / 3, Math.PI / 3);

    const qx = new THREE.Quaternion();
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi);
    const qz = new THREE.Quaternion();
    qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta);

    const q = new THREE.Quaternion();
    q.multiply(qx);
    q.multiply(qz);

    this.rotation?.copy(q);
  }
}

export default class SceneInit {
  scene: THREE.Scene | undefined;
  camera: THREE.PerspectiveCamera | undefined;
  renderer: THREE.WebGLRenderer | undefined;
  clock: THREE.Clock | undefined;
  ambientLight: THREE.AmbientLight | undefined;
  directionalLight: THREE.DirectionalLight | undefined;
  stats: Stats | undefined;
  fpsCamera: FirstPersonCamera | undefined;
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
    this.fpsCamera = undefined;
    this.clock = undefined;
    this.stats = undefined;

    // NOTE: Lighting is basically required.
    this.ambientLight = undefined;
    this.directionalLight = undefined;
  }

  initialize() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xefd1b5, 0.0025);
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      window.innerWidth / window.innerHeight,
      1,
      1000,
    );
    this.camera.position.set(0, 2, 0);
    this.fpsCamera = new FirstPersonCamera(this.camera);
    this.fpsCamera.initialize();

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
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.ambientLight.castShadow = true;
    this.ambientLight.receiveShadow = true;
    this.scene.add(this.ambientLight);

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
  }

  animate() {
    // NOTE: Window is implied.
    // requestAnimationFrame(this.animate.bind(this));
    window.requestAnimationFrame(this.animate.bind(this));
    this.render();
    if (this.stats && this.clock && this.fpsCamera) {
      this.stats.update();
      this.fpsCamera.update(this.clock.getElapsedTime());
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
}
