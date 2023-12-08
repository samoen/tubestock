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
    <BarItem compData={{kind:'position',thingId:positionInClient.id}} title={positionInClient.tuberName + ' ' + positionInClient.id}></BarItem>
    <br/>
    <p>Id: {positionInClient.id}</p>
    <p>Return value: {positionInClient.returnValue}</p>
    <p>Subs at start: {positionInClient.subsAtStart}</p>
    <p>Amount: {positionInClient.amount}</p>
    <p>Type: {positionInClient.long ? 'long' : 'short'}</p>
    <SimpleForm
                    buttonLabel="Exit Position"
                    onSubmit={async () => {
                        return await ClientState.exitPosition(positionInClient.id);
                    }}
                ></SimpleForm>