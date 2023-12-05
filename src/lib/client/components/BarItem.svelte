<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";

    let { compData: forCompId, title } = $props<{ compData: ClientState.CompKey, title:string }>();

    const appState = ClientState.getAppState();

    function selectedClicked() {
        if (cExist(forCompId.id)) {
            appState.value.compies = appState.value.compies.filter(c=>c.id != forCompId.id)
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
    function cExist(key: ClientState.CompKeyId): boolean {
        if (appState.value.compies.findLast((c) => c.id == key)) {
            return true;
        }
        return false;
    }
    let active = $derived(cExist(forCompId.id));
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
