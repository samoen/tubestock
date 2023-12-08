<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import { boolean } from "drizzle-orm/mysql-core";

    let { compData: forCompId, title, transpar } = $props<{
        compData: ClientState.ComponentWantShow;
        title: string;
        transpar?:boolean;
    }>();

    const appState = ClientState.getAppState();

    function selectedClicked() {
        if (cExist(forCompId)) {
            appState.value.compies = appState.value.compies.filter(
                (c) => !ClientState.compiesAreSame(forCompId, c),
            );
            appState.dirty();
            return;
        }
        appState.value.compies.unshift(forCompId);
        ClientState.getScrollY().setToZero();
        appState.dirty();
    }
    function cExist(key: ClientState.ComponentWantShow): boolean {
        for (const compy of appState.value.compies) {
            if (ClientState.compiesAreSame(key, compy)) {
                return true;
            }
        }
        return false;
    }
    let active = $derived(cExist(forCompId));
</script>

<button
    class="itemButton"
    on:click={selectedClicked}
    class:inset-brutal={active && !transpar}
    class:inset-brutal-transparent={active && transpar}
    class:brutal-border={!active}
>
    <div class="holdVis">
        <p class:shrinkFont={active} class="vis">{title}</p>
        <p class="vis invis">{title}</p>
    </div>
</button>

<style>
    .itemButton {
        border-radius: 6px;
        padding-inline: 5px;
        padding-block: 3px;
        cursor: pointer;
        font-weight: bold;
        /* position:relative; */
        /* width: fit-content; */
        background-color: beige;
        font-size:1.3rem;
        color:black;
    }
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
