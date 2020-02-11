<script>
	import {fly} from 'svelte/transition'
	export let start
	export let end
	export let pos
	export let text
	export let dir
	export let trans = {
		 x:  [dir ==='left' ? -2000 : 2000], 
		 duration: 2000 
	}
</script>

{#if pos > start && pos < end}
	 <div class='modal'  transition:fly="{ trans }">
		 <h1>{text}</h1>
		 <h3>{pos}</h3>
	 </div>
{/if}

<style>
	.modal{
		width:400px;
		height:400px;
		position:absolute;
		display:grid;
		place-items:center;
		background:orange;
		border-radius: 2rem;
	}
</style>
