import * as THREE from 'three';
import {
  RenderEngine,
  CubeInstance,
  Transform3D,
  CameraController,
  RaycastResult,
} from './core/interfaces';

export class ThreeRenderEngine implements RenderEngine {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  private renderer = new THREE.WebGLRenderer({ antialias: true });
  private cubes = new Map<string, THREE.Mesh>();
  private connections = new Map<string, THREE.Line>();
  private raycaster = new THREE.Raycaster();
  private controller?: CameraController;

  initializeScene(): void {
    this.camera.position.set(5, 5, 5);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    const planeGeo = new THREE.PlaneGeometry(20, 20);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x222222,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    this.scene.add(plane);

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    this.scene.add(light);
  }

  addCube(cube: CubeInstance): void {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(cube.transform.position);
    mesh.rotation.set(
      cube.transform.rotation.x,
      cube.transform.rotation.y,
      cube.transform.rotation.z,
    );
    mesh.scale.copy(cube.transform.scale);
    this.scene.add(mesh);
    this.cubes.set(cube.id, mesh);
  }

  removeCube(cubeId: string): void {
    const mesh = this.cubes.get(cubeId);
    if (!mesh) return;
    this.scene.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
    this.cubes.delete(cubeId);
  }

  updateCube(cubeId: string, transform: Transform3D): void {
    const mesh = this.cubes.get(cubeId);
    if (!mesh) return;
    mesh.position.copy(transform.position);
    mesh.rotation.set(
      transform.rotation.x,
      transform.rotation.y,
      transform.rotation.z,
    );
    mesh.scale.copy(transform.scale);
  }

  setCameraController(controller: CameraController): void {
    this.controller = controller;
  }

  showConnection(from: string, to: string, intensity: number): void {
    const a = this.cubes.get(from);
    const b = this.cubes.get(to);
    if (!a || !b) return;
    const points = [a.position.clone(), b.position.clone()];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: intensity,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.connections.set(`${from}-${to}`, line);
  }

  hideConnection(from: string, to: string): void {
    const key = `${from}-${to}`;
    const line = this.connections.get(key);
    if (!line) return;
    this.scene.remove(line);
    (line.geometry as THREE.BufferGeometry).dispose();
    (line.material as THREE.Material).dispose();
    this.connections.delete(key);
  }

  raycast(screenPosition: THREE.Vector2): RaycastResult[] {
    this.raycaster.setFromCamera(screenPosition, this.camera);
    const intersects = this.raycaster.intersectObjects(
      Array.from(this.cubes.values()),
    );
    return intersects.map((i) => ({ object: i.object, point: i.point }));
  }

  render(): void {
    if (this.controller) this.controller.update();
    this.renderer.render(this.scene, this.camera);
  }

  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.Camera {
    return this.camera;
  }
}
