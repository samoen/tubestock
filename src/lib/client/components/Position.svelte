<script lang="ts">
    import * as ClientState from '$lib/client/clientState.svelte'
    import * as Utils from '$lib/utils'
    import BarItem from './BarItem.svelte';
    import SimpleForm from './SimpleForm.svelte';
    import Positions from "$lib/client/components/Positions.svelte";
    const appState = ClientState.getAppState();

    type Props = {
        positionInClient: Utils.PositionInClient;
    };
    let { positionInClient } = $props<Props>();

        
    </script>
    <BarItem compData={{
        kind:'position',
        thingId:positionInClient.id,
        maybeMakeProps() {
            return {positionInClient:positionInClient}
        },
    }} title={positionInClient.tuberName + ' ' + positionInClient.id}></BarItem>
    <span class="bigBold">Position #{positionInClient.id}</span>
    <br/>
    <p>Id: {positionInClient.id}</p>
    <p>Return value: {positionInClient.returnValue}</p>
    <p>Subs at start: {positionInClient.subsAtStart}</p>
    <p>Amount: {positionInClient.amount}</p>
    <p>Type: {positionInClient.long ? 'long' : 'short'}</p>
    {#if positionInClient.holderId == appState.value.myDbId}
        <SimpleForm
                        buttonLabel="Exit Position"
                        onSubmit={async () => {
                            return await ClientState.exitPosition(positionInClient.id);
                        }}
                    ></SimpleForm>
    {/if}