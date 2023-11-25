import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

let scene, renderer, camera, material, light, orbit; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(15, 15, 30)); // Init camera in this position
material = setDefaultMaterial('rgb(250, 97, 169)'); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

// create a cube
let cubeGeometry = new THREE.BoxGeometry(11, 0.3, 6);
let cube = new THREE.Mesh(cubeGeometry, material);
// position the cube
cube.position.set(0.0, 3.0, 0.0);
// add the cube to the scene
scene.add(cube);
// create a cylinder
let cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 32);
let c1 = new THREE.Mesh(cylinderGeometry, material);
let c2 = new THREE.Mesh(cylinderGeometry, material);
let c3 = new THREE.Mesh(cylinderGeometry, material);
let c4 = new THREE.Mesh(cylinderGeometry, material);

// position the cylinder
c1.position.set(5.0, -1.5, 2.5);
c2.position.set(5.0, -1.5, -2.5);
c3.position.set(-5.0, -1.5, 2.5);
c4.position.set(-5.0, -1.5, -2.5);
// add the cylinder to the cube
cube.add(c1);
cube.add(c2);
cube.add(c3);
cube.add(c4);

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