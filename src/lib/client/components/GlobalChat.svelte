<script lang="ts">
    import * as ClientState from '$lib/client/clientState.svelte'
    import * as Utils from '$lib/utils'
    import BarItem from './BarItem.svelte';
    import SimpleForm from './SimpleForm.svelte';
    
    const appState = ClientState.getAppState();
    async function getEarlierMsgs() {
        const oldestMsg = appState.value.chatMsgs.reduce((oldest, current) => {
            return current.sentAt < oldest.sentAt ? current : oldest;
        }, appState.value.chatMsgs[0]);

        const toSend: Utils.HistoricalMsgsRequest = {
            startAtTime: oldestMsg.sentAt,
        };
        const resp = await ClientState.hitEndpoint(
            "historicalMsgs",
            toSend,
            Utils.chatMsgsResponseSchema,
        );
        if (resp.failed) {
            console.log("bad get historical resp format");
            return resp;
        }
        appState.value.chatMsgs.push(...resp.value.msgs);
        appState.dirty();
        return resp;
    }
</script>

<!-- <button class="itemButton" on:click={()=>{ClientState.hideComp('globalChat')}}>Hide</button> -->
<BarItem compData={{kind:"static",id:`globalChat`}} title='Global Chat'></BarItem>
<span class='bigBold'>Public Room</span>
<div class="msgs">
    {#each appState.value.chatMsgs as m (m.id)}
        <div class='listItem'>

            <p>{m.author.displayName} : {m.msgTxt}</p>
        </div>
    {/each}
    <SimpleForm buttonLabel="Show Earlier" onSubmit={getEarlierMsgs}
    ></SimpleForm>
</div>
<SimpleForm
    buttonLabel="Send"
    onSubmit={async (msgTxt) => {
        return await ClientState.sendMsg(msgTxt);
    }}
    inputs={[{ itype: "text" }]}
/>