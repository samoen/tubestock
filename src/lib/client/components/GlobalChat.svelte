<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import SimpleForm from "./SimpleForm.svelte";
    import GlobalChat from "$lib/client/components/GlobalChat.svelte";
    import OtherUser from "./OtherUser.svelte";

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
<BarItem compData={{ kind: "globalChat" }} title="Global Chat"></BarItem>
<span class="bigBold">Public Room</span>
<br />
<br />
<div class="chatHolder">
    <div class="msgs">
        {#each appState.value.chatMsgs as m (m.id)}
            <div class="listItem">
                <!-- <SimpleForm
                    buttonLabel={m.author.displayName}
                    onSubmit={async () => {
                        return await userSearch(m);
                    }}
                ></SimpleForm>
                <span> {m.msgTxt}</span> -->
                <BarItem
                    compData={{
                        kind: "chatMessage",
                        thingId: m.id,
                        maybeMakeProps() {
                            return { msg: m };
                        },
                    }}
                    title={m.author.displayName + " : " + m.msgTxt}
                ></BarItem>
            </div>
        {/each}
        <div class="listItem">
            <SimpleForm buttonLabel="Show Earlier" onSubmit={getEarlierMsgs}
            ></SimpleForm>
        </div>
    </div>
</div>
<SimpleForm
    buttonLabel="Send"
    onSubmit={async (msgTxt) => {
        return await ClientState.sendMsg(msgTxt);
    }}
    inputs={[{ itype: "text" }]}
/>

<style>
    .chatHolder {
        /* padding:15px; */
        padding-right:7px;
        border-radius: 10px;
        border:1px solid black;
        background-color: bisque;
        /* border-top:1px solid white; */
        /* border-bottom:1px solid white; */
        margin-bottom: 5px;
        /* background-color:blanchedalmond; */
        /* border:2px solid black; */
        /* border-radius: 5px; */
        /* box-shadow: inset black 2px 2px 3px 3px; */
        /* background-color: beige; */
        /* max-height: 100px; */
        /* overflow-y: auto; */
    }
</style>
