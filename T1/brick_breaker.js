import * as THREE from "three";
import { Object3D } from "../../build/three.module.js";
import KeyboardState from "../../libs/util/KeyboardState.js";

import {
   initRenderer,
   initCamera,
   initDefaultBasicLight,
   onWindowResize,
   lightFollowingCamera,
} from "../libs/util/util.js";

let scene, renderer, camera, light, orbit;
scene = new THREE.Scene();
scene.background = new THREE.Color("rgb(250, 250, 250)");
renderer = initRenderer();
camera = initCamera(new THREE.Vector3(0, 0, 20));
light = initDefaultBasicLight(scene, true, new THREE.Vector3(25, 20, 15));

var start = false;
var keyboard = new KeyboardState();
var pause = false;

let raycaster = new THREE.Raycaster();

raycaster.layers.enable(0);
camera.layers.enable(0);

let objects = [];
let plane, planeGeometry, planeMaterial;

planeGeometry = new THREE.PlaneGeometry(8, 16);
planeMaterial = new THREE.MeshLambertMaterial();
planeMaterial.side = THREE.DoubleSide;
planeMaterial.transparent = true;
planeMaterial.color.set("rgb(58,12,163)");
planeMaterial.opacity = 1;
plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);
objects.push(plane);

plane = objects[0];
plane.layers.set(0);

let hitterHolder = new Object3D();
let hitters = [];
let hittersBbs = [];
let hittersNormalVectors = [];
let hitterObject = {
   hitter: null,
   bb: null,
   normalVector: null,
};

let cubes = [];
let cubesBb = [];

let ballObject = {
   ball: null,
   bb: null,
   ballVelocity: new THREE.Vector3(0, -0.1, 0),
};
var ballVelocity = ballObject.ballVelocity;

let xPosLimit = 3.8;
let yPosLimit = 8;

const vectorNormalsMap = {
   0: new THREE.Vector3(-0.5, -0.25, 0),
   1: new THREE.Vector3(-0.25, -0.75, 0),
   2: new THREE.Vector3(0, 1, 0),
   3: new THREE.Vector3(0.25, -0.75, 0),
   4: new THREE.Vector3(0.5, -0.25, 0),
};

let blockColors = [
   "rgb(247, 37, 133)",
   "rgb(114, 9, 183)",
   "rgb(86, 11, 173)",
   "rgb(72, 12, 168)",
   "rgb(63, 55, 201)",
   "rgb(67, 97, 238)",
   "rgb(72, 149, 239)",
];

function createCubes() {
   const spacingX = 0.7;
   const spacingY = 0.1;
   const rows = 10;
   const cols = 8;
   const cubeSize = 0.3;
   const totalWidth = cols * (cubeSize + spacingX) - spacingX;
   const totalHeight = -4;

   let colorIndex = 0;
   for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
         const geometry = new THREE.BoxGeometry(cubeSize * 3, cubeSize, 0.1);
         const material = new THREE.MeshPhongMaterial({
            color: blockColors[colorIndex],
            shininess: "0",
            emissive: blockColors[colorIndex],
         });
         const cube = new THREE.Mesh(geometry, material);
         const xPosition =
            col * (cubeSize + spacingX) - totalWidth / 2 + cubeSize / 2;
         const yPosition =
            row * (cubeSize + spacingY) - totalHeight / 2 + cubeSize / 2;

         colorIndex = (colorIndex + 1) % blockColors.length;

         cube.position.set(xPosition, yPosition, 0);
         cube.geometry.computeBoundingBox();
         let cubeBb = new THREE.Box3().setFromObject(cube);
         cubes.push(cube);
         cubesBb.push(cubeBb);
         scene.add(cube);
      }
   }
}

function createBall() {
   ballObject.ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 30, 30, 0, Math.PI * 2, 0, Math.PI),
      new THREE.MeshPhongMaterial({ color: "rgb(37, 255, 62)", shininess: "100" })
   );
   setBallPosition(ballObject);
   ballObject.bb = new THREE.Box3().setFromObject(ballObject.ball);
   ballObject.ball.geometry.computeBoundingSphere();
   scene.add(ballObject.ball);
}

function createWalls() {
   const wallGeometry = new THREE.BoxGeometry(0.2, 16, 0.1);
   const roofGeometry = new THREE.BoxGeometry(8.3, 0.2, 0.1);
   const material = new THREE.MeshPhongMaterial({ color: "rgb(37, 255, 62)" });
   const leftWall = new THREE.Mesh(wallGeometry, material);
   const rightWall = new THREE.Mesh(wallGeometry, material);
   const topWall = new THREE.Mesh(roofGeometry, material);
   leftWall.geometry.computeBoundingBox();
   rightWall.geometry.computeBoundingBox();
   var leftWallBb = new THREE.Box3().setFromObject(leftWall);
   var rightWallBb = new THREE.Box3().setFromObject(rightWall);

   leftWall.position.set(-4.05, 0, 0);
   rightWall.position.set(4.05, 0, 0);
   topWall.position.set(0, 8.05, 0);
   scene.add(rightWall);
   scene.add(leftWall);
   scene.add(topWall);
}

function createHitter() {
   let hitterGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.1);
   let hitterMaterial = new THREE.MeshPhongMaterial({
      color: "rgb(247, 37, 133)",
      shininess: "100",
   });
   for (let i = 0; i <= 4; i++) {
      hitterObject.hitter = new THREE.Mesh(hitterGeometry, hitterMaterial);
      hitterObject.bb = new THREE.Box3().setFromObject(hitterObject.hitter);
      hitters.push(hitterObject.hitter);
      hittersBbs.push(hitterObject.bb);
      hitterObject.hitter.geometry.computeBoundingBox();

      if (i >= 0 && i <= 4) {
         hitterObject.normalVector = vectorNormalsMap[i];
      }
      hittersNormalVectors.push(hitterObject.normalVector);
   }
}

function createHitterHolder() {
   hitters.forEach((i) => hitterHolder.add(i));
   hitterHolder.position.set(0, -6, 0);
   scene.add(hitterHolder);
}

function removeCube(i) {
   scene.remove(cubes[i]);
   cubes.splice(i, 1);
   cubesBb.splice(i, 1);

   if (cubes.length == 0) {
      togglePause();
   }
}

function setBallPosition(ballObject) {
   ballObject.ball.position.set(
      hitters[3].position.x,
      hitters[3].position.y - 5.6,
      0
   );
}

function moveBall() {
   ballObject.ball.position.x += ballObject.ballVelocity.x;
   ballObject.ball.position.y += ballObject.ballVelocity.y;
   ballObject.bb.setFromObject(ballObject.ball);
}

function updateBallVel(ballVelX, ballVelY) {
   ballObject.ballVelocity.x = ballVelX;
   ballObject.ballVelocity.y = ballVelY;
}

function updateHitterPos() {
   let offset = -1;
   for (let i = 0; i < hitters.length; i++) {
      hitters[i].position.set(hitterHolder.position.x + offset, 0, 0);
      hittersBbs[i].setFromObject(hitters[i]);
      offset += 0.5;
   }
}

function checkCollisionsHitter() {
   for (let i = 0; i < hitters.length; i++) {
      let collision = ballObject.bb.intersectsBox(hittersBbs[i]);
      if (collision) {
         var normalVector = hittersNormalVectors[i].normalize();
         var incidenceVector = THREE.MathUtils.radToDeg(
            ballVelocity.angleTo(normalVector)
         );
         ballVelocity.applyAxisAngle(new THREE.Vector3(0, 0, 1), incidenceVector);
         if (ballVelocity.y < 0.009) {
            ballVelocity.y = 0.1;
         }

         updateBallVel(ballVelocity.x, ballVelocity.y);
      }
   }
}

function checkCollisionsCubes() {
   for (let i = 0; i < cubesBb.length; i++) {
      let collision = ballObject.bb.intersectsBox(cubesBb[i]);
      if (collision) {
         ballVelocity.copy(new THREE.Vector3(-ballVelocity.x, -ballVelocity.y, 0));

         removeCube(i);
         updateBallVel(ballVelocity.x, ballVelocity.y);
      }
   }
}

function checkBallPosition() {
   let velocityChanged = false;

   if (
      ballObject.ball.position.x >= xPosLimit ||
      ballObject.ball.position.x <= -xPosLimit
   ) {
      ballVelocity.x = -ballVelocity.x;
      velocityChanged = true;
   }
   if (ballObject.ball.position.y >= yPosLimit) {
      ballVelocity.y = -ballVelocity.y;
      velocityChanged = true;
   }

   if (ballObject.ball.position.y < -yPosLimit) {
      ballObject.ball.position.set(0, -1.0, 0);
      ballVelocity.x = 0;
      ballVelocity.y = -0.1;
      velocityChanged = true;
   }

   if (velocityChanged) updateBallVel(ballVelocity.x, ballVelocity.y);
}

createHitter();
createHitterHolder();
createBall();
createCubes();
createWalls();
auxKeys();

render();

function render() {
   if (!pause) {
      checkCollisionsCubes();
      checkCollisionsHitter();
      checkBallPosition();
      if (start) moveBall();
      updateHitterPos();
      requestAnimationFrame(render);
      lightFollowingCamera(light, camera);
      renderer.render(scene, camera);
   }
}

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
   }
   if (event.key === " ") {
      togglePause();
   }
   if (event.key === "Enter") {
      toggleFullscreen();
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

   raycaster.setFromCamera(pointer, camera);
   let intersects = raycaster.intersectObjects(objects);

   if (intersects.length > 0) {
      if (hitterHolder.position.x < -4) hitterHolder.position.set(-4, -6, 0);
      else if (hitterHolder.position.x > 4) hitterHolder.position.set(4, -6, 0);
      else if (hitterHolder.position.x > -4 && hitterHolder.position.x < 4)
         hitterHolder.position.set(pointer.x * 4, -6, 0);
   }
}
