<script>
	import { onMount } from 'svelte'
	import TurningImageBottom from './components/TurningImageBottom.svelte' 
	import Cross from './components/Cross.svelte' 

	//scrolling
	let y = 0

	//Rounded y scroll value
	$: scrollPos = Math.round(y) 

	let scrollSpeed = 12
	let viewportHeight

	$: m = { x: 0, y: 0 };

	export function handleMouseMove(event) {
		m.x = event.clientX;
		m.y = event.clientY;
		return m
	}

</script>

<svelte:window bind:scrollY={y} bind:innerHeight={viewportHeight} on:mousemove={handleMouseMove}/>

<div class="menu">
	<div><h3>{scrollPos}</h3></div>
</div>

<div class='pageheight' style="height:{scrollPos + viewportHeight + scrollSpeed}px">
	<Cross enter='right' leave='bottom' start={0}  stop={300} cont={400} end={700} scrollPos={scrollPos} bgColor='purple'>
		<div slot='before'>		
			<h1>The old man and the sea</h1>
			<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium exercitationem earum sint aliquid magni, praesentium eos asperiores omnis enim iure nesciunt qui veniam consequuntur nisi laudantium maxime laboriosam ipsum. Deserunt.</p>
		</div>
	</Cross>

	<Cross enter='top' leave='right' start={400}  stop={700} cont={800} end={1200} scrollPos={scrollPos}>
		<div slot='custom'>
			<h1 class='verybig'>The sanctions</h1>
		</div>
	</Cross>

	<Cross src='./img/athmos4.JPG' enter='left' leave='bottom' start={800}  stop={1200} cont={1400} end={1900} scrollPos={scrollPos} />

	<Cross src='./img/bath100.JPG' enter='top' leave='right' start={1400}  stop={1900} cont={2000} end={2300} scrollPos={scrollPos} />
</div>


<style>
	@import url('https://fonts.googleapis.com/css?family=Josefin+Sans:300&display=swap');
	.menu{
		position:fixed;
		width:100vw;
		height:5vh;
		background:black;
		color:white;
		display:grid;
		place-items:center;
		z-index:1;
	}
	.menu h3{
		margin:0;
	}
	h1.verybig{
		font-size: 20vh;
	}
	:global(body, html) {
		font-family:'Josefin Sans';
		margin: 0;
		padding: 0;
		scroll-behavior: smooth;
	}
	:global(*) {
		box-sizing:border-box;
	}
</style>
