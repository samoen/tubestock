<script lang="ts">
    import * as ClientState from '$lib/client/clientState.svelte'
    import * as Utils from '$lib/utils'
    import SimpleForm from './SimpleForm.svelte';
    
    const appState = ClientState.getAppState();
    
</script>

{#if appState.value.positionsList != undefined}
    <br />
    <br />
    <h3>My Positions</h3>
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