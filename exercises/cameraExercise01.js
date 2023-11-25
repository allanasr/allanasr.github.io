import * as THREE from "three";
import KeyboardState from "../libs/util/KeyboardState.js";
import { TeapotGeometry } from "../build/jsm/geometries/TeapotGeometry.js";
import {
  initRenderer,
  initDefaultSpotlight,
  createGroundPlaneXZ,
  SecondaryBox,
  onWindowResize,
} from "../libs/util/util.js";

let scene, renderer, light, camera, keyboard;
scene = new THREE.Scene(); // Create main scene
renderer = initRenderer(); // View function in util/utils
light = initDefaultSpotlight(scene, new THREE.Vector3(5.0, 5.0, 5.0)); // Use default light
window.addEventListener(
  "resize",
  function () {
    onWindowResize(camera, renderer);
  },
  false
);
keyboard = new KeyboardState();

let clock = new THREE.Clock();

var groundPlane = createGroundPlaneXZ(10, 10, 40, 40); // width, height, resolutionW, resolutionH
scene.add(groundPlane);

// Create objects
createTeapot(2.0, 0.4, 0.0, Math.random() * 0xffffff);
createTeapot(0.0, 0.4, 2.0, Math.random() * 0xffffff);
createTeapot(0.0, 0.4, -2.0, Math.random() * 0xffffff);

let camPos = new THREE.Vector3(3, 4, 8);
let camUp = new THREE.Vector3(0.0, 1.0, 0.0);
let camLook = new THREE.Vector3(0.0, 0.0, 0.0);
var message = new SecondaryBox("");

// Main camera
camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.copy(camPos);
camera.up.copy(camUp);
camera.lookAt(camLook);

render();

function updateCamera() {
  // DICA: Atualize a câmera aqui!
  camera.position.copy(camPos);
  camera.lookAt(camLook);

  message.changeMessage(
    "Pos: {" +
      camPos.x +
      ", " +
      camPos.y +
      ", " +
      camPos.z +
      "} " +
      "/ LookAt: {" +
      camLook.x +
      ", " +
      camLook.y +
      ", " +
      camLook.z +
      "}"
  );
}

function keyboardUpdate() {
  keyboard.update();

  // DICA: Insira aqui seu código para mover a câmera

  if (keyboard.pressed("A")) camLook.x = camLook.x - 0.1;
  if (keyboard.pressed("D")) camLook.x = camLook.x + 0.1;
  if (keyboard.pressed("W")) camLook.z = camLook.z + 0.1;
  if (keyboard.pressed("S")) camLook.z = camLook.z - 0.1;
  if (keyboard.pressed("Q")) camLook.y = camLook.y - 0.3;
  if (keyboard.pressed("E")) camLook.y = camLook.y + 0.3;

  // Keyboard.pressed - execute while is pressed
  if (keyboard.pressed("left")) camPos.x = camPos.x - 0.1;
  if (keyboard.pressed("right")) camPos.x = camPos.x + 0.1;
  if (keyboard.pressed("up")) camPos.z = camPos.z + 0.5;
  if (keyboard.pressed("down")) camPos.z = camPos.z - 0.5;
  if (keyboard.pressed("8"))
    // page up
    camPos.y = camPos.y + 0.1;
  if (keyboard.pressed("5"))
    // page down
    camPos.y = camPos.y - 0.1;

  updateCamera();
}

function createTeapot(x, y, z, color) {
  var geometry = new TeapotGeometry(0.5);
  var material = new THREE.MeshPhongMaterial({ color, shininess: "200" });
  material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
  obj.castShadow = true;
  obj.position.set(x, y, z);
  scene.add(obj);
}

function render() {
  requestAnimationFrame(render);
  keyboardUpdate();
  renderer.render(scene, camera); // Render scene
}
