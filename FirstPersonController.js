import * as THREE from 'three';

export class FirstPersonController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.keys = {};
    this.canJump = false;
    this.obstacles = [];

    this.movementMap = this.randomizeControls();
    setInterval(() => this.movementMap = this.randomizeControls(), 5000);

    this.pointerLock = this.initPointerLock();
    this.bindKeys();

    this.camera.position.set(0, 2, 0);

    this.jumpSound = new Audio('jump.mp3');
    this.jumpSound.volume = 0.5;
  }

  setObstacles(obstacles) {
    this.obstacles = obstacles;
  }

  randomizeControls() {
    const controls = ['w', 'a', 's', 'd'];
    const directions = ['forward', 'backward', 'left', 'right'];
    const shuffled = directions.sort(() => 0.5 - Math.random());
    const map = {};
    controls.forEach((key, i) => map[key] = shuffled[i]);
    return map;
  }
  
  initPointerLock() {
    const controls = this.domElement;
    controls.requestPointerLock = controls.requestPointerLock || controls.mozRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

    document.addEventListener('pointerlockchange', () => {
      this.enabled = document.pointerLockElement === controls;
    });

    controls.addEventListener('click', () => {
      controls.requestPointerLock();
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.enabled) return;
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;
      this.camera.rotation.y -= movementX * 0.002;
      this.camera.rotation.x -= movementY * 0.002;
      this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
    });
  }

  bindKeys() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  update(delta) {
    const speed = 10.0;
    this.direction.set(0, 0, 0);

    const control = this.movementMap;

    for (const key of ['w', 'a', 's', 'd']) {
      if (!this.keys[key]) continue;
      switch (control[key]) {
        case 'forward': this.direction.z -= 1; break;
        case 'backward': this.direction.z += 1; break;
        case 'left': this.direction.x -= 1; break;
        case 'right': this.direction.x += 1; break;
      }
    }

    this.direction.normalize();
    this.direction.applyEuler(this.camera.rotation);

    const move = this.direction.clone().multiplyScalar(speed * delta);
    const predictedPos = this.camera.position.clone().add(move);

    const playerBox = new THREE.Box3().setFromCenterAndSize(predictedPos.clone(), new THREE.Vector3(1, 2, 1));
    let collision = false;
    for (let obs of this.obstacles) {
      const obsBox = new THREE.Box3().setFromObject(obs);
      if (obsBox && playerBox.intersectsBox(obsBox)) {
        collision = true;
        break;
      }
    }

    if (!collision) {
      this.camera.position.add(move);
    }

    // Ground check with raycast
    const ray = new THREE.Raycaster(
      this.camera.position.clone(),
      new THREE.Vector3(0, -1, 0),
      0,
      1.1
    );
    const groundHits = ray.intersectObjects(this.obstacles, false);
    const isGrounded = this.camera.position.y <= 2 || groundHits.length > 0;

    // Jump logic with random velocity
	if (this.keys[' '] && isGrounded) {
	  // Randomize jump strength between 5 and 12 for more noticeable difference
	  this.velocity.y = 5 + Math.random() * 7; // random jump: 5 to 12
	  this.canJump = false;

	  // Reset sound and play it from the start
	  this.jumpSound.currentTime = 0;
	  this.jumpSound.play();
	}

    // Apply gravity and move vertically
    this.velocity.y -= 9.8 * delta;
    this.camera.position.y += this.velocity.y * delta;

    // Clamp to ground or top of obstacle
	if (this.velocity.y <= 0) {
	  const footPosition = this.camera.position.clone();
	  const playerBox = new THREE.Box3().setFromCenterAndSize(
		new THREE.Vector3(footPosition.x, footPosition.y - 1.1, footPosition.z),
		new THREE.Vector3(1, 0.2, 1) // very thin box at the feet
	  );

	  let onSurface = false;
	  for (let obs of this.obstacles) {
		const obsBox = new THREE.Box3().setFromObject(obs);
		if (obsBox && playerBox.intersectsBox(obsBox)) {
		  this.velocity.y = 0;
		  this.camera.position.y = obsBox.max.y + 1.0; // place player just above the obstacle
		  onSurface = true;
		  break;
		}
	  }

	  if (!onSurface && isGrounded) {
		this.velocity.y = 0;
		this.camera.position.y = 2;
	  }

	  if (isGrounded || onSurface) {
		this.canJump = true;
	  }
	}

  }

  lock() {
    this.domElement.requestPointerLock();
  }

  getPosition() {
    return this.camera.position.clone();
  }
}
