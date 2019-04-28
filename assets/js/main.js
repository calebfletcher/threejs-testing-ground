const altText = document.getElementById('statsAlt');
const velText = document.getElementById('statsVel');
const accelText = document.getElementById('statsAccel');
const dragText = document.getElementById('statsDrag');
const frameRateText = document.getElementById('statsFrameRate');
const logText = document.getElementById('log');

const g = -9.81

const config = {
  showGrid: false,
  simulationDelay: 3000
}

// Add a new generic method to the Vector3 class to add spherical coordinates
THREE.Vector3.prototype.addSpherical = function(v) {
  let sinPhiRadius = Math.sin(v.phi) * v.radius;
  this.x += sinPhiRadius * Math.sin(v.theta);
  this.y += Math.cos(v.phi) * v.radius;
  this.z += sinPhiRadius * Math.cos(v.theta);
  return this
}

// Override the default Vector3 toString method
THREE.Vector3.prototype.toString = function() {
  return `[THREE.Vector3 <${this.x} ${this.y} ${this.z}>]`
}

class Rocket extends THREE.Group {
  constructor(...args) {
    super(...args)
    
    this.normalReaction = 0.0
    this.thrust = 50.0
    //this.thrust = 0.0
    this.dragCoefficient = 0.01
    this.drag = 0.0
    this.accel = 0.0
    this.vel = 0.0
  }

  initializeGeometry() {
    const noseCone = new NoseCone();
    noseCone.position.y = 0.95
    this.add(noseCone);

    const bodyCylinder = new BodyCylinder();
    bodyCylinder.position.y = 0.5
    this.add(bodyCylinder);

    const fins = new Fins()
    this.add(fins)
  }
}

class NoseCone extends THREE.Mesh {
  constructor(...args) {
    let points = [];
    for (let i = 0; i < 0.5; i += 0.01) {
      points.push(new THREE.Vector2(0.102 * i, 0.1 * Math.sqrt(12 * (1 - Math.pow(i + 0.5, 2)))));
    }
    const geometry = new THREE.LatheGeometry(points, 64);
    const material = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
    super(geometry, material, ...args)
  }
}

class BodyCylinder extends THREE.Mesh {
  constructor(...args) {
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 64);
    const material = new THREE.MeshPhongMaterial({ color: 0x112288, side: THREE.DoubleSide });
    super(geometry, material, ...args)
  }
}

class Fins extends THREE.Group {
  constructor(options, ...args) {
    const numFins = 4
    const spacingBetweenFins = 2 * Math.PI / numFins
    const center = new THREE.Vector3(0, 0, 0) // TODO: Make this inherit from rocket origin

    super(...args)

    for (let finNum = 0; finNum < numFins; finNum++) {
      const angle = spacingBetweenFins * finNum
      const distFromCenter = 0.05
      const vectorToFinOrigin = THREE.Spherical(distFromCenter, Math.PI / 2, angle)
      const finOrigin = center.clone()
      finOrigin.addSpherical(vectorToFinOrigin) // The location of the vertice of the bottom of the base chord
      const finMesh = new Fin({
        color: 0xBBBBFF,
        origin: finOrigin,
        angle: angle, // Absolute angle of the fin from positive-x axis
        height: 0.05,
        baseLength: 0.2,
        topLength: 0.05,
        distFromCenter: distFromCenter // TODO: Make this inherit from body cylinder radius
      });
      this.add(finMesh);
    }
  }
}

class Fin extends THREE.Mesh {
  constructor(options, ...args) {
    const material = new THREE.MeshPhongMaterial({
      color: options.color,
      side: THREE.DoubleSide
    });
    const geometry = new THREE.Geometry();
    geometry.vertices = [
      new THREE.Vector3(
        options.origin.x,
        options.origin.y,
        options.origin.z
      ),
      new THREE.Vector3(
        options.origin.x,
        options.origin.y + options.baseLength,
        options.origin.z
      ),
      new THREE.Vector3(
        options.origin.x + options.height * Math.sin(options.angle),
        options.origin.y + options.topLength,
        options.origin.z + options.height * Math.cos(options.angle)
      ),
      new THREE.Vector3(
        options.origin.x + options.height * Math.sin(options.angle),
        options.origin.y,
        options.origin.z + options.height * Math.cos(options.angle)
      )
    ];
    geometry.faces = [
      new THREE.Face3(0, 1, 3),
      new THREE.Face3(1, 2, 3)
    ];
    super(geometry, material, ...args)
  }
}

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 100000);
let controls = new THREE.OrbitControls(camera);
//controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;
controls.enableDamping = true;
//controls.maxPolarAngle = Math.PI / 2 - 0.01

// Initialize the renderer
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
document.body.style.overflow = 'hidden';

// Initialize the rocket Group
const rocket = new Rocket();
rocket.initializeGeometry();
scene.add(rocket)

// Create a point light and an ambient light
const pointLight1 = new THREE.PointLight(0xFFFFFF);
pointLight1.position.x = 600
pointLight1.position.y = 1000
pointLight1.position.z = 800
scene.add(pointLight1);
const light = new THREE.AmbientLight(0x555555);
scene.add(light);

// Create a ground plane
const planeGeometry = new THREE.PlaneGeometry(20000, 20000);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x003300, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2
plane.position.y = -0.02
scene.add(plane);

const loader = new THREE.FontLoader()
loader.load('../assets/fonts/Raleway-Light.json', function (font) {
  let textMaterial = new THREE.MeshPhongMaterial({
    color: 0xff0000
  }
  );
	let textGeometryX = new THREE.TextGeometry('X', {
		font: font,
		size: 0.6,
		height: 0.04,
		curveSegments: 16
  });
  let meshX = new THREE.Mesh(textGeometryX, textMaterial);
  scene.add(meshX);
  meshX.rotation.x = -Math.PI / 2
  meshX.position.x = 4.5
  meshX.position.z = -0.1

  let textGeometryY = new THREE.TextGeometry('Y', {
		font: font,
		size: 0.6,
		height: 0.04,
		curveSegments: 16
  });
  let meshY = new THREE.Mesh(textGeometryY, textMaterial);
  scene.add(meshY);
  meshY.position.y = 4.4
  meshY.position.x = 0.1

  let textGeometryZ = new THREE.TextGeometry('Z', {
		font: font,
		size: 0.6,
		height: 0.04,
		curveSegments: 16
  });
  let meshZ = new THREE.Mesh(textGeometryZ, textMaterial);
  scene.add(meshZ);
  meshZ.rotation.x = -Math.PI / 2
  meshZ.position.z = 5
  meshZ.position.x = 0.1
});

// Show grid
if (config.showGrid) {
  const gridHelper = new THREE.GridHelper(4000, 400, 0x0000ff, 0x808080);
  gridHelper.position.y = 0;
  gridHelper.position.x = 0;
  scene.add(gridHelper);
}
// Show axes helper
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Add a whole lot of random hexagons to give the user some idea of which way is up
// and how far away the ground is
geometry = new THREE.CylinderBufferGeometry(0.1, 0.1, 0.3, 6, true);
material = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  flatShading: true
});
for (var i = 0; i < 100; i++) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = Math.random() * 64 - 32;
  mesh.position.y = 0.15;
  mesh.position.z = Math.random() * 64 - 32;
  mesh.updateMatrix();
  mesh.matrixAutoUpdate = false;
  scene.add(mesh);
}

// Set the location of the camera
camera.position.set(0, 0.5, 4);
controls.update();

setTimeout(() => {
  logEvent('Thrust started')
}, config.simulationDelay)

setTimeout(() => {
  rocket.thrust = 0.0
  logEvent('Thrust stopped')
}, 3000 + config.simulationDelay)

const simulationStartTime = performance.now()
logEvent('Simulation started')

const numSamples = 30
let lastTimestamp = performance.now()
let dtHistory = Array(numSamples).fill(0)
let reachedMax = false
let lastAltitude = 0

requestAnimationFrame(animate);

// Add handler for window resize
const tanFOV = Math.tan(((Math.PI / 180) * camera.fov / 2));
const initialWindowHeight = window.innerHeight;
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = (360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / initialWindowHeight));
  camera.updateProjectionMatrix();
  camera.lookAt(scene.position);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}

// Main update function
function animate(timestamp) {
  if (performance.now() - simulationStartTime < config.simulationDelay) {
    lastTimestamp = performance.now()
    controls.update()
    renderer.render(scene, camera);
    requestAnimationFrame(animate)
    return
  }
  const timeSinceStart = timestamp - simulationStartTime - config.simulationDelay
  const dt = (timestamp - lastTimestamp) / 1000 // in s
  lastTimestamp = timestamp
  dtHistory.push(dt)
  dtHistory.shift()
  sumOfDt = dtHistory.reduce((acc, curr) => acc + curr, 0);
  const frameRate = numSamples / sumOfDt // in FPS/Hz

  if (rocket.position.y == 0 && reachedMax) {
    rocket.vel = 0
    rocket.normalReaction = - g
  }
  else {
    rocket.normalReaction = 0.0
  }
  if (rocket.position.y < lastAltitude && !reachedMax) {
    reachedMax = true
    logEvent('Max Altitude Reached (' + rocket.position.y.toFixed(2) + 'm)')
  }
  lastAltitude = rocket.position.y

  rocket.drag = -Math.sign(rocket.vel) * rocket.dragCoefficient * Math.pow(rocket.vel, 2)

  const lastAlt = rocket.position.y
  rocket.position.y = Math.max(rocket.position.y + dt * rocket.vel, 0)
  rocket.vel = rocket.vel + dt * rocket.accel
  rocket.accel = rocket.thrust + g + rocket.normalReaction + rocket.drag
  let vect = new THREE.Euler()
  vect.setFromQuaternion(rocket.quaternion)
  rocket.setRotationFromEuler(new THREE.Euler(0, 1 * timeSinceStart/1000, 0 * timeSinceStart/1000))

  statsAlt.innerText = rocket.position.y.toExponential(2) + ' m'
  statsVel.innerText = rocket.vel.toExponential(2) + ' m/s'
  statsAccel.innerText = rocket.accel.toExponential(2) + ' m/s^2'
  statsDrag.innerText = rocket.drag.toExponential(2) + ' m/s^2'
  statsFrameRate.innerText = frameRate.toFixed(1)

  controls.target = rocket.position
  camera.position.y += rocket.position.y - lastAlt

  controls.update()
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function formatTimestamp(timestamp) {
  return (timestamp / 1000).toFixed(2)
}

function logEvent(str) {
  log.innerText += formatTimestamp(performance.now()) + ': ' + str + '\n'
  log.scrollTop = log.scrollHeight
}