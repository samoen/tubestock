<script lang="ts">
    import * as ClientState from '$lib/client/clientState.svelte'
    import * as Utils from '$lib/utils'
    import BarItem from './BarItem.svelte';
    import SimpleForm from './SimpleForm.svelte';


    let {tuberOnClient} = $props<{tuberOnClient:Utils.TuberInClient}>()

    // const appState = ClientState.getAppState();

    
    async function placeStockClicked(
        inTxt: string,
        short: string,
    ): Promise<Utils.SamResult<{}>> {
        if (!tuberOnClient)
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
            tuberOnClient.channelId,
            intVal,
            !shortBool,
        );
        // putStockLoading = false;
        return r;
    }
</script>

<BarItem forCompId={{kind:"tuber",id:`tuber${tuberOnClient.channelId}`,tuberOnClient:tuberOnClient}} title={tuberOnClient.channelName}></BarItem>
<span class='bigBold'>Tuber</span>
<br/>
<br/>
<p>
    Current subs: {tuberOnClient.count}
</p>
<br/>
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