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

    
    function selectedClicked(comp:ClientState.CompKey){
        
        if(appState.value.compies.includes(comp)){
            ClientState.hideComp(comp)
            
            return
        }
        appState.value.compies.unshift(comp)
        windowScrollY = 0
        appState.dirty()
    }
    let usrSel = $derived((()=>{
        if(appState.value.compies.includes('usr')){
            return true
        }
        return false
    })())
    let usrsSel = $derived((()=>{
        if(appState.value.compies.includes('usrs')){
            return true
        }
        return false
    })())
    let roomsSel = $derived((()=>{
        if(appState.value.compies.includes('rooms')){
            return true
        }
        return false
    })())
    let posSel = $derived((()=>{
        if(appState.value.compies.includes('positions')){
            return true
        }
        return false
    })())
    let tubersSel = $derived((()=>{
        if(appState.value.compies.includes('tubers')){
            return true
        }
        return false
    })())
    let globChatSel = $derived((()=>{
        if(appState.value.compies.includes("globalChat")){
            return true
        }
        return false
    })())
</script>

<svelte:window bind:scrollY={windowScrollY} />

<div class="topBar" class:solid={atTop} class:blurry={!atTop}>
    <h3><a href="/">Tubestock</a></h3>
    <a href="/about">about</a>
    <button on:click={()=>{selectedClicked('usr')}} class:selectedBut={usrSel}>user</button>
    <button on:click={()=>{selectedClicked('usrs')}} class:selectedBut={usrsSel}>users</button>
    <button on:click={()=>{selectedClicked('rooms')}} class:selectedBut={roomsSel}>rooms</button>
    <button on:click={()=>{selectedClicked('positions')}} class:selectedBut={posSel}>positions</button>
    <button on:click={()=>{selectedClicked('tubers')}} class:selectedBut={tubersSel}>tubers</button>
    <button on:click={()=>{selectedClicked('globalChat')}} class:selectedBut={globChatSel}>global chat</button>
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
