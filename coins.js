import * as THREE from 'three';

export function setupCoins(scene, cx = 0, cz = 0, area = 32) {
  const coins = [];
  const geometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xffd700 });

  for (let i = 0; i < 5; i++) {
    const coin = new THREE.Mesh(geometry, material);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(
      cx + (Math.random() - 0.5) * area,
      1.5,
      cz + (Math.random() - 0.5) * area
    );
    scene.add(coin);
    coins.push(coin);
  }

  return coins;
}

export function checkCoinCollection(playerPos, coins, scene) {
  let collected = false;
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    if (coin.position.distanceTo(playerPos) < 1.5) {
      scene.remove(coin);
      coins.splice(i, 1);
      collected = true;
    }
  }
  return collected;
}
