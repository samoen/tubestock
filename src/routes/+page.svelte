<script lang="ts">
    import * as Svelte from "svelte";
    import * as Utils from "$lib/utils";
    import * as ClientState from "$lib/client/clientState.svelte";
    import SimpleForm from "$lib/client/components/SimpleForm.svelte";
    import User from "$lib/client/components/User.svelte";
    import Users from "$lib/client/components/Users.svelte";
    import Rooms from "$lib/client/components/Rooms.svelte";
    import GlobalChat from "$lib/client/components/GlobalChat.svelte";
    import Tubers from "$lib/client/components/Tubers.svelte";
    import Positions from "$lib/client/components/Positions.svelte";

    console.log("init base page");

    // $effect(()=>{ // await not allowed
    Svelte.onMount(async () => {
        await ClientState.subscribe();
        console.log("mounted");
    });

    const appState = ClientState.getAppState();
    


    

    


    async function gogo() {
        ClientState.hitEndpoint("rando", {}, Utils.emptyObject);
    }

    
    
    

    
</script>

<br />
<button
    on:click={async () => {
        console.log("dev");
        gogo();
    }}>dev</button
>
{#if !appState.value.subscribing && (!appState.value.source || appState.value.source.readyState == 2)}
    <button on:click={ClientState.subscribe}>open source</button>
{/if}
{#if appState.value.subscribing}
    <span> loading... </span>
{/if}
<button on:click={ClientState.updateTubers}>update tubers</button>
<button on:click={ClientState.manualSourceError}>close source</button>

{#each appState.value.compies as c }
    <svelte:component this={c}></svelte:component>
{/each}
<br />
<br />



<!-- <User></User>
<br />
<br />
<Users></Users>
<Rooms></Rooms>
<br />
<br />
<GlobalChat></GlobalChat>
<Tubers></Tubers>
<Positions></Positions> -->



<!-- {/if} -->
<style>
    .selectableText {
        user-select: text;
    }
    :global( .msgs ) {
        display: flex;
        flex-direction: column-reverse;
        align-items: flex-start;
        height: 100px;
        overflow-y: auto;
        background-color: burlywood;
        margin-block: 5px;
    }
    
    :global(.itemButton) {
        border-radius: 6px;
        padding-inline: 4px;
        padding-block: 2px;
        cursor: pointer;
        font-weight: bold;
        background-color: yellow;
    }
    .red {
        background-color: red;
        color: white;
        border-color: white;
    }
    .getEarlier {
        max-width: max-content;
        border-radius: 5px;
        padding-inline: 5px;
        padding-block: 2px;
    }
</style>
