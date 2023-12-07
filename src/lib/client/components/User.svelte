<script lang="ts">
import User from "$lib/client/components/User.svelte";
import * as ClientState from '$lib/client/clientState.svelte'
    import * as Utils from '$lib/utils'
    import BarItem from './BarItem.svelte';
    import SimpleForm from './SimpleForm.svelte';

    const appState = ClientState.getAppState();
    let netWorth = $derived(myNetWorth());
    function myNetWorth(): number | undefined {
        if (appState.value.myIdleStock == undefined) return undefined;
        return ClientState.calcNetWorth(
            appState.value.myIdleStock,
            appState.value.positionsList || [],
        );
    }

    
    async function restoreClicked(
        pIdTxt: string,
        nameTxt: string,
    ): Promise<Utils.SamResult<{}>> {
        let r = await ClientState.restoreUser(pIdTxt, nameTxt);
        return r;
    }
</script>

<!-- <h3>Me</h3> -->
<BarItem compData={{kind:'usr',thingId:undefined}} title='Me'></BarItem>
<p>Display Name: {appState.value.myUsername}</p>
<p>Idle stock : {appState.value.myIdleStock}</p>
<p>Net worth : {netWorth}</p>
<p class="selectableText">Public Id : {appState.value.myDbId}</p>
<p class="selectableText">Private Id : {appState.value.myPrivateId}</p>
<!-- fire={ClientState.setName}  -->
<SimpleForm
    buttonLabel="Update Display Name"
    onSubmit={ClientState.setName}
    inputs={[{ itype: "text", placeHold: "name" }]}
/>
<br />
<SimpleForm
    buttonLabel="Restore Session"
    onSubmit={restoreClicked}
    inputs={[
        { itype: "text", placeHold: "id" },
        { itype: "text", placeHold: "name" },
    ]}
/>
<br />
<button type="button" on:click={ClientState.deleteUser}>delete user</button>