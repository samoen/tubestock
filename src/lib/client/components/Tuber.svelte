<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import Tuber from "$lib/client/components/Tuber.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import SimpleForm from "./SimpleForm.svelte";

    const appState = ClientState.getAppState();
    let { thing } = $props<{ thing: Utils.TuberInClient }>();

    async function placeStockClicked(
        inTxt: string,
        short: string,
    ): Promise<Utils.SamResult<{}>> {
        if (!thing)
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
            thing.channelId,
            intVal,
            !shortBool,
        );
        // putStockLoading = false;
        return r;
    }
</script>

{#if thing}
    <BarItem
        compData={{
            kind: "tuber",
            thingId: thing.id,
            maybeMakeProps() {
                let found = appState.value.tuberList.findLast(
                    (u) => u.id == thing.id,
                );
                if (found) return { thing: found };
                return undefined;
            },
        }}
        title={thing.channelName}
    ></BarItem>
    <span class="bigBold">Tuber</span>
    <br />
    <br />
    <p>
        Current subs: {thing.count}
    </p>
    <br />
    <h4>Place Stock</h4>
    <!-- <h3>{tuberOnClient.channelName}</h3> -->
    <SimpleForm
        buttonLabel="Place stock"
        onSubmit={placeStockClicked}
        inputs={[
            { itype: "number" },
            { itype: "checkbox", placeHold: "short" },
        ]}
    />
{/if}
