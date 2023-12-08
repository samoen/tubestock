<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import SimpleForm from "./SimpleForm.svelte";
    import GlobalChat from "$lib/client/components/GlobalChat.svelte";
    import OtherUser from "./OtherUser.svelte";

    const appState = ClientState.getAppState();
    const {msg } = $props<{msg : Utils.ChatMsgOnClient}>()
    
    async function userSearch(
        m: Utils.ChatMsgOnClient,
    ): Promise<Utils.SamResult<{}>> {
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
        let cWantshow: ClientState.ComponentWantShow = {
            kind: "otherUsr",
            thingId: hit.value.userDeets.id,
            maybeMakeProps: () => {
                return {
                    thing: hit.value.userDeets,
                };
            },
        };
        ClientState.showCompy(cWantshow)
        return hit;
    }
</script>

<!-- <button class="itemButton" on:click={()=>{ClientState.hideComp('globalChat')}}>Hide</button> -->
<BarItem
    compData={{ kind: 'chatMessage', thingId: msg.id}}
    title={msg.author.displayName+' - '+msg.id}
></BarItem>
<span class="bigBold">Chat Message</span>
<p>id: {msg.id}</p>
<p>Message Text: {msg.msgTxt}</p>
<p>Sent at: {msg.sentAt}</p>
<span>Author:</span>
<SimpleForm
buttonLabel={msg.author.displayName}
onSubmit={async () => {
    return await userSearch(msg);
}}></SimpleForm>

