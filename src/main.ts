import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Cube {
  mesh: THREE.Mesh;
  type: string;
  audioIn: AudioNode | null;
  audioOut: AudioNode | null;
}

interface OscillatorData {
  osc: OscillatorNode;
}

interface FilterData {
  filter: BiquadFilterNode;
}

type CubeUserData = OscillatorData | FilterData;

interface Connection {
  from: Cube;
  to: Cube;
  line: THREE.Line;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let controls: OrbitControls | null = null;

async function init(): Promise<void> {
  const module = await import('three/examples/jsm/controls/OrbitControls.js');
  controls = new module.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  setupTutorial();
  animate();
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Mesa
const planeGeo = new THREE.PlaneGeometry(20, 20);
const planeMat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// Iluminación
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

// Audio context
let audioCtx: AudioContext | null = null;

function startAudio(): void {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
}

document.getElementById('audioBtn')?.addEventListener('click', startAudio);
window.addEventListener('pointerdown', startAudio, { once: true });

const cubes: Cube[] = [];
let connections: Connection[] = [];
let selected: Cube | null = null;
let dragging = false;
let rotating = false;
const dragOffset = new THREE.Vector3();

function createCube(type: string, position: THREE.Vector3): Cube {
  const colors: Record<string, number> = { osc: 0x00aaff, filter: 0xffaa00, output: 0xaa00ff };
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: colors[type] || 0xffffff });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  mesh.scale.set(0.01, 0.01, 0.01);
  scene.add(mesh);
  animateAppearance(mesh);

  let audioIn: AudioNode | null = null;
  let audioOut: AudioNode | null = null;
  if (type === 'osc') {
    const osc = audioCtx!.createOscillator();
    osc.type = 'sine';
    const gain = audioCtx!.createGain();
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(audioCtx!.destination);
    osc.start();
    audioOut = gain;
    (mesh.userData as OscillatorData).osc = osc;
  } else if (type === 'filter') {
    const input = audioCtx!.createGain();
    const filter = audioCtx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    const output = audioCtx!.createGain();
    input.connect(filter);
    filter.connect(output);
    output.connect(audioCtx!.destination);
    audioIn = input;
    audioOut = output;
    (mesh.userData as FilterData).filter = filter;
  } else if (type === 'output') {
    const input = audioCtx!.createGain();
    input.connect(audioCtx!.destination);
    audioIn = input;
  }

  const cube: Cube = { mesh, type, audioIn, audioOut };
  cubes.push(cube);
  updateConnections();
  return cube;
}

function updateConnections(): void {
  connections.forEach((c) => {
    if (c.from.audioOut && c.to.audioIn) {
      try {
        c.from.audioOut.disconnect(c.to.audioIn);
      } catch (e) {
        /* noop */
      }
    }
    scene.remove(c.line);
    (c.line.geometry as THREE.BufferGeometry).dispose();
    (c.line.material as THREE.Material).dispose();
  });
  connections = [];

  const threshold = 2.5;
  for (let i = 0; i < cubes.length; i++) {
    for (let j = i + 1; j < cubes.length; j++) {
      const a = cubes[i];
      const b = cubes[j];
      const dist = a.mesh.position.distanceTo(b.mesh.position);
      if (dist < threshold) {
        if (a.audioOut && b.audioIn) {
          a.audioOut.connect(b.audioIn);
          const line = createLine(a.mesh.position, b.mesh.position);
          connections.push({ from: a, to: b, line });
        }
        if (b.audioOut && a.audioIn) {
          b.audioOut.connect(a.audioIn);
          const line = createLine(b.mesh.position, a.mesh.position);
          connections.push({ from: b, to: a, line });
        }
      }
    }
  }
}

function createLine(a: THREE.Vector3, b: THREE.Vector3): THREE.Line {
  const points = [a.clone(), b.clone()];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  return line;
}

function animateAppearance(mesh: THREE.Mesh): void {
  const target = new THREE.Vector3(1, 1, 1);
  function grow() {
    mesh.scale.lerp(target, 0.2);
    if (mesh.scale.distanceTo(target) > 0.01) {
      requestAnimationFrame(grow);
    } else {
      mesh.scale.set(1, 1, 1);
    }
  }
  grow();
}

function setupTutorial(): void {
  const tutorial = document.getElementById('tutorial');
  const btn = document.getElementById('startBtn');
  if (!localStorage.getItem('tutorialSeen')) {
    tutorial?.classList.remove('hidden');
  }
  btn?.addEventListener('click', () => {
    tutorial?.classList.add('hidden');
    localStorage.setItem('tutorialSeen', '1');
  });
}

function onPointerDown(event: PointerEvent): void {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(cubes.map((c) => c.mesh));
  if (intersects.length > 0) {
    selected = cubes.find((c) => c.mesh === intersects[0].object) || null;
    const planeIntersect = raycaster.intersectObject(plane)[0];
    dragOffset.copy(planeIntersect.point).sub(selected!.mesh.position);
    dragging = true;
  } else {
    const planeHit = raycaster.intersectObject(plane)[0];
    if (planeHit) {
      const type = (document.getElementById('cubeType') as HTMLSelectElement).value;
      selected = createCube(type, planeHit.point.add(new THREE.Vector3(0, 0.5, 0)));
    }
  }
}

function onPointerMove(event: PointerEvent): void {
  if (!dragging && !rotating) return;
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const planeIntersect = raycaster.intersectObject(plane)[0];
  if (planeIntersect) {
    if (dragging && selected) {
      const pos = planeIntersect.point.sub(dragOffset);
      selected.mesh.position.set(pos.x, selected.mesh.position.y, pos.z);
      updateConnections();
    }
    if (rotating && selected) {
      selected.mesh.rotation.y += event.movementX * 0.01;
      applyParams(selected);
    }
  }
}

function onPointerUp(): void {
  dragging = false;
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'r' || event.key === 'R') {
    if (selected) rotating = true;
  }
  if (event.key === 'Delete') {
    if (selected) removeCube(selected);
  }
}

function onKeyUp(event: KeyboardEvent): void {
  if (event.key === 'r' || event.key === 'R') rotating = false;
}

function removeCube(cube: Cube): void {
  const idx = cubes.indexOf(cube);
  if (idx >= 0) {
    if (cube.audioOut) cube.audioOut.disconnect();
    if (cube.audioIn) cube.audioIn.disconnect();
    const userData = cube.mesh.userData as CubeUserData;
    if ('osc' in userData) userData.osc.stop();
    scene.remove(cube.mesh);
    cube.mesh.geometry.dispose();
    (cube.mesh.material as THREE.Material).dispose();
    cubes.splice(idx, 1);
    selected = null;
    updateConnections();
  }
}

function applyParams(cube: Cube): void {
  const rotY = cube.mesh.rotation.y;
  const userData = cube.mesh.userData as CubeUserData;
  if (cube.type === 'osc' && 'osc' in userData) {
    userData.osc.frequency.value = 220 + rotY * 100;
  } else if (cube.type === 'filter' && 'filter' in userData) {
    const freq = THREE.MathUtils.clamp(1000 + rotY * 500, 100, 5000);
    userData.filter.frequency.value = freq;
  } else if (cube.type === 'output' && cube.audioIn) {
    const vol = THREE.MathUtils.clamp(0.5 + rotY * 0.1, 0, 1);
    (cube.audioIn as GainNode).gain.value = vol;
  }
}

window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate(): void {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  connections.forEach((c) => {
    const positions = (c.line.geometry as THREE.BufferGeometry).attributes.position
      .array as Float32Array;
    positions[0] = c.from.mesh.position.x;
    positions[1] = c.from.mesh.position.y;
    positions[2] = c.from.mesh.position.z;
    positions[3] = c.to.mesh.position.x;
    positions[4] = c.to.mesh.position.y;
    positions[5] = c.to.mesh.position.z;
    (c.line.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
  });
  renderer.render(scene, camera);
}

function cleanup(): void {
  cubes.slice().forEach((c) => removeCube(c));
  renderer.dispose();
}

window.addEventListener('beforeunload', cleanup);

Object.assign(window as any, { createCube, cubes, THREE, scene });

init();

