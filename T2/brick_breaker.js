import * as THREE from "three";
import KeyboardState from "../../libs/util/KeyboardState.js";

import {
  initRenderer,
  initCamera,
  onWindowResize,
} from "../libs/util/util.js";
import { CSG } from "../libs/other/CSGMesh.js";

let scene, renderer, camera, speedometer, orbit;
scene = new THREE.Scene();
scene.background = new THREE.Color("rgb(250, 250, 250)");
renderer = initRenderer();
camera = initCamera(new THREE.Vector3(0, 0, 18));


var start = false;
var keyboard = new KeyboardState();
var pause = false;

var startTime = Date.now();

camera.layers.enable(0);

//// Plane 

let objects = [];
let plane, planeGeometry, planeMaterial;

planeGeometry = new THREE.PlaneGeometry(8.5, 17);
planeMaterial = new THREE.MeshLambertMaterial();
planeMaterial.side = THREE.DoubleSide;
planeMaterial.transparent = true;
planeMaterial.color.set("rgb(72, 68, 76)");
planeMaterial.opacity = 1;
plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.receiveShadow = true;

scene.add(plane);
objects.push(plane);

plane = objects[0];
plane.position.set(0, 0.1, -0.5);
plane.layers.set(0);

speedometer = document.getElementById("speedometer");

//// Light

let lightPosition = new THREE.Vector3(1, 3, 10);
let lightColor = "rgb(255,255,255)";

let dirLight = new THREE.DirectionalLight(lightColor);
dirLight.position.copy(lightPosition);
scene.add(dirLight);

setDirectionalLighting(lightPosition);

function setDirectionalLighting(position) {
  dirLight.position.copy(position);

  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 512;
  dirLight.shadow.mapSize.height = 512;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 20;
  dirLight.shadow.camera.left = -5;
  dirLight.shadow.camera.right = 5;
  dirLight.shadow.camera.top = 8;
  dirLight.shadow.camera.bottom = -8;
  dirLight.name = "Direction Light";

  scene.add(dirLight);
}

function updateLightPosition() {
  dirLight.position.copy(lightPosition);
}

//// Cubes

let cubes = [];
let cubesBb = [];

let cubesToIntersect = [];

let yPosLimit = 8;

const blockColors = [
  "rgb(188, 188, 188)",
  "rgb(216,40,0)",
  "rgb(0,112,236)",
  "rgb(252,152,56)",
  "rgb(252,116,180)",
  "rgb(128,208,16)",
];

let nivel = 1;

function createCubes() {
  const spacingX = 0.4;
  const spacingY = 0.1;
  let rows = 6;
  let cols = 11;
  const cubeSize = 0.3;
  const totalWidth = cols * (cubeSize + spacingX) - spacingX;
  const totalHeight = -4;

  if (nivel == 1) {
    for (let row = 0; row < rows; row++) {
      const colorIndex = blockColors.length - 1 - (row % blockColors.length);
      for (let col = 0; col < cols; col++) {
        const geometry = new THREE.BoxGeometry(cubeSize * 2.2, cubeSize, 0.4);
        const material = new THREE.MeshLambertMaterial({
          color: blockColors[colorIndex],
        });
        const cube = new THREE.Mesh(geometry, material);
        const xPosition =
          col * (cubeSize + spacingX) - totalWidth / 2 + cubeSize / 2;
        const yPosition =
          row * (cubeSize + spacingY) - totalHeight / 2 + cubeSize / 2;

        cube.position.set(xPosition, yPosition, 0);
        cube.geometry.computeBoundingBox();
        cube.castShadow = true;
        let cubeBb = new THREE.Box3().setFromObject(cube);
        cubes.push(cube);
        cubesToIntersect.push(cube);
        cubesBb.push(cubeBb);
        scene.add(cube);
      }
    }
  }
  if (nivel == 2) {
    const spacingX = 0.4;
    const spacingY = 0.1;
    const spacingXBetweenColumns = 2.0;
    const cubeSize = 0.3;
    rows = 14;
    cols = 2;
    const totalHeight = rows * (cubeSize + spacingY);

    const totalWidthWithSpacing =
      cols * (4 * cubeSize + 3 * spacingX) +
      spacingXBetweenColumns * (cols - 1);
    const xOffset = -(totalWidthWithSpacing / 2);

    const yOffset = totalHeight - cubeSize / 2;

    for (let row = 0; row < rows; row++) {
      const startingColorIndex = row % blockColors.length;

      for (let col = 0; col < cols; col++) {
        for (let i = 0; i < 4; i++) {
          const colOffset = col % 2 === 0 ? 0 : blockColors.length / 2;

          const colorIndex =
            (startingColorIndex + colOffset + i) % blockColors.length;
          const geometry = new THREE.BoxGeometry(cubeSize * 2.2, cubeSize, 0.4);
          const material = new THREE.MeshLambertMaterial({
            color: blockColors[colorIndex],
          });
          const cube = new THREE.Mesh(geometry, material);
          const xPosition =
            col * (4 * cubeSize + 3 * spacingX) +
            i * (cubeSize + spacingX) +
            col * spacingXBetweenColumns +
            xOffset +
            cubeSize / 2;

          const yPosition = -row * (cubeSize + spacingY) + yOffset;

          cube.position.set(xPosition, yPosition, 0);
          cube.geometry.computeBoundingBox();
          cube.castShadow = true;
          let cubeBb = new THREE.Box3().setFromObject(cube);
          cubes.push(cube);
          cubesToIntersect.push(cube);
          cubesBb.push(cubeBb);
          scene.add(cube);
        }
      }
    }
    lightPosition = new THREE.Vector3(1, 3, 10);
    updateLightPosition();
  }
}

function removeCube(i) {
  cubesBb.splice(i, 1);
  scene.remove(cubes[i]);
  cubesToIntersect.splice(i, 1);
  cubes.splice(i, 1);

  if (cubes.length == 0) {
    toggleStart();
    setBallPosition(ballObject);
  }
}

//// Walls

function createWalls() {
  const wallGeometry = new THREE.BoxGeometry(0.2, 16, 0.4);
  const roofGeometry = new THREE.BoxGeometry(8.3, 0.2, 0.4);
  const material = new THREE.MeshPhongMaterial({ color: "rgb(105,105,105)" });
  const leftWall = new THREE.Mesh(wallGeometry, material);
  const rightWall = new THREE.Mesh(wallGeometry, material);
  const topWall = new THREE.Mesh(roofGeometry, material);

  leftWall.position.set(-4.05, 0, 0);
  rightWall.position.set(4.05, 0, 0);
  topWall.position.set(0, 7.4, 0);
  objectsToIntersect.push(leftWall);
  objectsToIntersect.push(rightWall);
  objectsToIntersect.push(topWall);
  scene.add(rightWall);
  scene.add(leftWall);
  scene.add(topWall);
}

//// Hitter

let objectsToIntersect = [];

let csgObject;
let auxMat = new THREE.Matrix4();

let hitterMesh;

function createHitterMesh() {
  let cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.5, 34));
  let boxMesh = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 2));
  let cylinderCSG, boxCSG;
  cylinderMesh.position.set(0, 0.5, 0);
  cylinderMesh.rotateOnAxis(
    new THREE.Vector3(1, 0, 0),
    THREE.MathUtils.degToRad(90)
  );
  updateObject(cylinderMesh);
  cylinderCSG = CSG.fromMesh(cylinderMesh);

  boxMesh.position.set(0, 0, 0);
  updateObject(boxMesh);
  boxCSG = CSG.fromMesh(boxMesh);

  boxMesh.position.set(0, -0.5, 0);

  csgObject = cylinderCSG.subtract(boxCSG);

  hitterMesh = CSG.toMesh(csgObject, auxMat);
  hitterMesh.material = new THREE.MeshLambertMaterial({
    color: "rgb(255,20,20)",
  });

  hitterMesh.castShadow = true;
  hitterMesh.position.set(0, -8, 0);
  objectsToIntersect.push(hitterMesh);

  scene.add(hitterMesh);
}

function updateObject(mesh) {
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
}

function removeAll() {
  for (let i = 0; i < cubes.length; i++) {
    cubesToIntersect.splice(i, 1);
    scene.remove(cubes[i]);
    scene.remove(cubesBb[i]);
  }
  for (let i = 0; i < objectsToIntersect.length; i++) {
    scene.remove(objectsToIntersect[i]);
  }

  scene.remove(ballObject.ball);
  objectsToIntersect = [];
  cubesToIntersect = [];
  cubes = [];
  cubesBb = [];
}

//// Ball

let ballObject = {
  ball: null,
  bb: null,
  ballVelocity: new THREE.Vector3(0, -3.5, 0),
};

let ballObject2 = {
  ball: null,
  bb: null,
  ballVelocity: new THREE.Vector3(0, -3.5, 0),
};

function createBall() {
  ballObject.ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 30, 30, 0, Math.PI * 2, 0, Math.PI),
    new THREE.MeshPhongMaterial({ color: "rgb(37, 255, 62)", shininess: "100" })
  );
  setBallPosition(ballObject);
  ballObject.bb = new THREE.Box3().setFromObject(ballObject.ball);
  ballObject.ball.geometry.computeBoundingSphere();
  ballObject.ball.castShadow = true;
  scene.add(ballObject.ball);
}

function createSecondBall() {
  ballObject2.ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 30, 30, 0, Math.PI * 2, 0, Math.PI),
    new THREE.MeshPhongMaterial({ color: "rgb(255, 255, 0)", shininess: "100" })
  );
  ballObject2.ball.position.set(
    ballObject.ball.position.x,
    ballObject.ball.position.y,
    0
  );

  ballObject2.bb = new THREE.Box3().setFromObject(ballObject2.ball);
  ballObject2.ball.geometry.computeBoundingSphere();
  ballObject2.ball.castShadow = true;
  scene.add(ballObject2.ball);
}


function setBallPosition(ballObject) {
  ballObject.ball.position.set(
    hitterMesh.position.x,
    hitterMesh.position.y + 2.7,
    0
  );
}

let speedMultiplier = 1;
let elapsedTimeSinceStart;
let currentTime = Date.now();
let clock = new THREE.Clock();

function moveBall(ballObject) {
  let deltaTime = clock.getDelta();
  speedometer.innerHTML = "Speed: " + speedMultiplier.toFixed(2);
  elapsedTimeSinceStart = currentTime - startTime;
  if (speedMultiplier <= 2.0) {
    currentTime = Date.now();
    speedMultiplier = 1 + elapsedTimeSinceStart / 15000;
    if (elapsedTimeSinceStart >= 15000) speedMultiplier = 2.0;
  }

  ballObject.ball.position.x +=
    ballObject.ballVelocity.x * speedMultiplier * deltaTime;
  ballObject.ball.position.y +=
    ballObject.ballVelocity.y * speedMultiplier * deltaTime;
  ballObject.bb.setFromObject(ballObject.ball);
}


function moveBall2(ballObject2) {
  let deltaTime = clock.getDelta();
  ballObject2.ball.position.x +=
    ballObject2.ballVelocity.x * 200 * deltaTime;
  ballObject2.ball.position.y +=
    ballObject2.ballVelocity.y * 200 * deltaTime;
  ballObject2.bb.setFromObject(ballObject2.ball);
}



function checkBallPosition(ballObject) {
  if (ballObject.ball.position.y < -yPosLimit) {
    blockCount = 0;
    powerCount = 0;
    ballObject.ball.position.set(0, -1.0, 0);
    ballObject.ballVelocity.x = 0;
    ballObject.ballVelocity.y = -3.5;
    if (nivel == 2) {
      setBallPosition(ballObject);

    }
    speedMultiplier = 1;
    startTime = currentTime;
  }

}

//// Collision

let raycaster = new THREE.Raycaster();

function handleReflection(incidenceVector, ballObject) {
  const reflectionVector = new THREE.Vector3()
    .copy(ballObject.ballVelocity)
    .reflect(incidenceVector);

  ballObject.ballVelocity.copy(reflectionVector);
}

function checkCollisionsObjects(ballObject) {
  let rayDirections = [
    new THREE.Vector3(0, -0.5, 0),
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(0.5, 0, 0),
    new THREE.Vector3(-0.5, 0, 0),
    new THREE.Vector3(-0.5, -0.5, 0),
    new THREE.Vector3(0.5, -0.5, 0),
    new THREE.Vector3(-0.5, -0.5, 0),
    new THREE.Vector3(0.5, -0.5, 0),
  ];

  for (let direction of rayDirections) {
    let raycaster = new THREE.Raycaster(
      ballObject.ball.position,
      direction,
      0,
      0.2
    );
    let intersects = raycaster.intersectObjects(objectsToIntersect);
    if (intersects.length > 0) {
      let incidenceVector = new THREE.Vector3(
        intersects[0].face.normal.x,
        intersects[0].face.normal.y,
        0
      );
      handleReflection(incidenceVector, ballObject);
    }
  }
}

function checkCollisionCubes(ballObject) {
  let rayDirections = [
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(-0.5, -0.5, 0),
    new THREE.Vector3(0.5, -0.5, 0),
    new THREE.Vector3(-0.5, -0.5, 0),
    new THREE.Vector3(0.5, -0.5, 0),
  ];

  for (let direction of rayDirections) {
    let raycaster = new THREE.Raycaster(
      ballObject.ball.position,
      direction,
      0,
      1
    );
    let intersects = raycaster.intersectObjects(cubesToIntersect);
    if (intersects.length > 0 && intersects[0].distance < 0.15) {
      let incidenceVector = new THREE.Vector3(
        intersects[0].face.normal.x,
        intersects[0].face.normal.y,
        0
      );
      handleReflection(incidenceVector, ballObject);
    }
  }
}

function checkCubesRemoval(ballObject) {
  for (let i = 0; i < cubesBb.length; i++) {
    let collision = ballObject.bb.intersectsBox(cubesBb[i]);
    if (collision) {
      const cubeColor = convertTo255(cubes[i].material.color);
      if (cubeColor.r != 188 && cubeColor.g != 188 && cubeColor.b != 188) {
        if (powerCount == 0) {
          blockCount++;
          if (blockCount == blockLimit) {
            spawnPowerUp(cubes[i].position.x, cubes[i].position.y);
          }
        }
        removeCube(i);
      } else {
        cubes[i].material.color.set("rgb(166, 165, 165)");
      }
    }
  }
  if (cubes.length == 0) {
    hitterMesh.position.set(-4, -6, 0);
    setBallPosition(ballObject);
    levelUp();
  }
}

function levelUp() {
  nivel = 2;
  removeAll();
  createCubes();
  createHitterMesh();
  createBall();
  createWalls();
  setBallPosition(ballObject);
}

function convertTo255(color) {
  const r255 = Math.round(color.r * 255);
  const g255 = Math.round(color.g * 255);
  const b255 = Math.round(color.b * 255);

  return { r: r255, g: g255, b: b255 };
}


//// Power UP

let blockCount = 9;
let powerCount = 0;
let blockLimit = 10;

let powerUpObject = {
  powerUp: null,
  bb: null,
  powerUpVelocity: new THREE.Vector3(0, -0.1, 0),
};

function spawnPowerUp(xPos, yPos) {
  if (blockCount == blockLimit && !extraBall) {
    blockCount++;
    powerCount = 1;
    powerUpObject.powerUp = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.1, 0.2),
      new THREE.MeshPhongMaterial({ color: "rgb(255, 255, 0)" })
    );
    powerUpObject.powerUp.position.set(xPos, yPos, 0);
    powerUpObject.bb = new THREE.Box3().setFromObject(powerUpObject.powerUp);
    powerUpObject.powerUp.geometry.computeBoundingBox();
    powerUpObject.powerUp.castShadow = true;

    scene.add(powerUpObject.powerUp);
  }
}

function movePowerUp() {
  const fallSpeed = 0.05;
  powerUpObject.powerUp.position.x += 0;
  powerUpObject.powerUp.position.y += -fallSpeed;
  powerUpObject.bb.setFromObject(powerUpObject.powerUp);
  checkCollisionPowerUp();
  checkPowerUpPosition();
}

let extraBall = false;

function checkCollisionPowerUp() {
  let raycaster = new THREE.Raycaster(
    powerUpObject.powerUp.position,
    new THREE.Vector3(0, -0.1, 0),
    0,
    0.3
  );
  let intersect = raycaster.intersectObject(hitterMesh);
  if (intersect.length > 0) {
    powerCount = 0;
    blockCount = 0;
    scene.remove(powerUpObject.powerUp);
    spawnSecondBall();
  }
}

function spawnSecondBall() {
  extraBall = true;
  createSecondBall();
}

function restartCounters(ballObject, check) {
  if (ballObject.ball.position.y < -yPosLimit) {
    extraBall = false;
    blockCount = 0;
    powerCount = 0;
    if (check) {
      removeExtras();
    }
  }
}

function checkPowerUpPosition() {
  if (powerUpObject.powerUp.position.y < -yPosLimit) {
    powerCount = 0;
    blockCount = 0;
    scene.remove(powerUpObject.powerUp);
  }
}

function removeExtras() {
  scene.remove(ballObject2.ball);
  scene.remove(powerUpObject.powerUp);
}

//// Render

createHitterMesh();
createBall();
createCubes();
createWalls();
auxKeys();

render();

function render() {
  if (pause) return;

  if (start) {
    checkCollisionsObjects(ballObject);
    checkCollisionCubes(ballObject);
    checkCubesRemoval(ballObject);
    checkBallPosition(ballObject);
    moveBall(ballObject);
    if (powerCount === 1) movePowerUp();

    if (extraBall) {
      checkCollisionsObjects(ballObject2);
      checkCollisionCubes(ballObject2);
      checkCubesRemoval(ballObject2);
      restartCounters(ballObject2, true);
      moveBall2(ballObject2);
    }
  }

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

//// Listeners

window.addEventListener(
  "resize",
  function () {
    onWindowResize(camera, renderer);
  },
  false
);

window.addEventListener("mousemove", onMouseMove);

window.addEventListener("mousedown", () => {
  if (!start) {
    toggleStart();
  }
});

window.addEventListener("keypress", (event) => {
  if (event.key === "r") {
    window.location.reload();
    blockCount = 0;
    powerCount = 0;
  }
  if (event.key === " ") {
    togglePause();
  }
  if (event.key === "Enter") {
    toggleFullscreen();
  }
  if (event.key === "g") {
    levelUp();
    setBallPosition(ballObject);

  }
});

function auxKeys() {
  keyboard.update();
  if (keyboard.pressed("r")) {
    window.location.reload();

  }
  if (keyboard.pressed("space")) {
    togglePause();
  }
}

function toggleStart() {
  start = !start;
}

function togglePause() {
  pause = !pause;
  render();
}

function toggleFullscreen() {
  const element = document.documentElement;
  if (document.fullscreenElement) document.exitFullscreen?.();
  else element.requestFullscreen?.();
}

function onMouseMove(event) {
  let pointer = new THREE.Vector2();
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const planeWidth = 8;


  raycaster.setFromCamera(pointer, camera);
  let intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    const screenAspect = window.innerWidth / window.innerHeight;

    const xLimit = planeWidth * (window.innerWidth / window.innerHeight) - screenAspect * 2.5;
    hitterMesh.position.x = Math.min(Math.max(pointer.x * xLimit, -xLimit), xLimit);

    if (!start) {
      ballObject.ball.position.x = hitterMesh.position.x;
    }
  }
}