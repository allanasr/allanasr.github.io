/*
Return a new CSG solid representing space in either this solid or in the
solid `csg`. Neither this solid nor the solid `csg` are modified.

    A.union(B)

    +-------+            +-------+
    |       |            |       |
    |   A   |            |       |
    |    +--+----+   =   |       +----+
    +----+--+    |       +----+       |
         |   B   |            |       |
         |       |            |       |
         +-------+            +-------+

Return a new CSG solid representing space in this solid but not in the
solid `csg`. Neither this solid nor the solid `csg` are modified.

    A.subtract(B)

    +-------+            +-------+
    |       |            |       |
    |   A   |            |       |
    |    +--+----+   =   |    +--+
    +----+--+    |       +----+
         |   B   |
         |       |
         +-------+

Return a new CSG solid representing space both this solid and in the
solid `csg`. Neither this solid nor the solid `csg` are modified.

    A.intersect(B)

    +-------+
    |       |
    |   A   |
    |    +--+----+   =   +--+
    +----+--+    |       +--+
         |   B   |
         |       |
         +-------+
*/

import * as THREE from "three";
import Stats from "../build/jsm/libs/stats.module.js";
import GUI from "../libs/util/dat.gui.module.js";
import { TrackballControls } from "../build/jsm/controls/TrackballControls.js";
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  createGroundPlane,
  onWindowResize,
} from "../libs/util/util.js";

import { CSG } from "../libs/other/CSGMesh.js";

var scene = new THREE.Scene(); // Create main scene
var stats = new Stats(); // To show FPS information

var renderer = initRenderer(); // View function in util/utils
renderer.setClearColor("rgb(30, 30, 40)");
var camera = initCamera(new THREE.Vector3(2, -8, 6)); // Init camera in this position
camera.up.set(0, 0, 1);

window.addEventListener(
  "resize",
  function () {
    onWindowResize(camera, renderer);
  },
  false
);
initDefaultBasicLight(scene, true, new THREE.Vector3(12, -15, 20), 28, 1024);

var groundPlane = createGroundPlane(20, 20); // width and height (x, y)
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper(12);
scene.add(axesHelper);

var trackballControls = new TrackballControls(camera, renderer.domElement);

// To be used in the interface
let mesh1, mesh2;

let lightPosition = new THREE.Vector3(3, -5, 0.0);
let lightColor = "rgb(255,255,255)";


// Sphere to represent the light
let spotLight = new THREE.SpotLight(lightColor, 0.9, 0);
setSpotLight(lightPosition);

spotLight.visible = true;

function setSpotLight(position) {
  spotLight.position.copy(position);
  spotLight.angle = THREE.MathUtils.degToRad(40);
  spotLight.decay = 2; // The amount the light dims along the distance of the light.
  spotLight.penumbra = 1; // Percent of the spotlight cone that is attenuated due to penumbra.

  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 512;
  spotLight.shadow.mapSize.height = 512;
  spotLight.name = "Spot Light";

  scene.add(spotLight);
}


buildInterface();
buildObjects();
render();

function buildObjects() {
  let auxMat = new THREE.Matrix4();

  let bigCylinderMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 3, 20)
  );
  let smallCylinderMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 3, 20)
  );
  let cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
  let torusMesh = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.15, 20, 20));

  let csgObject,
    bigCylinderCSG,
    smallCylinderCSG,
    torusCSG,
    csgObject2,
    cubeCSG;

  bigCylinderMesh.position.set(1, -0.3, 0.0);
  updateObject(bigCylinderMesh);
  bigCylinderCSG = CSG.fromMesh(bigCylinderMesh);

  smallCylinderMesh.position.set(1, -0.5, 0);
  updateObject(smallCylinderMesh);
  smallCylinderCSG = CSG.fromMesh(smallCylinderMesh);

  csgObject = bigCylinderCSG.subtract(smallCylinderCSG);
  mesh1 = CSG.toMesh(csgObject, auxMat);

  // Build the mug
  mesh1.material = new THREE.MeshPhongMaterial({
    color: "rgb(255,20,20)",
    shininess: 300,
  });
  mesh1.position.set(0, 0, 1.22);
  mesh1.rotateOnAxis(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(-90));
  mesh1.material.specular = new THREE.Color(0xffffff);
  mesh1.material.specularIntensity = 2;
  scene.add(mesh1);

  // ------ //
  // Build the handle
  torusMesh.rotateX(THREE.MathUtils.degToRad(90));
  torusMesh.position.set(1, 0.0, 1.0); // reset position
  updateObject(torusMesh);
  torusCSG = CSG.fromMesh(torusMesh);

  cubeMesh.position.set(2, 0, 1.0); // reset position
  updateObject(cubeMesh);
  cubeCSG = CSG.fromMesh(cubeMesh);

  csgObject2 = torusCSG.subtract(cubeCSG);
  mesh2 = CSG.toMesh(csgObject2, auxMat);

  mesh2.material = new THREE.MeshPhongMaterial({
    color: "rgb(255,20,20)",
    shininess: 1000,
  });
  mesh2.position.set(-0.84, 0, 0.3);
  scene.add(mesh2);
}

function updateObject(mesh) {
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
}

function buildInterface() {
  var controls = new (function () {
    this.wire = false;

    this.onWireframeMode = function () {
      mesh1.material.wireframe = this.wire;
      mesh2.material.wireframe = this.wire;
    };
  })();

  // GUI interface
  var gui = new GUI();
  gui
    .add(controls, "wire", false)
    .name("Wireframe")
    .onChange(function (e) {
      controls.onWireframeMode();
    });
}

function render() {
  stats.update(); // Update FPS
  trackballControls.update();
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera); // Render scene
}
