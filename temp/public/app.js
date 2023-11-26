import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader';

let scene, camera, renderer;

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
};

function init(geometry) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    
    // Background color (over white implicit background)
    renderer.setClearColor( 0xCFCDBE );

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // OrbitControls setup
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true; // Optional, but makes the control smoother
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    // Materials
    const faceFrontMaterial = new THREE.MeshBasicMaterial({
        color: 0x43AA8B,
        transparent: true,
        opacity: 0.5
    });

    const faceBackMaterial = new THREE.MeshBasicMaterial({
        color: 0x4378AB,
        transparent: true,
        opacity: 0.5,
        side: THREE.BackSide
    });


    const wireframeMaterial = new THREE.LineBasicMaterial({
        color: 0xFF6F59,
    });

    const vertexMaterial = new THREE.MeshBasicMaterial({
        color: 0x254441
        // depthTest: false

    });

    // Geometry
    // const geometry = new THREE.BufferGeometry();

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

    // geometry.setIndex( indices );
    // geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

    const cube = new THREE.Mesh(geometry, faceFrontMaterial);
    cube.add(new THREE.Mesh(geometry, faceBackMaterial));


    // Wireframe
    const wireframe = new THREE.WireframeGeometry(geometry);
    const wireframeMesh = new THREE.LineSegments(wireframe, wireframeMaterial);

    // Vertices
    const vertexGeometry = new THREE.SphereGeometry(0.2,4,4); // Small sphere

    // Add face data to scene
    scene.add(cube);


    const indexAttribute = geometry.index;
    const positionAttribute = geometry.attributes.position;

    // Add edge data to scene
    const edges = new Set(); // Use a Set to avoid duplicate edges


    for (let i = 0; i < indexAttribute.count; i += 3) {
        const a = indexAttribute.getX(i);
        const b = indexAttribute.getX(i + 1);
        const c = indexAttribute.getX(i + 2);

        // Add edges: a-b, b-c, c-a
        edges.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
        edges.add(`${Math.min(b, c)}-${Math.max(b, c)}`);
        edges.add(`${Math.min(c, a)}-${Math.max(c, a)}`);
    }

    const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFE0BD }); // Example color

    edges.forEach(edge => {
        const [startIdx, endIdx] = edge.split('-').map(Number);
        
        const startVertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, startIdx);
        const endVertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, endIdx);
        
        const path = new THREE.LineCurve3(startVertex, endVertex);
        const tubeGeometry = new THREE.TubeGeometry(path, 1, 0.015, 3, false);
        const tubeMesh = new THREE.Mesh(tubeGeometry, wireframeMaterial);
        cube.add(tubeMesh);
    });

    // Add vertex data to scene
    for (let i = 0; i < positionAttribute.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(positionAttribute, i);
        
        const vertexMesh = new THREE.Mesh(vertexGeometry, vertexMaterial);
        vertexMesh.position.copy(vertex);
        cube.add(vertexMesh);
    }


    camera.position.z = 100;

    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function convertToIndexedBufferGeometry(geometry) {
    // If geometry is already indexed, return it
    if (geometry.index) return geometry;

    // Create a new BufferGeometry
    const indexedGeometry = new THREE.BufferGeometry();

    // Get position attribute
    const positions = geometry.attributes.position.array;

    // Create an array to hold unique vertices and an array for indices
    const uniqueVertices = [];
    const indices = [];

    for (let i = 0; i < positions.length; i += 9) {
        for (let j = 0; j < 9; j += 3) {
            const vertex = new THREE.Vector3(positions[i + j], positions[i + j + 1], positions[i + j + 2]);

            // Check if this vertex is unique
            let index = uniqueVertices.findIndex(uniqueVertex =>
                uniqueVertex.equals(vertex)
            );

            // If it's a new unique vertex, push it to uniqueVertices
            if (index === -1) {
                uniqueVertices.push(vertex);
                index = uniqueVertices.length - 1;
            }

            // Push the index of the vertex
            indices.push(index);
        }
    }

    // Set the attributes and index of the indexedGeometry
    indexedGeometry.setIndex(indices);
    indexedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(uniqueVertices.flatMap(v => v.toArray()), 3));

    return indexedGeometry;
}


const ws = new WebSocket('ws://localhost:8080');
ws.binaryType = 'arraybuffer'; // Important for receiving binary data

ws.onopen = function() {
    console.log('WebSocket Client Connected');
    ws.send('Hi this is web client.');
};

ws.onmessage = function (event) {
    const loader = new STLLoader();
    const buffer = event.data;
    const raw_geometry = loader.parse(buffer);
    const geometry = convertToIndexedBufferGeometry(raw_geometry);
    init(geometry);
};

