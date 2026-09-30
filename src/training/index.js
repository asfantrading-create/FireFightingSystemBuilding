import { pumpRoomScene, flowTestScene } from './pumproom.js';
import { dryPipeScene, floorValveScene } from './valves.js';
import { extinguisherScene, hoseDrillScene } from './people.js';
import { sprinklerTypesScene, stairScene, fm200Scene } from './extra.js';
import { installScene } from './installScene.js';

export const SCENES = [pumpRoomScene, flowTestScene, dryPipeScene, floorValveScene, extinguisherScene, hoseDrillScene, sprinklerTypesScene, stairScene, fm200Scene, installScene];
export { Trainer } from './engine.js';
