<script lang="ts">
    import Tubers from "$lib/client/components/Tubers.svelte";
    import Tuber from "$lib/client/components/Tuber.svelte";
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import SimpleForm from "./SimpleForm.svelte";

    const appState = ClientState.getAppState();
    async function placeStockClicked(
        inTxt: string,
        short: string,
    ): Promise<Utils.SamResult<{}>> {
        if (!appState.value.selectedTuber)
            return { failed: true, error: new Error("no tuber selected") };
        const intVal = Number.parseInt(inTxt);
        if (!intVal) {
            return {
                failed: true,
                error: new Error("Must be number greater than 0"),
            };
        }
        const shortBool = short == "true" ? true : false;
        // putStockLoading = true;
        const r = await ClientState.putStock(
            appState.value.selectedTuber.channelId,
            intVal,
            !shortBool,
        );
        // putStockLoading = false;
        return r;
    }
</script>

<!-- <span class='bigBold'>Tubers</span> -->
<!-- <button class="itemButton" on:click={()=>{ClientState.hideComp('tubers')}}>Hide</button> -->
<BarItem compData={{ kind: "tubers", thingId: undefined }} title="Tubers"
></BarItem>
<div class="msgs">
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
            <span>{t.count}</span>
        </div>
    {/each}
</div>
<SimpleForm
    buttonLabel="Search"
    onSubmit={ClientState.requestTuber}
    inputs={[{ itype: "text" }]}
/>

{#if appState.value.selectedTuber}
    <h3>{appState.value.selectedTuber.channelName}</h3>
    <SimpleForm
        buttonLabel="Place stock"
        onSubmit={placeStockClicked}
        inputs={[
            { itype: "number" },
            { itype: "checkbox", placeHold: "short" },
        ]}
    />
{/if}
