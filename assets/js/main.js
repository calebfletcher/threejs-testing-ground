const altText = document.getElementById('statsAlt');
const velText = document.getElementById('statsVel');
const accelText = document.getElementById('statsAccel');
const dragText = document.getElementById('statsDrag');
const frameRateText = document.getElementById('statsFrameRate');

const logText = document.getElementById('log');

const config = {
  showGrid: false,
  simulationDelay: 3000
}

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 100000);
var controls = new THREE.OrbitControls(camera);
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
const rocket = new THREE.Group();

// Nose cone
let points = [];
for (let i = 0; i < 0.5; i += 0.01) {
  points.push(new THREE.Vector2(0.102 * i, 0.1 * Math.sqrt(12 * (1 - Math.pow(i + 0.5, 2)))));
}
const noseGeometry = new THREE.LatheGeometry(points, 64);
const noseMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
const noseLathe = new THREE.Mesh(noseGeometry, noseMaterial);
noseLathe.position.y = 0.95
rocket.add(noseLathe);

// Body Cylinder
const bodyGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 64);
const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x112288, side: THREE.DoubleSide });
const bodyCylinder = new THREE.Mesh(bodyGeometry, bodyMaterial);
bodyCylinder.position.y = 0.5
rocket.add(bodyCylinder);

// Fins
const numFins = 4
const spacingBetweenFins = 2 * Math.PI / numFins
const center = new THREE.Vector3(0, 0, 0)
const finHeight = 0.05
const finBaseLength = 0.2
const finTopLength = 0.05
const finDistFromCenter = 0.05
const fins = new THREE.Group();
const finMaterial = new THREE.MeshPhongMaterial({ color: 0xBBBBFF, side: THREE.DoubleSide });
for (let finNum = 0; finNum < numFins; finNum++) {
  const angle = spacingBetweenFins * finNum
  const finGeometry = new THREE.Geometry();
  finGeometry.vertices = [
    new THREE.Vector3(center.x + finDistFromCenter * Math.cos(angle), center.y, center.z + finDistFromCenter * Math.sin(angle)),
    new THREE.Vector3(center.x + finDistFromCenter * Math.cos(angle), center.y + finBaseLength, center.z + finDistFromCenter * Math.sin(angle)),
    new THREE.Vector3(center.x + (finDistFromCenter + finHeight) * Math.cos(angle), center.y + finTopLength, center.z + (finDistFromCenter + finHeight) * Math.sin(angle)),
    new THREE.Vector3(center.x + (finDistFromCenter + finHeight) * Math.cos(angle), center.y, center.z + (finDistFromCenter + finHeight) * Math.sin(angle))
  ];
  finGeometry.faces = [
    new THREE.Face3(0, 1, 3),
    new THREE.Face3(1, 2, 3)
  ];
  const finMesh = new THREE.Mesh(finGeometry, finMaterial);
  fins.add(finMesh);
}
rocket.add(fins)

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
plane.rotation.x = Math.PI / 2
plane.position.y = -0.01
scene.add(plane);

if (config.showGrid) {
  const gridHelper = new THREE.GridHelper(4000, 400, 0x0000ff, 0x808080);
  gridHelper.position.y = 0;
  gridHelper.position.x = 0;
  scene.add(gridHelper);
}

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

camera.position.set(0, 0.5, 4);
controls.update();

const g = -9.81
rocket.normalReaction = 0.0
rocket.thrust = 50.0
rocket.dragCoefficient = 0.01
rocket.drag = 0.0
rocket.accel = 0.0
rocket.vel = 0.0

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
  //console.log(rocket.position.y, rocket.vel, rocket.accel, rocket.drag)

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