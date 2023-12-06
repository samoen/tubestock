<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";

    let { compData: forCompId, title } = $props<{ compData: ClientState.ComponentWantShow, title:string }>();

    const appState = ClientState.getAppState();

    

    function selectedClicked() {
        if (cExist(forCompId)) {
            appState.value.compies = appState.value.compies.filter(c=>!((c.kind == forCompId.kind) && (c.thingId == forCompId.thingId)))
            appState.dirty()
            return;
        }
        // appState.value.compies.unshift({ id: forCompId, kind: "static" });
        appState.value.compies.unshift(forCompId);
        // ClientState.windowScrollY = 0
        // ClientState.scrollUp()
        ClientState.getScrollY().setToZero();
        appState.dirty();
    }
    function cExist(key: ClientState.ComponentWantShow): boolean {
        for(const compy of appState.value.compies){
            // if(key.kind == 'static' && compy.kind == 'static'){
            //     if(compy.id == key.id){
            //         return true
            //     }
            // }
            // if(key.kind in ClientState.StaticCompKey)

            if(key.kind == compy.kind){
                if(compy.thingId == key.thingId){
                    return true
                }
            }


        }
        // const found = appState.value.compies.findLast((c) => {
        //     if(c.kind == 'static' && c.id == key.id)
        //     c.kind == 'stat' key.kind && key.thin c.id == key
        // })
        // if (found) {
        //     return true;
        // }
        return false;
    }
    let active = $derived(cExist(forCompId));
</script>

<button
    class="itemButton"
    on:click={selectedClicked}
    class:inset-brutal={active}
    class:brutal-border={!active}
>
    <div class="holdVis">
        <p class:shrinkFont={active} class="vis">{title}</p>
        <p class="vis invis">{title}</p>
    </div>
</button>

<style>
    .holdVis {
        display: grid;
        grid-template-columns: 1fr;
        place-items: center;
        /* grid-template-rows: auto; */
        /* position: relative; */
    }
    .invis {
        /* position: absolute; */
        color: transparent;
        /* color:blue; */
    }
    .vis {
        grid-row-start: 1;
        grid-column-start: 1;
        /* grid-area: 1 / 1 / 1 / 1; */
        /* position: absolute;
        top:0;
        left:0; */
    }
    .shrinkFont {
        font-size: 0.8em;
        /* color: beige; */
        /* line-height: 1em; */
        /* margin-top:1px */
    }
</style>
