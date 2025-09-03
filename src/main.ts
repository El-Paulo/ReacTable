import * as THREE from 'three';
import { ThreeRenderEngine } from './renderEngine';
import { WebAudioEngine } from './audioEngine';
import { setupInputHandlers } from './inputHandlers';
import { CubeInstance, CubeType } from './core/interfaces';

const renderEngine = new ThreeRenderEngine();
const audioEngine = new WebAudioEngine();

async function initializeApp(): Promise<void> {
  renderEngine.initializeScene();
  await audioEngine.initialize();
  setupInputHandlers(renderEngine, audioEngine);
  animate();
}

function animate(): void {
  requestAnimationFrame(animate);
  renderEngine.render();
}

export function createCube(
  type: CubeType,
  position: THREE.Vector3,
): CubeInstance {
  const cube: CubeInstance = {
    id: `cube-${Date.now()}`,
    type,
    transform: {
      position,
      rotation: new THREE.Vector3(),
      scale: new THREE.Vector3(1, 1, 1),
    },
    audioNodeId: '',
    isActive: true,
    parameters: {},
  };
  renderEngine.addCube(cube);
  return cube;
}

export { renderEngine, audioEngine, initializeApp };

initializeApp();
