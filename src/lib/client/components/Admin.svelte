<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import * as Svelte from "svelte";
    import * as Easing from "svelte/easing";
    import * as SvelteTransition from "svelte/transition";
    import * as SvelteAnimate from "svelte/animate";
    
    const appState = ClientState.getAppState();
    
    async function gogo() {
        ClientState.hitEndpoint("rando", {}, Utils.emptyObject);
    }
    </script>

<button on:click={ClientState.updateTubers}>update tubers</button>
{#if !appState.value.subscribing && (!appState.value.source || appState.value.source.readyState == 2)}
    <button on:click={ClientState.subscribe}>open source</button>
{/if}
<button on:click={ClientState.manualSourceError}>close source</button>
<button
    on:click={async () => {
        console.log("dev");
        gogo();
    }}>dev</button
>
