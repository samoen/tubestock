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
    async function userSearch(
        m: Utils.ChatMsgOnClient,
    ): Promise<Utils.SamResult<{}>> {
        // if id is already in friends list, no need to search
        let idForUi: undefined | number = undefined;
        // const foundFriend = appState.value.friendsList.findLast(
        //     (f) => f.id == m.author.id,
        // );
        // let result: Utils.SamResult<{}> = {
        //     failed: false,
        //     value: {},
        // };

        // let compToShow : ClientState.ComponentWantShow | undefined = undefined
        // if (foundFriend) {
        //     idForUi = foundFriend.id;
        //     compToShow = {
        //         kind: "otherUsr",
        //         thingId: foundFriend.id,
        //         maybeMakeProps() {
        //             return {thing:foundFriend}
        //         },
        //     }
        // }
        // if (!foundFriend) {
        const toSend: Utils.UserSearchRequest = {
            userDbId: m.author.id,
        };
        const hit = await ClientState.hitEndpoint(
            "userSearch",
            toSend,
            Utils.userSearchResponseSchema,
        );
        if (hit.failed) {
            return hit;
        }
        // appState.value.uiUserList = [hit.value.userDeets];

        // appState.value.uiUserList.push(hit.value.userDeets)
        let cWantshow: ClientState.ComponentWantShow = {
            kind: "otherUsr",
            thingId: hit.value.userDeets.id,
            maybeMakeProps: () => {
                return {
                    thing: hit.value.userDeets,
                };
            },
        };
        // }
        // if(!compToShow){
        //     return {
        //         failed:true,
        //         error:new Error('to comp to show')
        //     }
        // }
        appState.value.compies = appState.value.compies.filter(
            (c) => !(c.kind == "otherUsr" && c.thingId == idForUi),
        );
        appState.value.compies.unshift(cWantshow);
        ClientState.getScrollY().setToZero();

        appState.dirty();
        // searchResult = hit.value.userDeets;
        // appState.value.uiUserList.push(hit.value.userDeets);
        return hit;
    }
</script>

<!-- <button class="itemButton" on:click={()=>{ClientState.hideComp('globalChat')}}>Hide</button> -->
<BarItem
    compData={{ kind: "globalChat", thingId: undefined }}
    title="Global Chat"
></BarItem>
<span class="bigBold">Public Room</span>
<div class="msgs">
    {#each appState.value.chatMsgs as m (m.id)}
        <div class="listItem">
            <p>{m.author.displayName} : {m.msgTxt}</p>
            <SimpleForm
                buttonLabel="get"
                onSubmit={async () => {
                    return await userSearch(m);
                }}
            ></SimpleForm>
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
