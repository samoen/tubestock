<script lang="ts">
    import * as ClientState from '$lib/client/clientState.svelte'
    import * as Utils from '$lib/utils'
    import SimpleForm from './SimpleForm.svelte';
    
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

<h3>Tubers</h3>
<div class="msgs">
    {#each appState.value.tuberList as t (t.channelId)}
        <div>
            <span>{t.channelName} : {t.count}</span>
            <button
                type="button"
                class="itemButton"
                on:click={() => {
                    appState.value.selectedTuber = t;
                    appState.dirty();
                }}
            >
                Select
            </button>
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