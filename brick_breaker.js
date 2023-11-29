import * as THREE from "three";
import KeyboardState from "../../libs/util/KeyboardState.js";
import { OrbitControls } from "../build/jsm/controls/OrbitControls.js";
import { initRenderer, initCamera, onWindowResize } from "../libs/util/util.js";
import { CSG } from "../libs/other/CSGMesh.js";
import { Buttons } from "../libs/other/buttons.js";
import { OBJLoader } from '../build/jsm/loaders/OBJLoader.js';


let scene, renderer, camera, speedometer, orbit;
scene = new THREE.Scene();
renderer = initRenderer();
camera = initCamera(new THREE.Vector3(0, -7, 10));

var start = false;
var keyboard = new KeyboardState();
var pause = false;
var endFlag = false;

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
planeMaterial.opacity = 0;
plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.receiveShadow = true;

scene.add(plane);
objects.push(plane);

plane = objects[0];
plane.position.set(0, 0.2, -0.5);
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

let yPosLimit = 5;

const blockColors = [
  "rgb(188, 188, 188)", // cinza
  "rgb(216,40,0)", // vermelho
  "rgb(0,112,236)", // azul
  "rgb(252,152,56)", // laranja
  "rgb(252,116,180)", // rosa
  "rgb(128,208,16)", // verde
];

let nivel = 1;

function createCubes() {
  const spacingX = 0.4;
  const spacingY = 0.1;
  let rows = 6;
  let cols = 11;
  const cubeSize = 0.3;
  const totalWidth = cols * (cubeSize + spacingX) - spacingX;
  const totalHeight = -2;

  if (nivel == 1) {
    rows = 6;
    for (let row = 0; row < rows; row++) {
      // Comment this to add the remaining blocks back
      // if (row != 5) continue;
      const colorIndex = blockColors.length - 1 - (row % blockColors.length);
      for (let col = 0; col < cols; col++) {
        const geometry = new THREE.BoxGeometry(cubeSize * 2.2, cubeSize, 0.4);
        let material;
        if (blockColors[colorIndex] === "rgb(188, 188, 188)") {
          material = setMaterial(
            "rgb(200, 200, 200)",
            "assets/textures/01-Breakout-Tiles.png"
          );
        } else {
          const textureFile = `assets/textures/0${
            colorIndex + 1
          }-Breakout-Tiles.png`;
          material = setMaterial(blockColors[colorIndex], textureFile);
        }

        const cube = new THREE.Mesh(geometry, material);
        cube.userData.originalColor = {
          color: blockColors[colorIndex],
          texture: `assets/textures/0${colorIndex + 1}-Breakout-Tiles.png`,
        };
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
          let material;
          if (blockColors[colorIndex] === "rgb(188, 188, 188)") {
            material = setMaterial(
              "rgb(200, 200, 200)",
              "assets/textures/01-Breakout-Tiles.png"
            );
          } else {
            const textureFile = `assets/textures/0${
              colorIndex + 1
            }-Breakout-Tiles.png`;
            material = setMaterial(blockColors[colorIndex], textureFile);
          }
          const cube = new THREE.Mesh(geometry, material);
          cube.userData.originalColor = {
            color: blockColors[colorIndex],
            texture:
              blockColors[colorIndex] === "rgb(188, 188, 188)"
                ? "assets/textures/01-Breakout-Tiles.png"
                : `assets/textures/0${colorIndex + 1}-Breakout-Tiles.png`,
          };
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

  if (nivel == 3) {
    rows = 11;
    let indestructive = {
      color: "rgba(240,188,60)", // laranja
      texture: "assets/textures/07-Breakout-Tiles.png",
    };

    const colorForColumns = {
      0: {
        color: blockColors[1],
        texture: "assets/textures/03-Breakout-Tiles.png",
      },
      2: {
        color: blockColors[2],
        texture: "assets/textures/02-Breakout-Tiles.png",
      },
      3: {
        color: blockColors[4],
        texture: "assets/textures/05-Breakout-Tiles.png",
      },
      4: {
        color: blockColors[5],
        texture: "assets/textures/06-Breakout-Tiles.png",
      },
      5: {
        color: blockColors[4],
        texture: "assets/textures/05-Breakout-Tiles.png",
      },
      6: {
        color: blockColors[5],
        texture: "assets/textures/06-Breakout-Tiles.png",
      },
      7: {
        color: blockColors[4],
        texture: "assets/textures/05-Breakout-Tiles.png",
      },
      8: {
        color: blockColors[4],
        texture: "assets/textures/02-Breakout-Tiles.png",
      },
      10: {
        color: blockColors[4],
        texture: "assets/textures/03-Breakout-Tiles.png",
      },
    };

    for (let col = 0; col < cols; col++) {
      if (col === 1 || col === 9) continue;

      let currentRows = col === 3 || col === 5 || col === 7 ? 1 : rows;
      let startRow = col === 3 || col === 5 || col === 7 ? 7 : 0;

      for (let row = startRow; row < startRow + currentRows; row++) {
        let colorEntry = colorForColumns[col] || {
          color: "rgb(255,255,255)",
          texture: null,
        };
        let color = colorEntry.color;
        let textureFile = colorEntry.texture;
        if ((col === 0 || col === 10) && row === 1) {
          color = colorForColumns[3].color; // Assign only the color part
          textureFile = colorForColumns[3].texture;
        } else if (
          (col === 2 || col === 4 || col === 6 || col === 8) &&
          (row === 1 || row == 7)
        ) {
          colorEntry = indestructive;
          color = colorEntry.color;
          textureFile = colorEntry.texture;
        } else {
          color = colorForColumns[col];
        }
        const material = setMaterial(color, textureFile);
        const geometry = new THREE.BoxGeometry(cubeSize * 2.2, cubeSize, 0.4);
        const cube = new THREE.Mesh(geometry, material);
        cube.userData.originalColor = colorEntry;

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
  const wallGeometry = new THREE.BoxGeometry(0.2, 19, 0.4);
  const roofGeometry = new THREE.BoxGeometry(8.3, 0.2, 0.4);
  const material = new THREE.MeshPhongMaterial({ color: "rgb(105,105,105)" });
  const leftWall = new THREE.Mesh(wallGeometry, material);
  const rightWall = new THREE.Mesh(wallGeometry, material);
  const topWall = new THREE.Mesh(roofGeometry, material);

  leftWall.position.set(-4.05, -1.5, 0);
  rightWall.position.set(4.05, -1.5, 0);
  topWall.position.set(0, 8, 0);
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
  hitterMesh.position.set(0, -5.5, 0);
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

let ballObject3 = {
  ball: null,
  bb: null,
  ballVelocity: new THREE.Vector3(0, -3.5, 0),
};

function createBall() {
  ballObject.ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 30, 30, 0, Math.PI * 2, 0, Math.PI),
    new THREE.MeshPhongMaterial({
      color: "rgb(255,255,2555)",
      shininess: "100",
    })
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

  ballObject2.bb = new THREE.Box3().setFromObject(ballObject.ball);
  ballObject2.ball.geometry.computeBoundingSphere();
  ballObject2.ball.castShadow = true;

  ballObject2.ball.position.set(
    ballObject.ball.position.x,
    ballObject.ball.position.y,
    0
  );
  scene.add(ballObject2.ball);
}

function createThirdBall() {
  ballObject3.ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 30, 30, 0, Math.PI * 2, 0, Math.PI),
    new THREE.MeshPhongMaterial({ color: "rgb(255, 255, 0)", shininess: "100" })
  );

  ballObject3.bb = new THREE.Box3().setFromObject(ballObject.ball);
  ballObject3.ball.geometry.computeBoundingSphere();
  ballObject3.ball.castShadow = true;

  ballObject3.ball.position.set(
    ballObject.ball.position.x,
    ballObject.ball.position.y,
    0
  );
  scene.add(ballObject3.ball);
}

function spawnExtraBalls() {
  extraBall = true;
  ballObject2.ballVelocity = new THREE.Vector3(
    ballObject.ballVelocity.x * -1,
    ballObject.ballVelocity.y * -1,
    0
  );
  ballObject3.ballVelocity = new THREE.Vector3(
    ballObject.ballVelocity.x * -1,
    ballObject.ballVelocity.y * 1,
    0
  );
  createSecondBall();
  createThirdBall();
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
  if (pause) return;

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
  if (pause) return;

  ballObject2.ball.position.x += ballObject2.ballVelocity.x * deltaTime;
  ballObject2.ball.position.y += ballObject2.ballVelocity.y * deltaTime;
  ballObject2.bb.setFromObject(ballObject2.ball);
}

function checkBallPosition(ballObject) {
  if (ballObject.ball.position.y < -yPosLimit) {
    currentLives--;
    updateLivesDisplay();
    blockCount = 0;
    powerCount = 0;
    respawnBall();
    if (nivel == 2) {
      setBallPosition(ballObject);
    }
    speedMultiplier = 1;
    startTime = currentTime;
    if (currentLives <= 0) {
      gameOver();
    }
  }
}

function respawnBall() {
  setBallPosition(ballObject);
  ballObject.ballVelocity.x = 0;
  ballObject.ballVelocity.y = -3.5;
  toggleStart();
  togglePause();
}
//// Life

const hearts = [];
const maxLives = 5;
let currentLives = maxLives;
var fixedScene = new THREE.Scene();

initLivesDisplay();

function initLivesDisplay() {
  for (let i = 0; i < maxLives; i++) {
    const heartMesh = createHeartMesh();
    heartMesh.position.set(0.5 + i * 0.7, 7, 0);
    heartMesh.scale.set(0.025, 0.025);
    fixedScene.add(heartMesh);
    hearts.push(heartMesh);
  }
}
scene.add(fixedScene);

function updateLivesDisplay() {
  hearts.forEach((heart, index) => {
    heart.visible = index < currentLives;
  });
}

function createHeartMesh() {
  const x = 0,
    y = 0;
  const heartShape = new THREE.Shape();
  heartShape.moveTo(x + 5, y + 5);
  heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
  heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
  heartShape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
  heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
  heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
  heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);
  const geometry = new THREE.ShapeGeometry(heartShape);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotateZ(THREE.MathUtils.degToRad(180));
  return mesh;
}

function gameOver() {
  toggleStart();
  togglePause();
  showEndScreen(false);
}

function startNewGame() {
  initLivesDisplay();
  currentLives = maxLives;
  window.location.reload();
  blockCount = 0;
  powerCount = 0;
  updateLivesDisplay();
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
      if (intersects[0].object == hitterMesh) playAudio(rebatedor);
    }
  }
}

let indestructive = false;

function checkCollisionCubes(ballObjects) {
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
      ballObjects.ball.position,
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
      if (indestructive && ballObjects == ballObject) {
        playAudio(bloco3);
      } else {
        playAudio(bloco2);
        handleReflection(incidenceVector, ballObjects);
      }
    }
  }
}

function checkCubesRemoval(ballObject) {
  for (let i = 0; i < cubesBb.length; i++) {
    let collision = ballObject.bb.intersectsBox(cubesBb[i]);
    if (collision) {
      const cubeColor = convertTo255(cubes[i].userData.originalColor.color);
      if (cubeColor.r != 188 && cubeColor.g != 188 && cubeColor.b != 188) {
        if (powerCount == 0) {
          blockCount++;
          blockCount2++;
          if (blockCount == blockLimit) {
            spawnPowerUp1(cubes[i].position.x, cubes[i].position.y);
          }
          if (blockCount2 == blockLimit + 5) {
            spawnPowerUp2(cubes[i].position.x, cubes[i].position.y);
          }
        }
        removeCube(i);
        playAudio(bloco1);
      } else if (
        cubeColor.r == 240 &&
        cubeColor.g == 188 &&
        cubeColor.b == 60
      ) {
        continue;
      } else {
        cubes[i].material.color.set("rgb(166, 165, 165)");
        cubes[i].userData.originalColor.color = "rgb(166, 165, 165)";
        playAudio(bloco2);
      }
    }
  }
  if (nivel != 3) {
    if (cubes.length == 0) {
      hitterMesh.position.set(-4, -6, 0);
      setBallPosition(ballObject);
      if (nivel == 1) {
        levelUp(2);
      } else {
        levelUp(3);
      }
    }
  } else {
    if (cubes.length == 8) {
      endFlag = true;
    }
  }
}

function levelUp(lvl) {
  nivel = lvl;
  removeAll();
  createCubes();
  createHitterMesh();
  createBall();
  createWalls();
  setBallPosition(ballObject);
}

function convertTo255(color) {
  const parts = color.match(/\d+/g).map(Number);
  return {
    r: parts[0],
    g: parts[1],
    b: parts[2],
  };
}

//// Power UP

let blockCount = 9;
let blockCount2 = 13;
let powerCount = 0;
let blockLimit = 10;

let powerUpObject = {
  powerUp: null,
  bb: null,
  powerUpVelocity: new THREE.Vector3(0, -0.1, 0),
};

let powerUpObject2 = {
  powerUp: null,
  bb: null,
  powerUpVelocity: new THREE.Vector3(0, -0.1, 0),
};

function spawnPowerUp1(xPos, yPos) {
  if (blockCount == blockLimit && !extraBall) {
    blockCount++;
    powerCount = 1;
    powerUpObject.powerUp = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.15, 0.1, 32),
      new THREE.MeshPhongMaterial({ color: "rgb(255, 255, 0)" })
    );
    powerUpObject.powerUp.position.set(xPos, yPos, 0);
    powerUpObject.bb = new THREE.Box3().setFromObject(powerUpObject.powerUp);
    powerUpObject.powerUp.geometry.computeBoundingBox();
    powerUpObject.powerUp.castShadow = true;

    scene.add(powerUpObject.powerUp);
  }
}

function spawnPowerUp2(xPos, yPos) {
  if (blockCount2 == blockLimit + 5 && !indestructive) {
    blockCount2++;
    powerCount = 2;
    powerUpObject2.powerUp = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.15, 0.1, 32),
      new THREE.MeshPhongMaterial({ color: "rgb(0, 255, 255)" })
    );
    powerUpObject2.powerUp.position.set(xPos, yPos, 0);
    powerUpObject2.bb = new THREE.Box3().setFromObject(powerUpObject2.powerUp);
    powerUpObject2.powerUp.geometry.computeBoundingBox();
    powerUpObject2.powerUp.castShadow = true;

    scene.add(powerUpObject2.powerUp);
  }
}

function indestructiveMode() {
  indestructive = true;

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      indestructive = false;
      ballObject.ball.material = new THREE.MeshPhongMaterial({
        color: "rgb(255, 255, 255)",
      });

      resolve();
    }, 7000);
  });
}

function movePowerUp(powerUp) {
  const fallSpeed = 0.03;
  powerUp.powerUp.position.x += 0;
  powerUp.powerUp.position.y += -fallSpeed;
  powerUp.bb.setFromObject(powerUp.powerUp);
  checkCollisionPowerUp(powerUp);
  checkPowerUpPosition(powerUp);
}

let extraBall = false;

function checkCollisionPowerUp(powerUp) {
  let raycaster = new THREE.Raycaster(
    powerUp.powerUp.position,
    new THREE.Vector3(0, -0.1, 0),
    0,
    0.3
  );
  let intersect = raycaster.intersectObject(hitterMesh);
  if (intersect.length > 0) {
    if (powerUp == powerUpObject) {
      powerCount = 0;
      blockCount = 0;
      spawnExtraBalls();
    } else if (powerUp == powerUpObject2) {
      powerCount = 0;
      blockCount2 = 0;
      ballObject.ball.material = new THREE.MeshPhongMaterial({
        color: "rgb(255, 0, 0)",
      });
      indestructiveMode();
    }
    scene.remove(powerUp.powerUp);
  }
}

function restartCounters() {
  if (
    (ballObject2.ball.position.y < -yPosLimit &&
      ballObject3.ball.position.y < -yPosLimit) ||
    ballObject.ball.position.y < -yPosLimit
  ) {
    extraBall = false;
    blockCount = 0;
    blockCount2 = 0;
    powerCount = 0;
    removeExtras();
  }
}

function checkPowerUpPosition(powerUp) {
  if (powerUp.powerUp.position.y < -yPosLimit) {
    if (powerUp == powerUpObject) {
      powerCount = 0;
      blockCount = 0;
      scene.remove(powerUpObject.powerUp);
    }
    if (powerUp == powerUpObject2) {
      powerCount = 0;
      blockCount2 = 0;
      scene.remove(powerUpObject2.powerUp);
    }
  }
}

function removeExtras() {
  scene.remove(ballObject2.ball);
  scene.remove(ballObject3.ball);

  scene.remove(powerUpObject.powerUp);
  scene.remove(powerUpObject2.powerUp);
}

//// Start
const loadingManager = new THREE.LoadingManager(() => {
  let loadingScreen = document.getElementById("loading-screen");
  loadingScreen.transition = 0;

  let button = document.getElementById("myBtn");
  button.style.backgroundColor = "Red";
  button.innerHTML = "Click to Enter";
  button.addEventListener("click", onButtonPressed);
});

function onButtonPressed() {
  start = false;
  const loadingScreen = document.getElementById("loading-screen");
  loadingScreen.transition = 0;
  loadingScreen.classList.add("fade-out");
  loadingScreen.addEventListener("transitionend", (e) => {
    const element = e.target;
    element.remove();
  });
}

//// End

function showEndScreen(win) {
  document.getElementById("endScreen").style.display = "flex";
  document.getElementById("endScreen").innerHTML += win
    ? "<h1>You Win!</h1>"
    : "<h1>You Lose!</h1>";
  document
    .getElementById("restartButton")
    .addEventListener("click", function () {
      hideEndScreen();
      startNewGame();
    });
}

function toggleEndGame() {
  toggleStart();
  togglePause();
  showEndScreen(true);
}

function hideEndScreen() {
  document.getElementById("endScreen").style.display = "none";
}

//// Buttons
var buttons = new Buttons(onButtonDown);
function onButtonDown(event) {
  switch (event.target.id) {
    case "A":
      toggleStart();
      if (!orbitEnabled) {
        if (!start) {
          toggleStart();
        }
        if (pause) {
          togglePause();
        }
      }

      break;
    case "full":
      buttons.setFullScreen();
      break;
  }
}


//// Texture

function loadTexture(manager, file) {
  const loader = new THREE.TextureLoader(manager);
  return loader.load(file);
}
function setMaterial(color, file = null, repeatU = 1, repeatV = 0.8) {
  if (!color) color = "rgb(255,255,255)";

  let mat;
  if (!file) {
    mat = new THREE.MeshBasicMaterial({ color: color });
  } else {
    let object = loadTexture(loadingManager, file);
    mat = new THREE.MeshBasicMaterial({ map: object, color: color });
    mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
    mat.map.minFilter = mat.map.magFilter = THREE.LinearFilter;
    mat.map.repeat.set(repeatU, repeatV);
  }
  return mat;
}

const path = "assets/textures/milky-way/";
const format = ".png";
const urls = [
  path + "negx" + format,
  path + "posx" + format,
  path + "posy" + format,
  path + "negy" + format,
  path + "negz" + format,
  path + "posz" + format,
];

function loadCubeMapTexture(manager, urls) {
  const loader = new THREE.CubeTextureLoader(manager);
  return loader.load(urls);
}

const cubeMapTexture = loadCubeMapTexture(loadingManager, urls);
cubeMapTexture.rotation = 2 * Math.PI;
scene.background = cubeMapTexture;
scene.background.rotation = Math.PI;
function loadModel(objPath, texturePath) {
  const loader = new OBJLoader();
  loader.load(
    objPath,
    function (object) { loadModelTexture(object, texturePath); },
    function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, function (error) {

      console.log('An error happened');

    }
  );
}

function loadModelTexture(object, texturePath) {
  const loader = new THREE.TextureLoader();
  loader.load(
    texturePath,
    function (texture) {
      applyTexture(object, texture);
    },
    undefined,
    function (err) {
      console.error('An error happened.');
    }
  );
}

function applyTexture(object, texture) {
  const material = new THREE.MeshBasicMaterial({ map: texture });

  object.traverse(function (child) {
    if (child instanceof THREE.Mesh) {
      child.material = material;
    }
  });

  hitterMesh.traverse(function (child) {
    if (child instanceof THREE.Mesh) {
      child.material = material;
    }
  });

  setTransformations(object);

  hitterMesh.add(object);
  object.castShadow = true;
  object.receiveShadow = true;

  animate();
}

function setTransformations(object) {
  object.position.set(0, 1, -0.2);
  object.scale.set(0.2, 0.2, 0.2);
  object.rotation.x = Math.PI / 2;
  object.rotation.y = Math.PI;
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

const objPath = 'assets/textures/spaceship.obj';
const texturePath = 'assets/textures/spaceship.png';

loadModel(objPath, texturePath);
//// Render

let deltaTime;
createHitterMesh();
createBall();
createCubes();
createWalls();
render();

function render() {
  requestAnimationFrame(render);
  if (!pause) {
    deltaTime = clock.getDelta();
    auxKeys();
    if (start) {
      checkCollisionsObjects(ballObject);
      checkCollisionCubes(ballObject);
      checkCubesRemoval(ballObject);
      checkBallPosition(ballObject);
      moveBall(ballObject);

      if (powerCount === 1) movePowerUp(powerUpObject);
      if (powerCount === 2) movePowerUp(powerUpObject2);

      if (extraBall) {
        checkCollisionsObjects(ballObject2);
        checkCollisionCubes(ballObject2);
        checkCubesRemoval(ballObject2);
        moveBall2(ballObject2);
        checkCollisionsObjects(ballObject3);
        checkCollisionCubes(ballObject3);
        checkCubesRemoval(ballObject3);
        restartCounters();
        moveBall2(ballObject3);
      }
    }
  }

  renderer.render(scene, camera);
  if (pause) {
    orbit.update(); // Make sure to call update on your OrbitControls instance
  }
}

//// Listeners

window.addEventListener(
  "resize",
  function () {
    onWindowResize(camera, renderer);
  },
  false
);



window.addEventListener("keydown", (event) => {
  if (event.key === "r") {
    window.location.reload();
    blockCount = 0;
    blockCount2 = 0;
    powerCount = 0;
  }
  if (event.key === " ") {
    togglePause();
  }
  if (event.key === "Enter") {
    toggleFullscreen();
  }
  if (event.key === "g") {
    levelUp(2);
    setBallPosition(ballObject);
  }
  if (event.key === "h") {
    levelUp(3);
    setBallPosition(ballObject);
  }
  if (event.key === "i") {
    showEndScreen(false);
  }
  if (event.key === "o") {
    toggleOrbit();
  }
});

function auxKeys() {
  keyboard.update();
  if (keyboard.pressed("r")) {
    window.location.reload();
  }
}

function toggleStart() {
  start = !start;
}

function togglePause() {
  pause = !pause;
  if (pause) {
    clock.stop();
  } else {
    clock.start();
  }
}

function toggleFullscreen() {
  const element = document.documentElement;
  if (document.fullscreenElement) document.exitFullscreen?.();
  else element.requestFullscreen?.();
}
let orbitEnabled = false;
let initialCameraPosition = camera.position.clone();
let initialCameraRotation = camera.rotation.clone();
function toggleOrbit() {
  if (!orbitEnabled) {
    orbit = new OrbitControls(camera, renderer.domElement);
    orbitEnabled = true;
    togglePause();
  } else {
    orbit.dispose();
    orbitEnabled = false;
    togglePause();
    camera.position.copy(initialCameraPosition);
    camera.rotation.copy(initialCameraRotation);
  }
}

let isTouching = false;

window.addEventListener("touchstart", onTouchStart);
window.addEventListener("touchmove", onTouchMove);
window.addEventListener("touchend", onTouchEnd);

function onTouchStart(event) {
  isTouching = true;
}

function onTouchMove(event) {
  if (!isTouching) return;

  event.preventDefault();

  let touch = event.touches[0];

  let pointer = new THREE.Vector2();
  pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;

  const planeWidth = 8;

  raycaster.setFromCamera(pointer, camera);
  let intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    const screenAspect = window.innerWidth / window.innerHeight;

    const xLimit =
      planeWidth * (window.innerWidth / window.innerHeight) -
      screenAspect * 5;
    hitterMesh.position.x = Math.min(
      Math.max(pointer.x * xLimit, -xLimit),
      xLimit
    );
    if (!start) {
      ballObject.ball.position.x = hitterMesh.position.x;
    }
  }
}

function onTouchEnd(event) {
  isTouching = false;
}
//// AUDIO

const listener = new THREE.AudioListener();
camera.add(listener);

const bloco1 = new THREE.Audio(listener);
const bloco2 = new THREE.Audio(listener);
const bloco3 = new THREE.Audio(listener);
const rebatedor = new THREE.Audio(listener);

function loadAndSetAudio(manager, file, object, volume = 0.5, loop = false) {
  const audioLoader = new THREE.AudioLoader(manager);
  audioLoader.load(file, function (buffer) {
    object.setBuffer(buffer);
    object.setLoop(loop);
    object.setVolume(volume);
  });
}

loadAndSetAudio(loadingManager, "assets/sounds/bloco1.mp3", bloco1);
loadAndSetAudio(loadingManager, "assets/sounds/bloco2.mp3", bloco2);
loadAndSetAudio(loadingManager, "assets/sounds/bloco3.mp3", bloco3);
loadAndSetAudio(loadingManager, "assets/sounds/rebatedor.mp3", rebatedor);

camera.add(bloco1, bloco2, bloco3, rebatedor);

function playAudio(audio) {
  audio.stop();
  audio.play();
}
