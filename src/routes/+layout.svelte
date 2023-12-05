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
    
    let counter = ClientState.createCounter()
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
    <BarItem forCompId={{id:'usr', kind:'static'}} title='Me'></BarItem>
    <BarItem forCompId={{id:'usrs', kind:'static'}} title='Users'></BarItem>
    <BarItem forCompId={{id:'rooms', kind:'static'}} title='Rooms'></BarItem>
    <BarItem forCompId={{id:'positions', kind:'static'}} title='Positions'></BarItem>
    <BarItem forCompId={{id:'tubers', kind:'static'}} title='Tubers'></BarItem>
    <BarItem forCompId={{id:'globalChat', kind:'static'}} title='Global Chat'></BarItem>
    <!-- <div class='topBarBut'> -->
        <!-- style:width='maxContent'  -->
        <!-- <button 
            class='itemButton' 
            on:click={()=>{selectedClicked('usr')}} 
            class:inset-brutal={usrSel} 
            class:brutal-border={!usrSel}>
            <div class='holdVis'>
                <p 
                class:shrinkFont={usrSel}
                    class='vis' 
                    >User</p>
                <p class='vis invis'>User</p>

            </div>
        </button> -->
    <!-- </div> -->
    <!-- <button class='itemButton' on:click={()=>{selectedClicked('usrs')}} class:shower={usrsSel}>users</button>
    <button class='itemButton' on:click={()=>{selectedClicked('rooms')}} class:selectedBut={roomsSel}>rooms</button>
    <button class='itemButton' on:click={()=>{selectedClicked('positions')}} class:selectedBut={posSel}>positions</button>
    <button class='itemButton' on:click={()=>{selectedClicked('tubers')}} class:selectedBut={tubersSel}>tubers</button>
    <button class='itemButton' on:click={()=>{selectedClicked('globalChat')}} class:selectedBut={globChatSel}>global chat</button> -->
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
        /* padding-inline: 5px; */
        padding: 10px;
        /* margin: 0; */
        /* word-wrap: break-word; */
    }
    :global(.itemButton) {
        border-radius: 6px;
        padding-inline: 5px;
        padding-block: 3px;
        cursor: pointer;
        font-weight: bold;
        /* position:relative; */
        /* width: fit-content; */
        background-color: beige;
        font-size:1.3rem;
    }
    
    :global(.brutal-border) {
        border: 2px solid black;
        box-shadow: 2px 2px 0px 0px black;
        border-radius: 8px;
        /* font-size: 1.05em; */
        /* transform: scale(0.8); */
    }

    :global(.listOfBarItems) {
        display: flex;
        flex-wrap: wrap;
        gap:5px
    }
    
    :global(.inset-brutal) {
        box-shadow: inset 2px 2px 3px 1px black;
        border: 2px solid burlywood;
        /* background-color: burlywood; */
        border-radius: 9px;
    }
    :global( .msgs ) {
        display: flex;
        flex-direction: column-reverse;
        /* align-items: flex-start; */
        /* height: 100px; */
        gap:5px;
        

        max-height: 50vh;
        border-radius: 5px;
        padding:5px;
        overflow-y: auto;
        background-color: beige;
        margin:10px;
        /* margin-block: 5px; */
    }
    :global( .listItem ) {
        border-radius: 5px;
        background-color: burlywood;
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
