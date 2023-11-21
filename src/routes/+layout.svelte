<script lang="ts">
    import { onMount, setContext } from "svelte";
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";

    console.log('init layout')
    let {data}: {data : Utils.DataFirstLoad} = $props();
    // let data = rest.data
    let windowScrollY = $state(0);
    let atTop = $derived(windowScrollY < 35);

    let cap = ClientState.getCState()
    // let cap = ClientState.clientAppStateRune.value
    cap.back.chatMsgsDisplay = data.msgs.reverse()
    cap.back.userList = data.users
    cap.back.positionsList = data.positions
    cap.back.tuberList = data.tubers
    cap.back.myNameDisplay = data.yourName
    cap.back.idleStockDisplay = data.yourIdleStock
    cap.dirty()
    // cap.back = cap.back
    // ClientState.clientAppStateRune.value = cap
    // let clientAppStateRune = $state(as)

    // remove warning about rune never updated
    // let f = ()=>{
    //     clientAppStateRune.loading = false
    // }
    // remove warning about state referenced in its own scope never updating
    // let g = ()=>{
        // setContext(ClientState.CLIENT_STATE_CTX, cap);
    // }
    // g()

    // onMount(() => {});
</script>

<svelte:window bind:scrollY={windowScrollY} />

<div class="topBar" class:solid={atTop} class:blurry={!atTop}>
    <h3><a href="/">Tubestock</a></h3>
    <a href="/about">about</a>

</div>

<slot />

<style>
    a{
        text-decoration: none;
        display: inline-block;
    }
    h3{
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
