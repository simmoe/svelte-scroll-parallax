<script>
	import {map_range } from './shared.js'
	//receive current scroll position, start, end and image file src from parent
	export let src
	export let enter
	export let leave 
	export let start, stop, cont, end, scrollPos = 0

	let imgWidth, imgHeight

	//set enter and leave sequence counters
	$: localEnter = scrollPos >= stop ? stop - start : scrollPos - start
	$: localLeave = scrollPos >= end  ? end - cont : scrollPos - cont

	// $: console.log(localEnter, localLeave)

	//map this range to the stop
	$: imageXEnter = ['left', 'right'].includes(enter) ? map_range(localEnter, 0, stop - start, 0, imgWidth) : 0
	$: imageYEnter = ['top', 'bottom'].includes(enter) ? map_range(localEnter, 0, stop - start, 0, imgHeight) : 0
	$: imageXLeave = ['left', 'right'].includes(leave) ? map_range(localLeave, cont, end - cont, 0, imgWidth) : 0
	$: imageYLeave = ['top', 'bottom'].includes(leave) ? map_range(localLeave, cont, end - cont, 0, imgHeight) : 0


	$: enterx = enter == 'left' ? - imageXEnter : imageXEnter 
	$: entery = enter == 'top' ? - imageYEnter : imageYEnter
	$: leavex = enter == 'left' ? - imageXLeave : imageXLeave 
	$: leavey = enter == 'top' ? - imageYLeave : imageYLeave

	$: console.log(localLeave, imageXLeave)

let img 

	$: scrollPos > start && scrollPos <= stop ? img.style.transform = `translate(${enterx}px, ${entery}px)` : ''
	$: scrollPos > cont && scrollPos <= end ? img.style.transform = `translate(${leavex}px, ${leavey}px)` : ''

</script>

<svelte:window bind:innerHeight={imgHeight} bind:innerWidth={imgWidth} />

<img 
	bind:this={img}
	class="abs {enter}" 
	src={src} 
	alt='hey birdie'
	/>

<style>
	.abs{
		will-change: transform;
		position: fixed;
		width:100%;
		height:100%;
        top:0;
		object-fit:cover;
		object-position: center top;
	}
	.right{
		right:100vw;
	}
	.left{
		left:100vw;
	}
	.top{
		top:100vh;
	}
	.bottom{
		bottom:100vh;
	}
</style>