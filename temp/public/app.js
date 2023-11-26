import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer;

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
};

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    
    // Background color (over white implicit background)
    renderer.setClearColor( 0xfdae44, 0.2);

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // OrbitControls setup
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true; // Optional, but makes the control smoother
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    // GLTF Setup
    const loader = new GLTFLoader();

    // Materials
    const pastelMaterial = new THREE.MeshBasicMaterial({
        color: 0xAAD3E6, // Pastel blue
        transparent: true,
        opacity: 0.5
    });

    const wireframeMaterial = new THREE.LineBasicMaterial({
        color: 0xFFE0BD, // Pastel orange
    });

    // Geometry
    // const geometry = new THREE.BoxGeometry();
    const geometry = new THREE.BufferGeometry();

    const vertices = new Float32Array( [
	-1.0, -1.0,  1.0, // v0
	 1.0, -1.0,  1.0, // v1
	 1.0,  1.0,  1.0, // v2
        
	-1.0,  1.0,  1.0, // v3
	-1.0,  1.0,  1.0, // v4
	-1.0, -1.0,  1.0  // v5
    ] );

    const indices = [
	0, 1, 2,
	2, 3, 0,
    ];

    geometry.setIndex( indices );
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

    const cube = new THREE.Mesh(geometry, pastelMaterial);



    // Wireframe
    const wireframe = new THREE.WireframeGeometry(geometry);
    const wireframeMesh = new THREE.LineSegments(wireframe, wireframeMaterial);

    // Vertices
    const vertexMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFF5BA // Pastel yellow (for example)
    });
    const vertexGeometry = new THREE.SphereGeometry(0.02); // Small sphere
    
    // geometry.vertices.forEach(vertex => {
        // const vertexMesh = new THREE.Mesh(vertexGeometry, vertexMaterial);
        // vertexMesh.position.copy(vertex);
        // cube.add(vertexMesh);
    // });



    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    cube.add(wireframeMesh);
    scene.add(cube);

    camera.position.z = 5;

    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();

const ws = new WebSocket('ws://localhost:3000');

ws.onopen = function() {
    console.log('WebSocket Client Connected');
    ws.send('Hi this is web client.');
};

ws.onmessage = function(e) {
    console.log("Received: '" + e.data + "'");
};
