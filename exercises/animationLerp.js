import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initDefaultSpotlight,
        initCamera,
        createGroundPlane,
        onWindowResize} from "../libs/util/util.js";

let scene    = new THREE.Scene();    // Create main scene
let renderer = initRenderer();    // View function in util/utils
let light    = initDefaultSpotlight(scene, new THREE.Vector3(7.0, 7.0, 7.0)); 
let camera   = initCamera(new THREE.Vector3(3.6, 4.6, 8.2)); // Init camera in this position
let trackballControls = new TrackballControls(camera, renderer.domElement );

// Show axes 
let axesHelper = new THREE.AxesHelper( 5 );
  axesHelper.translateY(0.1);
scene.add( axesHelper );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

let groundPlane = createGroundPlane(10, 10, 40, 40); // width, height, resolutionW, resolutionH
  groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Create sphere
let geometry = new THREE.SphereGeometry( 0.2, 32, 16 );
let material = new THREE.MeshPhongMaterial({color:"red", shininess:"200"});
let obj = new THREE.Mesh(geometry, material)
let obj2 = new THREE.Mesh(geometry, material);
  obj.castShadow = true;
  obj.position.set(3, 0.2, 4);
  obj2.castShadow = true;
  obj2.position.set(-3, 0.2, 4);
scene.add(obj);
scene.add(obj2);

// Variables that will be used for linear interpolation
const lerpConfig = {
  destination: new THREE.Vector3(3, 0.2, -4.5),
  alpha: 0.01,
  move: false
}
const lerpConfig2 = {
  destination: new THREE.Vector3(-3, 0.2, -4.5),
  alpha: 0.025,
  move: false
}

buildInterface();
render();

function buildInterface()
{     

  var controls = new function ()
  {
    this.onChangeAnimation = function(){
      lerpConfig.move = !lerpConfig.move
      lerpConfig2.move = !lerpConfig2.move
    };
    this.onReset = function() {
      obj.position.set(3, 0.2, 4);
      obj2.position.set(-3, 0.2, 4);
    }

  };

  let gui = new GUI();
  gui.add(controls, 'onChangeAnimation', true).name("Race ON/OFF");
  gui.add(controls, 'onReset', true).name("Reset");
}

function render()
{
  trackballControls.update();

  if(lerpConfig.move) {
    obj.position.lerp(lerpConfig.destination, lerpConfig.alpha);
    obj2.position.lerp(lerpConfig2.destination, lerpConfig2.alpha);
    
  }

  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}