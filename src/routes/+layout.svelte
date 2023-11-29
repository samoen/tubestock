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
    :global(*) {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        user-select: none;
        touch-action: manipulation;
        font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS",
        sans-serif;
    }
    :global(body) {
        background-color: beige;
        /* padding-inline: 5px; */
        padding: 10px;
        /* margin: 0; */
        /* word-wrap: break-word; */
    }
    a {
        text-decoration: none;
        display: inline-block;
        color:black;
        margin-inline: 10px;
    }
    h3 {
        display: inline-block;
    }
    .topBar {
        position: sticky;
        top: 0px;
        border: 2px solid black;
        z-index: 1;
        padding:5px;
    }
    .solid {
        background-color: burlywood;
    }
    .blurry {
        background-color: transparent;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
    }
</style>
