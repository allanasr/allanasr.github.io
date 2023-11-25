import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
    initRenderer,
    initCamera,
    initDefaultBasicLight,
    setDefaultMaterial,
    InfoBox,
    onWindowResize,
    createGroundPlaneXZ
} from "../libs/util/util.js";
import { CSG } from "../libs/other/CSGMesh.js";

let objectsToIntersect = [];
let scene, renderer, camera, material, light, orbit, csgObject, auxMat, hitterMesh; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(15, 15, 30)); // Init camera in this position
material = setDefaultMaterial('rgb(250, 97, 169)'); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls(camera, renderer.domElement); // Enable mouse rotation, pan, zoom etc.
auxMat = new THREE.Matrix4();

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);


// create the ground plane
let plane = createGroundPlaneXZ(3, 3)
scene.add(plane);


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
    hitterMesh.material = new THREE.MeshPhongMaterial({
        color: "rgb(255,20,20)",
        shininess: 20,
    });

    hitterMesh.castShadow = true;
    hitterMesh.position.set(0, -2, 0);
    objectsToIntersect.push(hitterMesh);

    scene.add(hitterMesh);
}

function updateObject(mesh) {
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
}

render();
function render() {
    requestAnimationFrame(render);
    createHitterMesh()
    renderer.render(scene, camera) // Render scene
}