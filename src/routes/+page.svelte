<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import * as Svelte from "svelte";
    import * as Easing from "svelte/easing";
    import * as SvelteTransition from "svelte/transition";
    import * as SvelteAnimate from "svelte/animate";

    console.log("init base page");

    // $effect(()=>{ // await not allowed
    Svelte.onMount(async () => {
        await ClientState.subscribe();
        console.log("mounted");
    });

    const appState = ClientState.getAppState();

    
    type RenderableComponent = {
        compKey: ClientState.ComponentWantShow;
        cProps: object;
        template: ClientState.Template;
    };
    let renderableComponents = $derived<RenderableComponent[]>(
        (() => {
            console.log('rederiving renderable comps')
            const result: RenderableComponent[] = [];
            for (const c of appState.value.compies) {
                let props: object | undefined = undefined;
                if (c.maybeMakeProps) {
                    let p = c.maybeMakeProps();
                    if (p) {
                        props = p;
                    }else{
                        console.log('failed to make props')
                    }
                } else {
                    props = {};
                }
                if (props) {
                    const fromAllLedge = ClientState.allCompLedge[c.kind];
                    result.push({
                        compKey: c,
                        cProps: props,
                        template: fromAllLedge,
                    });
                }
            }
            return result;
        })(),
    );
</script>




{#if appState.value.subscribing}
    <span> loading... </span>
{/if}

<div class="compListHolder">
    {#each renderableComponents as c (c.compKey.kind + c.compKey.thingId?.toString())}
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

        <div
            class="compHolder brutal-border"
            in:SvelteTransition.scale={{
                duration: 200,
                easing: Easing.sineOut,
            }}
            out:SvelteTransition.scale={{
                duration: 250,
                easing: Easing.sineIn,
            }}
        >
            <svelte:component this={c.template.t} {...c.cProps}
            ></svelte:component>
            <!-- <CompSelector key={c}></CompSelector> -->
        </div>

        <!-- <br /> -->
    {/each}
</div>

<!-- {/if} -->
<style>
    .compHolder {
        /* border: 2px solid brown; */
        /* height:auto; */
        background-color: burlywood;
        padding: 10px;
    }
    .compListHolder {
        display: flex;
        gap: 10px;
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
