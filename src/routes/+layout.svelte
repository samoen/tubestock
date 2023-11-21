<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";

    console.log("init layout");
    let { data } = $props<{ data: Utils.DataFirstLoad }>();
    let windowScrollY = $state(0);
    let atTop = $derived(windowScrollY < 35);

    ClientState.getAppState().update((s) => {
        s.chatMsgsDisplay = data.msgs.reverse();
        s.userList = data.users;
        s.positionsList = data.positions;
        s.tuberList = data.tubers;
        s.myNameDisplay = data.yourName;
        s.idleStockDisplay = data.yourIdleStock;
    });
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
