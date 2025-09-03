import * as THREE from 'three';
import {
  CubeManager,
  CubeType,
  CubeInstance,
  Transform3D,
  AudioParams,
} from './interfaces';

/**
 * Basic implementation of the {@link CubeManager} interface.
 * Cubes are stored in a Map indexed by an auto-generated string ID.
 */
export class BasicCubeManager implements CubeManager {
  private cubes = new Map<string, CubeInstance>();
  private idCounter = 0;

  /**
   * Create a new cube and store it in the manager.
   * The cube will receive a generated ID and default transform values.
   */
  createCube(type: CubeType, position: THREE.Vector3): CubeInstance {
    const id = `cube-${this.idCounter++}`;
    const transform: Transform3D = {
      position: position.clone(),
      rotation: new THREE.Vector3(),
      scale: new THREE.Vector3(1, 1, 1),
    };
    const cube: CubeInstance = {
      id,
      type,
      transform,
      audioNodeId: id,
      isActive: true,
      parameters: {},
    };
    this.cubes.set(id, cube);
    return cube;
  }

  /** Remove a cube from the manager. */
  destroyCube(cubeId: string): void {
    this.cubes.delete(cubeId);
  }

  /** Retrieve a cube by its identifier. */
  getCube(cubeId: string): CubeInstance | null {
    return this.cubes.get(cubeId) ?? null;
  }

  /** Return an array with all cubes. */
  getAllCubes(): CubeInstance[] {
    return Array.from(this.cubes.values());
  }

  /** Update cube position. */
  moveCube(cubeId: string, position: THREE.Vector3): void {
    const cube = this.cubes.get(cubeId);
    if (cube) cube.transform.position.copy(position);
  }

  /** Update cube rotation. */
  rotateCube(cubeId: string, rotation: THREE.Vector3): void {
    const cube = this.cubes.get(cubeId);
    if (cube) cube.transform.rotation.copy(rotation);
  }

  /** Update cube scale. */
  scaleCube(cubeId: string, scale: THREE.Vector3): void {
    const cube = this.cubes.get(cubeId);
    if (cube) cube.transform.scale.copy(scale);
  }

  /**
   * Simple transform to audio parameter mapping.
   * Currently exposes position and rotation components.
   */
  mapTransformToAudio(cube: CubeInstance): AudioParams {
    return {
      posX: cube.transform.position.x,
      posY: cube.transform.position.y,
      posZ: cube.transform.position.z,
      rotX: cube.transform.rotation.x,
      rotY: cube.transform.rotation.y,
      rotZ: cube.transform.rotation.z,
    };
  }
}

export default BasicCubeManager;
