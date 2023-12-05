<script lang="ts">
    import * as ClientState from '$lib/client/clientState.svelte'
    import * as Utils from '$lib/utils'
    import BarItem from './BarItem.svelte';
    import SimpleForm from './SimpleForm.svelte';
    
    const appState = ClientState.getAppState();
    
</script>

{#if appState.value.positionsList != undefined}
    <BarItem compData={{kind:"static",id:`positions`}} title='Positions'></BarItem>
    <!-- <span class='bigBold'>My Positions</span> -->
    <!-- <button class="itemButton" on:click={()=>{ClientState.hideComp('positions')}}>Hide</button> -->
    <div class="msgs">
        {#each appState.value.positionsList as p (p.id)}
            <div>
                <span>
                    {p.tuberName} : {p.amount} : {p.subsAtStart} : {p.long
                        ? "(long)"
                        : "(short)"} : returns {p.returnValue}
                </span>
                <!-- class="itemButton red" -->
                <SimpleForm
                    buttonLabel="exit"
                    onSubmit={async () => {
                        return await ClientState.exitPosition(p.id);
                    }}
                ></SimpleForm>
            </div>
        {/each}
    </div>
{/if}