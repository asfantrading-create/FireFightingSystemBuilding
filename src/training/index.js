import { pumpRoomScene, flowTestScene } from './pumproom.js';
import { dryPipeScene, floorValveScene } from './valves.js';
import { extinguisherScene, hoseDrillScene } from './people.js';

export const SCENES = [pumpRoomScene, flowTestScene, dryPipeScene, floorValveScene, extinguisherScene, hoseDrillScene];
export { Trainer } from './engine.js';
