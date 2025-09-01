import * as THREE from 'three';

export interface ReactableApp {
  initialize(): Promise<void>;
  startAudio(): Promise<void>;
  getState(): AppState;
  setState(state: Partial<AppState>): void;
  update(deltaTime: number): void;
  render(): void;
}

export interface AppState {
  isAudioStarted: boolean;
  cubes: Map<string, CubeInstance>;
  connections: Connection[];
  selectedCube: string | null;
  isRecording: boolean;
}

export interface RenderEngine {
  initializeScene(): void;
  addCube(cube: CubeInstance): void;
  removeCube(cubeId: string): void;
  updateCube(cubeId: string, transform: Transform3D): void;
  setCameraController(controller: CameraController): void;
  showConnection(from: string, to: string, intensity: number): void;
  hideConnection(from: string, to: string): void;
  raycast(screenPosition: THREE.Vector2): RaycastResult[];
  render(): void;
  setSize(width: number, height: number): void;
}

export interface CameraController {
  update(): void;
}

export interface RaycastResult {
  object: THREE.Object3D;
  point: THREE.Vector3;
}

export interface Transform3D {
  position: THREE.Vector3;
  rotation: THREE.Vector3;
  scale: THREE.Vector3;
}

export interface AudioEngine {
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): void;
  createAudioNode(type: CubeType, params: AudioParams): AudioNode;
  updateAudioNode(nodeId: string, params: AudioParams): void;
  removeAudioNode(nodeId: string): void;
  connectNodes(fromId: string, toId: string): void;
  disconnectNodes(fromId: string, toId: string): void;
  startRecording(): void;
  stopRecording(): Promise<Blob>;
  getLatency(): number;
  getCPUUsage(): number;
}

export interface AudioParams {
  [key: string]: number;
}

export interface CubeManager {
  createCube(type: CubeType, position: THREE.Vector3): CubeInstance;
  destroyCube(cubeId: string): void;
  getCube(cubeId: string): CubeInstance | null;
  getAllCubes(): CubeInstance[];
  moveCube(cubeId: string, position: THREE.Vector3): void;
  rotateCube(cubeId: string, rotation: THREE.Vector3): void;
  scaleCube(cubeId: string, scale: THREE.Vector3): void;
  mapTransformToAudio(cube: CubeInstance): AudioParams;
}

export interface CubeInstance {
  id: string;
  type: CubeType;
  transform: Transform3D;
  audioNodeId: string;
  isActive: boolean;
  parameters: CubeParameters;
}

export interface CubeParameters {
  [key: string]: number;
}

export enum CubeType {
  OSCILLATOR = 'oscillator',
  FILTER = 'filter',
  GAIN = 'gain',
  OUTPUT = 'output',
}

export interface ConnectionManager {
  updateConnections(cubes: CubeInstance[]): void;
  checkProximity(cube1: CubeInstance, cube2: CubeInstance): boolean;
  createConnection(fromId: string, toId: string): Connection;
  removeConnection(connectionId: string): void;
  getConnections(): Connection[];
  validateConnection(fromId: string, toId: string): boolean;
  detectCycles(connections: Connection[]): boolean;
}

export interface Connection {
  id: string;
  fromCubeId: string;
  toCubeId: string;
  strength: number;
  isActive: boolean;
}

