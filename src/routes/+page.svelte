<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import * as Svelte from "svelte";
    import * as Easing from "svelte/easing";
    import * as SvelteTransition from "svelte/transition";
    import * as SvelteAnimate from "svelte/animate";
    import CompSelector from "$lib/client/components/CompSelector.svelte";


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
<br/>
<br/>
<div class='compListHolder'>
    {#each appState.value.compies as c (c.id)}
    <!-- in:receive={{ key: todo.id }}
        out:send={{ key: todo.id }} -->
        <!-- transition:slide={{duration:400}} -->
        <!-- transition:slide -->
        <!-- on:animationstart={()=>{appState.dirty()}} -->
        <!-- on:transitionend={()=>{appState.dirty()}} -->
        <!-- out:fade={{duration:200,delay:0}}  -->
        <!-- animate:flip={{duration:400,delay:0}} -->
        <!-- on:animationend={()=>{appState.dirty()}} -->
        <!-- out:SvelteTransition.fade -->
        <!-- in:receive={{key:c}}
            out:send={{key:c}} -->
            <!-- animate:SvelteAnimate.flip={{duration:400}}
            in:SvelteTransition.scale={{duration:200,easing:Easing.sineOut}}
            out:SvelteTransition.scale={{duration:250,easing:Easing.sineIn}} -->
            <!-- transition:SvelteTransition.fade -->
            
            <!-- in:SvelteTransition.scale={{duration:200,easing:Easing.sineOut}} -->
            <!-- out:SvelteTransition.scale={{duration:250,easing:Easing.sineIn}} -->
            <div
            class='compHolder'
            >
                
                <!-- <svelte:component this={ClientState.compLedg[c.id]}></svelte:component> -->
                <CompSelector key={c}></CompSelector>
    
        </div>
        
        <!-- <br /> -->
    {/each}

</div>



<!-- {/if} -->
<style>
    .compHolder {
        /* border: 2px solid brown; */
        /* height:auto; */
        /* background-color: purple; */
        /* padding:10px; */

    }
    .compListHolder {
        display: flex;
        gap:10px;
        flex-wrap: wrap;
        flex-direction: column;
        /* align-items: flex-start; */
        
        /* grid-template-columns: 1fr; */

        /* flex-direction: column; */
    }
    .selectableText {
        user-select: text;
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
