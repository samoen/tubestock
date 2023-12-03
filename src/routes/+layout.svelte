<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import User from "$lib/client/components/User.svelte"
    import Users from "$lib/client/components/Users.svelte"
    import Rooms from "$lib/client/components/Rooms.svelte"
    import Positions from "$lib/client/components/Positions.svelte"
    import GlobalChat from "$lib/client/components/GlobalChat.svelte"
    import Tubers from "$lib/client/components/Tubers.svelte"

    let { data } = $props<{ data: Utils.WorldEvent }>();
    let windowScrollY = $state(0);
    let atTop = $derived(windowScrollY < 35);
    if(data.yourName){
        console.log(`init layout with existing user ${data.yourName}`);
    }
    const appState = ClientState.getAppState()
    
    ClientState.receiveWorldEvent(data)
    
    function selectedClicked(comp:any){
        if(appState.value.compies.includes(comp)){
            appState.value.compies = appState.value.compies.filter(c=>c != comp)
            appState.dirty()
            return
        }
        appState.value.compies.unshift(comp)
        appState.dirty()
    }
    let usrSel = $derived((()=>{
        if(appState.value.compies.includes(User)){
            return true
        }
        return false
    })())
    let usrsSel = $derived((()=>{
        if(appState.value.compies.includes(Users)){
            return true
        }
        return false
    })())
    let roomsSel = $derived((()=>{
        if(appState.value.compies.includes(Rooms)){
            return true
        }
        return false
    })())
    let posSel = $derived((()=>{
        if(appState.value.compies.includes(Positions)){
            return true
        }
        return false
    })())
    let tubersSel = $derived((()=>{
        if(appState.value.compies.includes(Tubers)){
            return true
        }
        return false
    })())
    let globChatSel = $derived((()=>{
        if(appState.value.compies.includes(GlobalChat)){
            return true
        }
        return false
    })())
</script>

<svelte:window bind:scrollY={windowScrollY} />

<div class="topBar" class:solid={atTop} class:blurry={!atTop}>
    <h3><a href="/">Tubestock</a></h3>
    <a href="/about">about</a>
    <button on:click={()=>{selectedClicked(User)}} class:selectedBut={usrSel}>user</button>
    <button on:click={()=>{selectedClicked(Users)}} class:selectedBut={usrsSel}>users</button>
    <button on:click={()=>{selectedClicked(Rooms)}} class:selectedBut={roomsSel}>rooms</button>
    <button on:click={()=>{selectedClicked(Positions)}} class:selectedBut={posSel}>positions</button>
    <button on:click={()=>{selectedClicked(Tubers)}} class:selectedBut={tubersSel}>tubers</button>
    <button on:click={()=>{selectedClicked(GlobalChat)}} class:selectedBut={globChatSel}>global chat</button>
</div>

<slot />

<style>
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
