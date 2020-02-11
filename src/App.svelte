<script>
	import { onMount } from 'svelte'
	import TurningImageBottom from './components/TurningImageBottom.svelte' 

	//time
	let seconds = 0

	import { readable } from 'svelte/store';

	const time = readable(new Date(), set => {
		const interval = setInterval(() => {
			set(new Date().getSeconds())
		}, 1000);

		return () => clearInterval(interval)
	})

	const unsubscribe = time.subscribe(t => {
		// console.log(seconds ++)
		seconds ++
	})

	//aka p5 map
	function map_range(value, low1, high1, low2, high2) {
		return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
	}

	//scrolling
	let y = 0

	//Rounded y scroll value
	$: scrollPos = Math.round(y) 
	
	//Dir check variable
	let lastY = 0

	function scrollDir(y){
		let ret = y - lastY < 0 ? 'up' : 'down'
		lastY = y
		return ret
	}
	$: scrollDirection = scrollDir(y)

	let viewportHeight
	let scrollSpeed = 8


	//mouse
	$: m = { x: 0, y: 0 };

	function handleMousemove(event) {
		m.x = event.clientX;
		m.y = event.clientY;
		console.log(m)
	}

	//Keyboard
	function handleKeydown(event) {
		console.log(event.key)
	}

</script>

<svelte:window bind:scrollY={y} on:keydown={handleKeydown} bind:innerHeight={viewportHeight} on:mousemove={handleMousemove}/>

<div class="menu">
	<div><h3>{scrollPos}</h3></div>
</div>

<!-- The parts of the 3D elements that are behind the user — i.e. their z-axis coordinates are greater than the value of the perspective CSS property — are not drawn. -->

<div class='pageheight' style="height:{6000}px">
	<TurningImageBottom 
		scrollStart=0 
		scrollPos={scrollPos}
		src='./img/tree.png'/>
	<TurningImageBottom 
		scrollStart=400
		scrollPos={scrollPos}
		src='./img/japflowers.webp'/>
	<TurningImageBottom 
		scrollStart=1000
		scrollPos={scrollPos}
		src='./img/flowers.png'/>
	<TurningImageBottom 
		scrollStart=1900
		scrollPos={scrollPos}
		src='./img/beach.png'/>
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
	:global(body, html) {
		font-family:'Josefin Sans';
		margin: 0;
		padding: 0;
	}
</style>
