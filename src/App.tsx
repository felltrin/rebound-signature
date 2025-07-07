import { useEffect } from "react";

import SceneInit from "./lib/SceneInit";

class Slender {
  app: SceneInit | undefined;

  constructor() {
    this.initialize();
  }

  initialize() {
    this.onGameStart();
  }

  onGameStart() {
    this.app = new SceneInit("myThreeJsCanvas");
    this.app.initialize();
    this.app.animate();
  }
}

function App() {
  useEffect(() => {
    const ammoSetup = async () => {
      try {
        Ammo().then((lib) => {
          Ammo = lib;
          const slender = new Slender();
        });
        console.log("world loaded");
      } catch {
        console.log("failed to instantiate scene with ammo.js");
      }
    };
    ammoSetup();
  }, []);

  return (
    <>
      <canvas id="myThreeJsCanvas" />
    </>
  );
}

export default App;
