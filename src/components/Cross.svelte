<script>
	import {map_range, scrollDir } from './shared.js'

	export let enter, leave, bgColor
	export let src = ''
	export let start, stop, cont, end, scrollPos = 0

	let height, width

	//helper function to return in out positions 
	function getSeq(p1, p2, p3){
		if(p1 < p2) return 0
		if(p1 >= p3) return p3 - p2
		return p1 - p2
	}

	$: seqIn  = getSeq(scrollPos, start, stop)
	$: seqOut = getSeq(scrollPos, cont, end)


	let x = 0
	let y = 0

	function reset(){
		x = 0; y = 0;
	}
	let el

	$:  {
		if(scrollPos > start && scrollPos <= stop){		
			if(enter=='left')  	x =  map_range(seqIn, 0, stop - start, -100, 0) 
			if(enter=='right') 	x = -map_range(seqIn, 0, stop - start,  100, 0) 
			if(enter=='top')	y =  map_range(seqIn, 0, stop - start, -100, 0)
			if(enter=='bottom')	y = -map_range(seqIn, 0, stop - start,  100, 0)
		}
		if(scrollPos > cont && scrollPos <= end){	
			if(leave=='left')  	x =  -map_range(seqOut, 0, end - cont,  0, 100) 
			if(leave=='right') 	x =   map_range(seqOut, 0, end - cont,  0, 100) 
			if(leave=='top')	y =  -map_range(seqOut, 0, end - cont,  0, 100)
			if(leave=='bottom')	y =   map_range(seqOut, 0, end - cont,  0, 100)
		}
		if(scrollPos > start){
			el.style.visibility = 'visible'
			el.style.transform = `translate(${x}%, ${y}%)`
		}
	}
	//x y resetters
	$: (stop-start) - seqIn < 5 && reset()
	$: scrollPos > cont && scrollPos < cont + 5 && reset()

</script>

<div 	
		bind:clientHeight={height} 
		bind:clientWidth={width} 
		class='abs' 
		style='
		position:fixed;
		background-color:{bgColor};
		background-image:url("{src}");
		background-size:cover;
		background-position:center center' 
		bind:this={el}>
	<div>
		<div class='default'>
			<slot name='before' />
		</div>			
		<slot name='custom' />
	</div>
</div>

<style>
	.abs{
		visibility:hidden;
		will-change: transform;
		position: fixed;
		top:0;
		left:0;
		width:100vw;
		height:100vh;
		display:grid;
		place-items:center;
		background-color:#2ab7ca;
		overflow:hidden;
		color:white;
	}
	.abs .default {
		max-height:40vw;
		max-width:40vw;
		overflow:scroll;
	}
</style>