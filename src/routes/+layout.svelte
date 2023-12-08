<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import User from "$lib/client/components/User.svelte"
    import Users from "$lib/client/components/Users.svelte"
    import Rooms from "$lib/client/components/Rooms.svelte"
    import Positions from "$lib/client/components/Positions.svelte"
    import GlobalChat from "$lib/client/components/GlobalChat.svelte"
    import Tubers from "$lib/client/components/Tubers.svelte"
    import BarItem from "$lib/client/components/BarItem.svelte";
    
    let counter = ClientState.getScrollY()
    let { data } = $props<{ data: Utils.WorldEvent }>();
    
    let atTop = $derived(counter.count < 35);
    if(data.yourName){
        console.log(`init layout with existing user ${data.yourName}`);
    }
    const appState = ClientState.getAppState()
    
    ClientState.receiveWorldEvent(data)
    
</script>

<svelte:window bind:scrollY={counter.count} />


<div class="topBar brutal-border" class:solid={atTop} class:blurry={!atTop}>
    <h3><a href="/">Tubestock</a></h3>
    <a href="/about">about</a>
    <BarItem compData={{kind:'usr'}} title='Me'></BarItem>
    <BarItem compData={{kind:'usrs',}} title='Users'></BarItem>
    <BarItem compData={{kind:'rooms'}} title='Rooms'></BarItem>
    <BarItem compData={{kind:'positions'}} title='Positions'></BarItem>
    <BarItem compData={{kind:'tubers',}} title='Tubers'></BarItem>
    <BarItem compData={{kind:'globalChat'}} title='Global Chat'></BarItem>
    <BarItem compData={{kind:'admin'}} title='Admin'></BarItem>
</div>

<slot />

<style>
    

    /* .topBarBut{
        display: inline-block;
        position: relative;
    } */
    .selectedBut {
        background-color: pink;
    }
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
        padding: 10px;
    }
    

    :global(.opener){
        background-color: yellowgreen;
        padding:5px;
    }
    
    :global(.brutal-border) {
        border: 2px solid black;
        box-shadow: 2px 2px 0px 0px black;
        border-radius: 8px;
    }

    :global(.inset-brutal) {
        box-shadow: inset 2px 2px 3px 1px black;
        margin:2px;
        border: none;
        border-radius: 9px;
    }

    :global(.itemButton){
        border-radius: 6px;
        padding-inline: 5px;
        padding-block: 3px;
        cursor: pointer;
        font-weight: bold;
        background-color: beige;
        font-size:1.3rem;
        color:black;
    }

    :global(.listOfBarItems) {
        display: flex;
        flex-wrap: wrap;
        gap:5px;
        align-items: center;
    }
    
    :global(.msgs) {
        display: flex;
        flex-direction: column-reverse;
        align-items: flex-start;
        gap:5px;
        max-height: 30vh;
        padding:5px;
        overflow-y: auto;
    }

    :global(.listItem) {
        border-radius: 5px;
        padding: 5px;
    }
    

    :global(.bigBold) {
        font-weight: bold;
        font-size: 1.3rem;
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
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        /* column-gap: 10px; */
        gap: 10px;
        flex-wrap: wrap;
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
