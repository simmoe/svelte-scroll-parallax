<script>
	//receive current scroll position and image file src from parent
	export let scrollPos, scrollStart, src

    //subtract the current scrollposition from the dynamic variable to get a local scroll starting from zero 
    $: localScrollPos = scrollPos - scrollStart

    //Check scroll direction
	let lastScrollPos = 0

	function scrollDir(scrollPos){
		let ret = scrollPos - lastScrollPos < 0 ? 'up' : 'down'
		lastScrollPos = scrollPos
		return ret
	}

    $: scrollDirection = scrollDir(scrollPos)

	//what we actually want is to count up to the images full height on the y-axis, and then go down again     	
	$: imgYCounter = 
	localScrollPos < imgHeight 
	? localScrollPos 
	: (scrollDirection == 'down' ? imgYCounter - 1 : imgYCounter + 1)

	let perspective = '1000px'
	$: imageZCounter = - localScrollPos * 0.8

    //check if we need to show the component - but take some z-axis into consideration here
    $: destroy = localScrollPos > imgHeight * 3

    //debug those values if you like
    // $: console.log({imageZCounter, imgHeight, imgYCounter, localScrollPos, scrollDirection, scrollStart})


    //the height of the source image
	let imgHeight, viewport

	function whoosh(e) {
		imgHeight = e.target.offsetHeight
	}
	$: console.log(viewport)

</script>

<!-- The parts of the 3D elements that are behind the user — i.e. their z-axis coordinates are greater than the value of the perspective CSS property — are not drawn. -->
<svelte:window bind:innerHeight={viewport}/>

{#if (scrollPos >= scrollStart) && !destroy}
<img 
	on:load={(whoosh)}
	class="absbottom" 
	src={src} 
	style='
		transform: 
		perspective({perspective}) 
		translate3d(0, -{imgYCounter}px, {imageZCounter}px'
	alt='heres a bird for you'/>
{/if}

<style>
	.fixed{
		width:100vw;
		height:100vh;
		overflow:scroll;
		position:fixed;
		top:0;
		left:0;
		display:grid;
		place-items:center;
		z-index:1;
	}

	.absbottom{
		will-change: transform;
		position: fixed;
		top:100vh;
		object-fit:cover;
		object-position: center top;
		width:100%;
	}

</style>
