import * as THREE from 'three';
import { setupCoins } from './coins.js';

const CHUNK_SIZE = 32;

export class ChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
  }

  key(x, z) {
    return `${x},${z}`;
  }

  update(playerPos) {
    const px = Math.floor(playerPos.x / CHUNK_SIZE);
    const pz = Math.floor(playerPos.z / CHUNK_SIZE);

    const range = 1; // 3x3 chunks
    const needed = new Set();

    for (let dz = -range; dz <= range; dz++) {
      for (let dx = -range; dx <= range; dx++) {
        const cx = px + dx;
        const cz = pz + dz;
        const k = this.key(cx, cz);
        needed.add(k);
        if (!this.chunks.has(k)) {
          const chunk = this.createChunk(cx, cz);
          this.chunks.set(k, chunk);
        }
      }
    }

    for (const [k, chunk] of this.chunks) {
      if (!needed.has(k)) {
        this.scene.remove(chunk.ground);
        chunk.coins.forEach(coin => this.scene.remove(coin));
        chunk.obstacles.forEach(ob => this.scene.remove(ob));
        this.chunks.delete(k);
      }
    }
  }

  createChunk(cx, cz) {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE),
      new THREE.MeshStandardMaterial({ color: 0x228822 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
    ground.receiveShadow = true;
    ground.name = "ground";
    this.scene.add(ground);

    const coins = setupCoins(this.scene, cx * CHUNK_SIZE, cz * CHUNK_SIZE, CHUNK_SIZE);

    const obstacles = [];
    for (let i = 0; i < 3; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0x663300 })
      );
      box.position.set(
        cx * CHUNK_SIZE + (Math.random() - 0.5) * CHUNK_SIZE,
        1,
        cz * CHUNK_SIZE + (Math.random() - 0.5) * CHUNK_SIZE
      );
      box.castShadow = true;
      box.receiveShadow = true;
      box.name = "obstacle";
      this.scene.add(box);
      obstacles.push(box);
    }

    return { ground, coins, obstacles };
  }

  getAllCoins() {
    const all = [];
    for (const chunk of this.chunks.values()) {
      all.push(...chunk.coins);
    }
    return all;
  }

  getAllObstacles() {
	  const all = [];
	  for (const chunk of this.chunks.values()) {
		all.push(...chunk.obstacles);
	  }
	  return all;
	}
}
