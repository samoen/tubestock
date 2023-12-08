<script lang="ts">
    import * as ClientState from '$lib/client/clientState.svelte'
    import * as Utils from '$lib/utils'
    import BarItem from './BarItem.svelte';
    import SimpleForm from './SimpleForm.svelte';
    import Positions from "$lib/client/components/Positions.svelte";
    const appState = ClientState.getAppState();
    
</script>

{#if appState.value.positionsList != undefined}
    <BarItem compData={{kind:"positions",thingId:undefined}} title='Positions'></BarItem>
    <!-- <span class='bigBold'>My Positions</span> -->
    <!-- <button class="itemButton" on:click={()=>{ClientState.hideComp('positions')}}>Hide</button> -->
    <div class="msgs">
        {#each appState.value.positionsList as p (p.id)}
            <div>
                <BarItem compData={{kind:'position',thingId:p.id,maybeMakeProps() {
                    const foundPos = appState.value.positionsList.findLast(pFromList=>pFromList.id == p.id)
                    if(!foundPos){
                        return undefined
                    }
                    return {positionInClient:foundPos}
                },}} title={p.tuberName + ' ' + p.id}></BarItem>
            </div>
        {/each}
    </div>
{/if}