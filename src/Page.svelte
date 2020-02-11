<script>

import * as THREE from 'three'
import { onMount } from 'svelte'

// these need to be accessed inside more than one function so we'll declare them first
let container;
let camera;
let controls;
let renderer;
let scene;
let listener
let audioLoader
let sound
let analyser 
let freq
$: freqRound = Math.round(freq)
let circles = []

export let crossLeft

const clock = new THREE.Clock();

onMount(()=>{
	function init() {
		container = document.querySelector( '#scene-container' );
		scene = new THREE.Scene();
		createCamera();
		createRenderer();
		createAudio()
		renderer.setAnimationLoop( () => {
			update();
		} )

	}

	function createAudio(){
		// create an AudioListener and add it to the camera
		listener = new THREE.AudioListener();
		camera.add( listener );

		// create a global audio source
		sound = new THREE.Audio( listener );

		// load a sound and set it as the Audio object's buffer
		audioLoader = new THREE.AudioLoader();
		audioLoader.load( './assets/Asynkront.m4a', function( buffer ) {
			sound.setBuffer( buffer );
			sound.setLoop( true );
			sound.setVolume( 0.5 );
			sound.play();
		});

		// create an AudioAnalyser, passing in the sound and desired fftSize
		analyser = new THREE.AudioAnalyser( sound, 32 );
	}
	
	function createCamera() {
	camera = new THREE.PerspectiveCamera( 35, container.clientWidth / container.clientHeight, 1, 100 );
	camera.position.set( -1.5, 1.5, 6.5 );
	}

	function createRenderer() {
	// create a WebGLRenderer and set its width and height
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( 0,0 );
	container.appendChild( renderer.domElement );
	}

	function update() {
		const delta = clock.getDelta()
		freq = analyser.getAverageFrequency()
		let randH = window.innerHeight * Math.random()
		let randW = window.innerWidth * Math.random()
		if(freqRound > 85) circles = [...circles, {d:freqRound,y:randH, x:randW}]
		if(circles.length > 50) circles = circles.slice(50)
	}
	init();
})
</script>

<div id='scene-container'>

<h2>{freqRound}</h2>

{#each circles as c (c)}
	<div class='page' in:crossLeft="{{ duration:5000 }}">
		<div 
			style='min-height:{c.d}px;min-width:{c.d}px;position:absolute;top:{c.y}px'
			class='circle'>
		</div>
	</div>
{/each}
</div>
<style>
	#scene-container{
		width:100vw;
		height:100vh;
		position:fixed;
		display:grid;
		place-items: center;
	}
	.circle{
		background:rgba(0,0,0,.4);
		color:white;
		border-radius:50%;
		left:100vw;
	}
	.page{
		position:absolute;
		height:100vh;
		width:100vw;
	}
</style>