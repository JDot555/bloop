import * as THREE from 'three';
import { FirstPersonController } from './FirstPersonController.js';
import { ChunkManager } from './ChunkManager.js';
import { checkCoinCollection } from './coins.js';

let scene, camera, renderer, clock;
let controller, chunkManager, raycaster;
let xp = 0;
const collectedCoins = new Set();

const hud = document.getElementById('hud');
const coinSound = document.getElementById('coinSound');

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();

  const light = new THREE.HemisphereLight(0xffffff, 0x444444);
  light.position.set(0, 200, 0);
  scene.add(light);

  controller = new FirstPersonController(camera, document.body);
  chunkManager = new ChunkManager(scene);

  document.body.addEventListener('click', () => {
    controller.lock();
    attemptClickCollect();
  });

  animate();
}

function attemptClickCollect() {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const coins = chunkManager.getAllCoins();

  const intersects = raycaster.intersectObjects(coins, false);
  if (intersects.length > 0) {
    const coin = intersects[0].object;
    if (!collectedCoins.has(coin)) {
      scene.remove(coin);
      collectedCoins.add(coin);
      updateXP(10);
      playSound();
    }
  }
}

function updateXP(amount) {
  xp += amount;
  hud.textContent = `XP: ${xp}`;
}

function playSound() {
  try {
    coinSound.currentTime = 0;
    coinSound.play();
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  controller.update(delta);
  chunkManager.update(controller.getPosition());
  controller.setObstacles(chunkManager.getAllObstacles());

  const coins = chunkManager.getAllCoins();
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    if (!collectedCoins.has(coin) && coin.position.distanceTo(controller.getPosition()) < 1.5) {
      scene.remove(coin);
      collectedCoins.add(coin);
      updateXP(5);
      playSound();
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
