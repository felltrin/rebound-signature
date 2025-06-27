import { useEffect } from "react";

import * as THREE from "three";

import SceneInit from "./lib/SceneInit";
import DevEnvironment from "./lib/DevEnvironment";

function App() {
  useEffect(() => {
    const test = new SceneInit("myThreeJsCanvas");
    test.initialize();
    test.animate();

    const devEnv = new DevEnvironment(test);
    devEnv.initialize();
  }, []);

  return (
    <>
      <canvas id="myThreeJsCanvas" />
    </>
  );
}

export default App;
