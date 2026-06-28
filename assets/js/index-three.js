import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';



// Mise en place des éléments et modules pour la scène
const scene = new THREE.Scene();


const textureLoader = new THREE.TextureLoader();
scene.background = textureLoader.load('assets/images/IndexBackground.png'); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.getElementById('three-container').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404060, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffeedd,1.6);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffa500, 2, 10);
pointLight.position.set(0, 2, 1.5   );
scene.add(pointLight);

const listener = new THREE.AudioListener();
camera.add(listener);

const bgMusic = new Audio('assets/sounds/backgroundmusic.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.0;


// bgMusic.play();

const selectSound = new Audio('assets/sounds/bookselect.wav');
selectSound.volume = 0.0;

const closeSound = new Audio('assets/sounds/bookclose.mp3');
closeSound.volume = 0.0;

const openSound = new Audio('assets/sounds/bookopen.mp3');
openSound.volume = 0.0;


const loader = new GLTFLoader();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const books = [];
const mixers = [];
const clock = new THREE.Clock();
const LERP_SPEED = 0.1;
let selectedBook = null;
let isAnimating = false;
let musicStarted = false;
let isSceneActive = true;
let animationId = null;

const shelfGroup = new THREE.Group();
shelfGroup.position.y = -0.9;
scene.add(shelfGroup);

// Gestion de pause et resume de scene pour le changement entre 2D et 3D
export const pauseScene = () => {
    isSceneActive = false;
    cancelAnimationFrame(animationId);
};

export const resumeScene = () => {
    if (isSceneActive) return;
    isSceneActive = true;
    animate();
};

// Chargement du shelf
loader.load('assets/models/Shelf.glb', (gltf) => {
    const shelf = gltf.scene;
    shelfGroup.add(shelf);

    const box = new THREE.Box3().setFromObject(shelf);
    const center = box.getCenter(new THREE.Vector3());
    shelf.position.sub(center);
    
    loadBooks();
    loadPanneau(box);
}, undefined, (error) => {
    console.error('Erreur de chargement de l\'étagère :', error);
});

// Chargement du panneau au dessus de l'armoire
function loadPanneau(shelfBox) {
    loader.load('assets/models/Panneau.glb', (gltf) => {
        const panneau = gltf.scene;
        shelfGroup.add(panneau);

        const shelfSize = shelfBox.getSize(new THREE.Vector3());
        const shelfTopY = shelfSize.y / 2;

        const localBox = new THREE.Box3().setFromObject(panneau);

        panneau.position.x = 0;
        panneau.position.y = shelfTopY - localBox.min.y + panneau.position.y-.15;
        panneau.position.z = .45;

        panneau.rotation.y = -Math.PI/2
    });
}

// Mise en place du template des livres
function setupBook(gltf, position, iconPath, pageUrl) {
    const book = gltf.scene.clone();
    book.position.copy(position);
    book.rotation.y = Math.PI;
    shelfGroup.add(book);
    
    book.userData.base = book.position.clone();
    book.userData.targetPos = book.position.clone();
    book.userData.targetRot = new THREE.Euler(0, Math.PI, 0);
    book.userData.iconPath = iconPath;
    book.userData.pageUrl = pageUrl;
    
    // Animation
    if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(book);
        book.userData.actions = [];
        
        gltf.animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            book.userData.actions.push(action);
        });
        
        book.userData.mixer = mixer;
        mixers.push(mixer);
    }
    
    books.push(book);
}

// Mise en place des livres dans le shelf
function loadBooks() {
    loader.load('assets/models/Book1_PoissonLanterne.glb', (gltf) => {
        setupBook(gltf, new THREE.Vector3(0.3, 2.219, 0), 'assets/images/PoissonLanterne/PoissonLanterneIcon.png', 'poisson_lanterne.html');
    });

    loader.load('assets/models/Book1_Metroid.glb', (gltf) => {
        setupBook(gltf, new THREE.Vector3(0.8, 2.219, 0), 'assets/images/MetroidVR/MetroidVRIcon.png', 'metroidvr.html');
    });


    loader.load('assets/models/Book1_Ludoie.glb', (gltf) => {
        setupBook(gltf, new THREE.Vector3(-.3, 2.219, 0), 'assets/images/Ludoie/LudoieIcon.png', 'ludoie.html');
    });

    loader.load('assets/models/Book1_IQExpander.glb', (gltf) => {
        setupBook(gltf, new THREE.Vector3(-0.8, 2.219, 0), 'assets/images/IqExpander/RestoredIcon.png', 'iqexpander.html');
    });
}

// Position caméra
camera.position.set(0, 1.2, 2);
camera.lookAt(0, 1.2, 0);

// Gestion de la souris pour les intéraction dans la scène 3D
window.addEventListener('mousemove', (e) => {
    if (!isSceneActive) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Affichage de la page du livre
function updateViewToggleVisibility() {
    const toggleBtn = document.getElementById('view-toggle');
    if (toggleBtn) {
        toggleBtn.style.display = selectedBook ? 'none' : 'block';
    }
}

// Gestion des interactions
window.addEventListener('click', (e) => {
    if (!isSceneActive) return;
    if (document.getElementById('project-overlay').style.display === 'flex' || isAnimating) return;

    if (bgMusic.paused) {
        // bgMusic.play();
    }

    raycaster.setFromCamera(mouse, camera);
    const meshes = [];
    books.forEach(b => b.traverse(c => { if (c.isMesh) meshes.push(c); }));
    const hit = raycaster.intersectObjects(meshes)[0];

    let clickedBook = null;
    if (hit) {
        books.forEach(b => {
            let obj = hit.object;
            while (obj) { if (obj === b) clickedBook = b; obj = obj.parent; }
        });
    }

    if (clickedBook) {
        if (selectedBook === clickedBook) {
            closeBook();
        } else {
            if (selectedBook) {
                closeBook();
            }

            isAnimating = true;
            selectedBook = clickedBook;
            
            updateViewToggleVisibility();
            
            // Play selection sound
            selectSound.currentTime = 0;
            // selectSound.play();

            selectedBook.userData.targetRot = new THREE.Euler(0, Math.PI / 2, 0);
            selectedBook.userData.targetPos = new THREE.Vector3(0, 2.1, 1.2);
            
            const bookToOpen = selectedBook;
            setTimeout(() => {
                if (selectedBook !== bookToOpen) {
                    isAnimating = false;
                    return;
                }
                
                openSound.currentTime = 0;
                // openSound.play();
                
                bookToOpen.userData.targetRot = new THREE.Euler(0, 0, 0);
                bookToOpen.userData.targetPos = new THREE.Vector3(0, 2.1, 1.0);
                
                if (bookToOpen.userData.actions) {
                    bookToOpen.userData.actions.forEach(action => {
                        action.reset();
                        action.paused = false;
                        action.timeScale = 1;
                                                action.play();
                    });
                }

                // Temps pour ouvrir le livre
                setTimeout(() => {
                    if (selectedBook === bookToOpen) {
                        const overlay = document.getElementById('project-overlay');
                        const iframe = document.getElementById('project-iframe');
                        iframe.src = bookToOpen.userData.pageUrl;
                        overlay.style.display = 'flex';
                    }
                    isAnimating = false;
                }, 1000);
            }, 800);
        }
    }
});

window.closeBook = closeBook;

// Fermeture du livre (interface)
function closeBook() {
    if (!selectedBook) return;

    // Masquer l'overlay
    const overlay = document.getElementById('project-overlay');
    const iframe = document.getElementById('project-iframe');
    overlay.style.display = 'none';
    iframe.src = '';

    selectedBook.userData.targetPos = selectedBook.userData.base.clone();
    
    closeSound.currentTime = 0;
    // closeSound.play();
    
    // On ferme le livre d'abord
    if (selectedBook.userData.actions) {
        selectedBook.userData.actions.forEach(action => {
            action.paused = false;
            action.timeScale = -1;
                                    action.play();
        });
    }

    // On attend un peu avant de remettre la rotation/position initiale
    const currentBook = selectedBook;
    setTimeout(() => {
        currentBook.userData.targetRot = new THREE.Euler(0, Math.PI, 0);
    }, 300);
    
    selectedBook = null;
    updateViewToggleVisibility();
}

// Bouton de fermeture de l'overlay
document.getElementById('close-overlay').addEventListener('click', (e) => {
    e.stopPropagation();
    closeBook();
});


// Boucle de rendu et animation
function animate() {
    if (!isSceneActive) return;
    animationId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    // Update animations
    mixers.forEach(m => m.update(delta));


    // Hover
    raycaster.setFromCamera(mouse, camera);
    const meshes = [];
    books.forEach(b => b.traverse(c => { if (c.isMesh) meshes.push(c); }));
    const hit = raycaster.intersectObjects(meshes)[0];

    let hoveredBook = null;
    if (!selectedBook && !isAnimating) {
        raycaster.setFromCamera(mouse, camera);
        const meshes = [];
        books.forEach(b => b.traverse(c => { if (c.isMesh) meshes.push(c); }));
        const hit = raycaster.intersectObjects(meshes)[0];

        if (hit) {
            books.forEach(b => {
                let obj = hit.object;
                while (obj) { if (obj === b) hoveredBook = b; obj = obj.parent; }
            });
        }
    }

    const overlay = document.getElementById('hover-overlay');
    const img = document.getElementById('hover-image');
    
    // Affichage des images des livres quand on passe dessus
    if (hoveredBook && !selectedBook) {
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(hoveredBook.matrixWorld);
        vector.project(camera);

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

        img.src = hoveredBook.userData.iconPath;
        overlay.style.left = `${x}px`;
        overlay.style.top = `${y - 50}px`;
        overlay.style.display = 'block';
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
    } else {
        if (overlay.style.opacity !== '0') {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.style.opacity === '0') overlay.style.display = 'none';
            }, 300);
        }
    }

    // Mise a jour des états des livres
    books.forEach(b => {
        if (b === selectedBook) {
            if (b.userData.targetPos) b.position.lerp(b.userData.targetPos, LERP_SPEED);
            if (b.userData.targetRot) {
                b.rotation.x += (b.userData.targetRot.x - b.rotation.x) * LERP_SPEED;
                b.rotation.y += (b.userData.targetRot.y - b.rotation.y) * LERP_SPEED;
                b.rotation.z += (b.userData.targetRot.z - b.rotation.z) * LERP_SPEED;
            }
        } else {
            const target = b.userData.base.clone();
            if (b === hoveredBook) target.z += 0.3;
            b.position.lerp(target, LERP_SPEED);
            
            b.rotation.x += (0 - b.rotation.x) * LERP_SPEED;
            b.rotation.y += (Math.PI - b.rotation.y) * LERP_SPEED;
            b.rotation.z += (0 - b.rotation.z) * LERP_SPEED;
        }
    });

    renderer.render(scene, camera);
}

// Adaptation de la fenetre au resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();