import './style.css'
// @ts-ignore
import anime from 'animejs/lib/anime.es.js';
import { AnimationClip, AnimationMixer, DirectionalLight, Group, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { degToRad } from 'three/src/math/MathUtils';

//! TESTs
//? FBX Loader
/* fbxLoader.load(
	'/assets/models/chair.fbx',
	(object) => {
		sceneInfo.scene.add(object)
		console.log(object)
		sceneInfo.mesh = object
	}, (xhr) => console.log((xhr.loaded / xhr.total) * 100 + ' % loaded'),
	e => console.error(e)
) */

//? .OBJ + .MTL Loader
/* materialLoader.load(
	'/assets/models/sofa.mtl',
	(materials) => {
		materials.preload()
		objLoader.setMaterials(materials)
		objLoader.load('/assets/models/sofa.obj', (object) => {
			sceneInfo.scene.add(object)
			sceneInfo.mesh = object
		}, (xhr) => console.log((xhr.loaded / xhr.total) * 100 + ' % loaded'),
			(error) => console.error(error),
		)
	},
	_ => { },
	e => console.error(e)
) */

anime({
	targets: '.arrow',
	translateY: -20,
	duration: 1000,
	loop: true,
	direction: 'alternate',
	easeing: 'easeInOutElastic(1, .8)'
})

anime({
	targets: '.arrow path',
	strokeDashoffset: [anime.setDashoffset, 0],
	easing: 'easeInOutSine',
	duration: 1000,
	delay: 400
})

const objLoader = new OBJLoader()
const materialLoader = new MTLLoader()
const fbxLoader = new FBXLoader()
const gltfLoader = new GLTFLoader()
const sofaScene = setupSofaScene()
const chairScene = setupChairScene()
const mirrorScene = setupMirrorScene()
let mixer: null | AnimationMixer = null

type SceneType = {
	scene: Scene,
	camera: PerspectiveCamera,
	elem: HTMLElement,
	mesh: Group
}

function makeScene(elem: HTMLElement) {
	const scene = new Scene();
	const fov = 45;
	const aspect = 2;
	const near = 0.1;
	const far = 5;
	const camera = new PerspectiveCamera(fov, aspect, near, far);
	camera.position.z = 2;
	camera.position.set(0, 1, 2);
	camera.lookAt(0, 0, 0);
	{
		const color = 0xFFFFFF;
		const intensity = 3;
		const light = new DirectionalLight(color, intensity);
		light.position.set(-1, 2, 4);
		scene.add(light);
	}
	return { scene, camera, elem } as SceneType;
}

function setupSofaScene() {
	const sceneInfo = makeScene(document.querySelector('#sofa-container')!)

	//? GLTF Loader
	gltfLoader.load(
		'/assets/models/sofa.glb',
		object => {
			sceneInfo.scene.add(object.scene)
			sceneInfo.mesh = object.scene
		}, (xhr) => console.log((xhr.loaded / xhr.total) * 100 + ' % loaded'),
		e => console.error(`Error loading sofa model: ${ e.message }`)
	)

	return sceneInfo
}

function setupChairScene() {
	const sceneInfo = makeScene(document.querySelector('#chair-container')!)
	gltfLoader.load(
		'/assets/models/chair.glb',
		object => {
			const chair = object.scene
			chair.scale.set(.6, .6, .6)
			chair.position.y = -.5
			chair.rotateY(degToRad(-12))
			chair.rotateX(degToRad(-4))
			sceneInfo.scene.add(chair)
			sceneInfo.mesh = chair
		}, _ => { },
		e => console.error(`Error loading chair model: ${ e.message }`)
	)
	return sceneInfo
}

function setupMirrorScene() {
	const sceneInfo = makeScene(document.querySelector('#mirror-container')!)
	const animationKey = 'Cube.002Action.001'
	gltfLoader.load(
		'/assets/models/mirror.glb',
		object => {
			const mirror = object.scene
			mixer = new AnimationMixer(object.scene)
			const animations = object.animations
			console.log(animations)
			const clip = AnimationClip.findByName(animations, animationKey)
			const action = mixer.clipAction(clip)
			action.play()
			mirror.scale.set(.6, .6, .6)
			mirror.position.y = -.4
			sceneInfo.scene.add(mirror)
			sceneInfo.mesh = mirror
		}, _ => { },
		e => console.error(`Error loading mirror model: ${ e.message }`)
	)
	return sceneInfo
}

function renderSceneInfo(sceneInfo: SceneType) {
	const { camera, scene, elem } = sceneInfo
	const { top, right, bottom, left, width, height } = elem.getBoundingClientRect()
	const isOffscreen = bottom < 0 || top > renderer.domElement.clientHeight || right < 0 || left > renderer.domElement.clientWidth
	if (isOffscreen) return
	camera.aspect = width / height
	camera.updateProjectionMatrix()

	const positiveYUpBottom = renderer.domElement.clientHeight - bottom;
	renderer.setScissor(left, positiveYUpBottom, width, height);
	renderer.setViewport(left, positiveYUpBottom, width, height);

	renderer.render(scene, camera);
}

const canvas = document.querySelector('#three-canvas')!
const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
renderer.setSize(window.innerWidth, window.innerHeight)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
	renderer.setSize(window.innerWidth, window.innerHeight)
	requestAnimationFrame(render)
}

function lerp(x: number, y: number, a: number): number {
	return (1 - a) * x + a * y
}
function scalePercent(start: number, end: number): number {
	return (scrollPercent - start) / (end - start)
}

let scrollPercent = 0
document.body.onscroll = () => {
	scrollPercent =
		((document.documentElement.scrollTop || document.body.scrollTop) /
			((document.documentElement.scrollHeight ||
				document.body.scrollHeight) -
				document.documentElement.clientHeight)) *
		100;
	sofaScene.scene.rotation.y = lerp(0, -Math.PI, scalePercent(0, 30))
	chairScene.scene.position.z = lerp(-2, 2, scalePercent(30, 60))
	mixer && mixer.setTime(lerp(6.66, 0, scalePercent(60, 74)))
	console.log(`Scroll Progress: ${ scrollPercent.toFixed(2) }`)
}
const stats = Stats()
document.body.appendChild(stats.dom)

type sceneElementType = {
	elem: HTMLElement,
}

const sceneElements: sceneElementType[] = [];
function addScene(elem: HTMLElement) {
	sceneElements.push({ elem });
}

function render(_time: number) {
	// time *= 0.001
	renderer.setScissorTest(false)
	renderer.clear(true, false)
	renderer.setScissorTest(true)
	renderSceneInfo(sofaScene)
	renderSceneInfo(chairScene)
	renderSceneInfo(mirrorScene)

	const transform = `translateY(${ window.scrollY }px)`;
	renderer.domElement.style.transform = transform;

	for (const { elem } of sceneElements) {
		const rect = elem.getBoundingClientRect();
		const { left, right, top, bottom, width, height } = rect;

		const isOffscreen =
			bottom < 0 ||
			top > renderer.domElement.clientHeight ||
			right < 0 ||
			left > renderer.domElement.clientWidth;

		if (!isOffscreen) {
			const positiveYUpBottom = renderer.domElement.clientHeight - bottom;
			renderer.setScissor(left, positiveYUpBottom, width, height);
			renderer.setViewport(left, positiveYUpBottom, width, height);
		}
	}

	stats.update()
	requestAnimationFrame(render)
}

requestAnimationFrame(render)