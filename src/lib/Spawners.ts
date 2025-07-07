import * as THREE from "three";

import { entity } from "./Entity";
import { first_person_camera } from "./FirstPersonCamera";
import { player_input } from "./PlayerInput";

export const spawners = (() => {
  class PlayerSpawner extends entity.Component {
    static CLASS_NAME = "PlayerSpawner";

    get NAME() {
      return PlayerSpawner.CLASS_NAME;
    }

    constructor(params) {
      super();
      this.params_ = params;
    }

    Spawn() {
      const player = new entity.Entity();
      player.SetPosition(new THREE.Vector3(0, 2, 0));
      player.AddComponent(new player_input.PlayerInput(this.params_));
      player.AddComponent(
        new first_person_camera.FirstPersonCamera(this.params_)
      );
      // player.AddComponent(new kinematic_character_controller.KinematicCharacterController(this.params_));
      // player.AddComponent(new gun_controller.GunController(this.params_));
      // player.AddComponent(new health_component.HealthComponent({health: 100, maxHealth: 100, updateUI: true}));

      this.Manager.Add(player, "player");

      return player;
    }
  }

  return {
    PlayerSpawner: PlayerSpawner,
  };
})();
