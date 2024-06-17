import {OrbitControls} from './OrbitControls.js'
import * as THREE from 'three';

// Scene Declartion
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
// This defines the initial distance of the camera, you may ignore this as the camera is expected to be dynamic
camera.applyMatrix4(new THREE.Matrix4().makeTranslation(-5, 3, 110));
camera.lookAt(0, -4, 1)


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


// helper function for later on
function degrees_to_radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}


// Here we load the cubemap and pitch images, you may change it

const loader = new THREE.CubeTextureLoader();
const texture = loader.load([
  'src/pitch/right.jpg',
  'src/pitch/left.jpg',
  'src/pitch/top.jpg',
  'src/pitch/bottom.jpg',
  'src/pitch/front.jpg',
  'src/pitch/back.jpg',
]);
scene.background = texture;

const goalWidth = 30;
const goalHeight = 10;
const backSupportAngle = 45; // Degrees
const goalDepth = goalHeight / Math.tan(degrees_to_radians(backSupportAngle));
const postRadius = 0.5;


// TODO: Texture Loading
// We usually do the texture loading before we start everything else, as it might take processing time
const textureLoader = new THREE.TextureLoader();
const ball_texture = textureLoader.load('src/textures/soccer_ball.jpg');
const yellow_texture = textureLoader.load('src/textures/yellow_card.jpg');
const red_texture = textureLoader.load('src/textures/red_card.jpg');
const net_texture = textureLoader.load('src/textures/goal_net.png');


// TODO: Add Lighting
// Unique lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);  // soft white light
scene.add(ambientLight);

// Directional Light 1 - from one end of the field
const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight1.position.set(0, 0, 0);  // Adjust position based on the scene setup
directionalLight1.castShadow = true;
scene.add(directionalLight1);

// Directional Light 2 - from the opposite end
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight2.position.set(0, 0, 100);  // Adjust position based on the scene setup
directionalLight2.castShadow = true;
scene.add(directionalLight2);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// TODO: Goal
// You should copy-paste the goal from the previous exercise here
const whiteMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const blackMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius, goalHeight , 32);
const supportGeometry = new THREE.CylinderGeometry(postRadius, postRadius, goalHeight + 4)

const cylinderTranslate1 = new THREE.Matrix4();
const cylinderTranslate2 = new THREE.Matrix4();
const cylinderTranslate3 = new THREE.Matrix4();
const cylinderTranslate4 = new THREE.Matrix4();

cylinderTranslate1.makeTranslation(-goalWidth / 2, goalHeight / 2, 0);
cylinderTranslate2.makeTranslation(goalWidth / 2, goalHeight / 2, 0);
cylinderTranslate3.multiplyMatrices(
  new THREE.Matrix4().makeTranslation(-goalWidth / 2, goalHeight / 2, -goalDepth / 2),
  new THREE.Matrix4().makeRotationX(degrees_to_radians(backSupportAngle))
);
cylinderTranslate4.multiplyMatrices(
  new THREE.Matrix4().makeTranslation(goalWidth / 2, goalHeight / 2, -goalDepth / 2),
  new THREE.Matrix4().makeRotationX(degrees_to_radians(backSupportAngle))
);

const goalPost1 = new THREE.Mesh(postGeometry, whiteMaterial);
goalPost1.applyMatrix4(cylinderTranslate1);
scene.add(goalPost1);

const goalPost2 = new THREE.Mesh(postGeometry, whiteMaterial);
goalPost2.applyMatrix4(cylinderTranslate2);
scene.add(goalPost2);

const support1 = new THREE.Mesh(supportGeometry, whiteMaterial);
support1.applyMatrix4(cylinderTranslate3);
scene.add(support1);

const support2 = new THREE.Mesh(supportGeometry, whiteMaterial);
support2.applyMatrix4(cylinderTranslate4);
scene.add(support2);

// Crossbar
const crossbarGeometry = new THREE.CylinderGeometry(postRadius, postRadius, goalWidth + 0.67, 32);
const topCylinderTranslate = new THREE.Matrix4();
topCylinderTranslate.multiplyMatrices(
  new THREE.Matrix4().makeTranslation(0, goalHeight, 0),
  new THREE.Matrix4().makeRotationZ(degrees_to_radians(90))
);
const crossbar = new THREE.Mesh(crossbarGeometry, whiteMaterial);
crossbar.applyMatrix4(topCylinderTranslate);
scene.add(crossbar);

// Rings/Toruses
const ringGeometry = new THREE.TorusGeometry(postRadius, postRadius / 2, 16, 100);
const ringMaterial = whiteMaterial;
const ringPositions = [
  { x: -goalWidth / 2, y: 0, z: 0 },
  { x: goalWidth / 2, y: 0, z: 0 },
  { x: -goalWidth / 2, y: 0, z: -goalDepth },
  { x: goalWidth / 2, y: 0, z: -goalDepth }
];

ringPositions.forEach(pos => {
  const ringMatrix = new THREE.Matrix4();
  ringMatrix.multiplyMatrices(
    new THREE.Matrix4().makeTranslation(pos.x, pos.y, pos.z),
    new THREE.Matrix4().makeRotationX(Math.PI / 2)
  );
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.applyMatrix4(ringMatrix);
  scene.add(ring);
});

// Nets
const netMaterial = new THREE.MeshPhongMaterial({
  map: net_texture,
  color: whiteMaterial,
  side: THREE.DoubleSide,
  opacity: 0.8,
  transparent: true
});
// Back net (rectangular)
const backNetGeometry = new THREE.PlaneGeometry(goalWidth, goalHeight + 3.5);
const backNetMatrix = new THREE.Matrix4();
backNetMatrix.multiplyMatrices(
  new THREE.Matrix4().makeTranslation(0, goalHeight - 5 , -goalDepth + 5),
  new THREE.Matrix4().makeRotationX(degrees_to_radians(backSupportAngle))
);

const backNet = new THREE.Mesh(backNetGeometry, netMaterial);
backNet.applyMatrix4(backNetMatrix);
scene.add(backNet);

// Side nets (triangular)
const createTriangleMesh = (vertices, material) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex([0,1,2]);
  const uvs = new Float32Array([
    0, 0,
    0, 1,
    1, 0  
  ]);
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.setIndex
  return new THREE.Mesh(geometry, material);
};

const sideNetVertices1 = [
  -goalWidth / 2, 0, 0,
  -goalWidth / 2, goalHeight, 0,
  -goalWidth / 2, 0, -goalDepth
];
const sideNet1 = createTriangleMesh(sideNetVertices1, netMaterial);
scene.add(sideNet1);

const sideNetVertices2 = [
  goalWidth / 2, 0, 0,
  goalWidth / 2, goalHeight, 0,
  goalWidth / 2, 0, -goalDepth
];
const sideNet2 = createTriangleMesh(sideNetVertices2, netMaterial);
scene.add(sideNet2);



// TODO: Ball
// You should add the ball with the soccer.jpg texture here
const ballGeometry = new THREE.SphereGeometry(goalHeight / 16, 32, 32);
const ballMatrix = new THREE.Matrix4().makeTranslation(0,0,100);
const ballMaterial = new THREE.MeshPhongMaterial({ map: ball_texture });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.applyMatrix4(ballMatrix);
scene.add(ball);


// TODO: Bezier Curves
const curve = new THREE.QuadraticBezierCurve3(
	new THREE.Vector3( 0 ,0 ,100 ),
	new THREE.Vector3( 50, 0, 50 ),
	new THREE.Vector3( 0, goalHeight / 2, 0 )
);
const points = curve.getPoints( 50 );
const geometry = new THREE.BufferGeometry().setFromPoints( points );

const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );

// Create the final object to add to the scene
const curveObject = new THREE.Line( geometry, material );
scene.add(curveObject)

// TODO: Camera Settings
// Set the camera following the ball here
// This defines the initial distance of the camera
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0,0,5);
camera.applyMatrix4(cameraTranslate)

renderer.render( scene, camera );

const controls = new OrbitControls( camera, renderer.domElement );



// TODO: Add collectible cards with textures





// TODO: Add keyboard event
// We wrote some of the function for you
const handle_keydown = (e) => {
	if(e.code == 'ArrowLeft'){
		// TODO
	} else if (e.code == 'ArrowRight'){
		// TODO
	} else if (e.code == 'ArrowUp'){
    // TODO
  }
}
document.addEventListener('keydown', handle_keydown);



function animate() {

	requestAnimationFrame( animate );

	// TODO: Animation for the ball's position


	// TODO: Test for card-ball collision

	
	renderer.render( scene, camera );

}
animate()