import * as THREE from 'three';
import {
  RenderEngine,
  AudioEngine,
  CubeInstance,
  CubeType,
} from './core/interfaces';

export function setupInputHandlers(
  renderEngine: RenderEngine,
  _audioEngine: AudioEngine,
): void {
  window.addEventListener('resize', () => {
    renderEngine.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener('click', (event) => {
    const pointer = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    );
    const hits = renderEngine.raycast(pointer);
    if (hits.length === 0) {
      const cube: CubeInstance = {
        id: `cube-${Date.now()}`,
        type: CubeType.OSCILLATOR,
        transform: {
          position: new THREE.Vector3(),
          rotation: new THREE.Vector3(),
          scale: new THREE.Vector3(1, 1, 1),
        },
        audioNodeId: '',
        isActive: true,
        parameters: {},
      };
      renderEngine.addCube(cube);
    }
  });
}
