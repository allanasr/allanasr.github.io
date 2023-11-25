import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

let scene, renderer, camera, material, material2, material3, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

material = setDefaultMaterial('lightgreen'); // create a basic material
material2 = setDefaultMaterial('lightsalmon'); // create a basic material
material3 = setDefaultMaterial('lightblue'); // create a basic material

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

// create a cube
let cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
let sphereGeometry = new THREE.SphereGeometry(2, 15, 80);
let cilinderGeometry = new THREE.CylinderGeometry(2,2 ,4);
let cube = new THREE.Mesh(cubeGeometry, material);
let sphere = new THREE.Mesh(sphereGeometry, material2);
let cylinder = new THREE.Mesh(cilinderGeometry, material3);
// position the cube
cube.position.set(-3.0, 2.0, -3.0);
sphere.position.set(4.0, 2.0, -7.0);
cylinder.position.set(6.0, 2.0, 5.0);
// add the cube to the scene
scene.add(cube);
scene.add(sphere);
scene.add(cylinder);

// Use this to show information onscreen
let controls = new InfoBox();
  controls.add("Basic Scene");
  controls.addParagraph();
  controls.add("Use mouse to interact:");
  controls.add("* Left button to rotate");
  controls.add("* Right button to translate (pan)");
  controls.add("* Scroll to zoom in/out.");
  controls.show();

render();
function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}