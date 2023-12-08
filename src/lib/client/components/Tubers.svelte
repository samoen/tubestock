<script lang="ts">
    import Tubers from "$lib/client/components/Tubers.svelte";
    import Tuber from "$lib/client/components/Tuber.svelte";
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import SimpleForm from "./SimpleForm.svelte";

    const appState = ClientState.getAppState();
</script>

<!-- <span class='bigBold'>Tubers</span> -->
<!-- <button class="itemButton" on:click={()=>{ClientState.hideComp('tubers')}}>Hide</button> -->
<BarItem compData={{ kind: "tubers" }} title="Tubers"
></BarItem>
<div class="listOfBarItems">
    {#each appState.value.tuberList as t (t.channelId)}
        <div class="listItem">
            <BarItem
                compData={{
                    kind: "tuber",
                    thingId: t.id,
                    maybeMakeProps() {
                        let found = appState.value.tuberList.findLast(
                            (u) => u.id == t.id,
                        );
                        if (found) return { thing: found };
                        return undefined;
                    },
                    
                }}
                title={t.channelName}
            ></BarItem>
            <!-- <span>{t.count}</span> -->
        </div>
    {/each}
</div>
<SimpleForm
    buttonLabel="Search"
    onSubmit={ClientState.requestTuber}
    inputs={[{ itype: "text" }]}
/>

<!-- {#if appState.value.selectedTuber}
    <h3>{appState.value.selectedTuber.channelName}</h3>
    <SimpleForm
        buttonLabel="Place stock"
        onSubmit={placeStockClicked}
        inputs={[
            { itype: "number" },
            { itype: "checkbox", placeHold: "short" },
        ]}
    />
{/if} -->
