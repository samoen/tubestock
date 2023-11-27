<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";

    let { data } = $props<{ data: Utils.WorldEvent }>();
    let windowScrollY = $state(0);
    let atTop = $derived(windowScrollY < 35);
    if(data.yourName){
        console.log(`init layout with existing user ${data.yourName}`);
    }
    ClientState.getAppState()
    ClientState.receiveWorldEvent(data)

</script>

<svelte:window bind:scrollY={windowScrollY} />

<div class="topBar" class:solid={atTop} class:blurry={!atTop}>
    <h3><a href="/">Tubestock</a></h3>
    <a href="/about">about</a>
</div>

<slot />

<style>
    a {
        text-decoration: none;
        display: inline-block;
    }
    h3 {
        display: inline-block;
    }
    .topBar {
        position: sticky;
        top: 0px;
        border: 2px solid black;
        z-index: 1;
    }
    .solid {
        background-color: pink;
    }
    .blurry {
        background-color: transparent;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
    }
</style>
