<script lang="ts">


    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import SimpleForm from "./SimpleForm.svelte";
    import GlobalChat from "$lib/client/components/GlobalChat.svelte";
    import OtherUser from "./OtherUser.svelte";

    const appState = ClientState.getAppState();
    const { msg } = $props<{msg : Utils.ChatMsgOnClient}>()
    
    async function userSearch(
        m: Utils.ChatMsgOnClient,
    ): Promise<Utils.SamResult<{}>> {
        const hit = await ClientState.userSearch(m.author.id)
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
    function topButClick(){
        // let toRemove = {}
        // ClientState.showCompy()
        appState.value.compies = appState.value.compies.filter(c=>!ClientState.compiesAreSame(c,{kind:'chatMessage',thingId:msg.id}))
        appState.dirty()
    }
</script>

<BarItem
    compData={{ kind: 'chatMessage', thingId: msg.id}}
    title={msg.author.displayName+' : '+msg.msgTxt}
></BarItem>
<!-- <button
class="itemButton inset-brutal"
 on:click={()=>{
    topButClick()
    
}}>{msg.author.displayName+' : '+msg.msgTxt}</button> -->

<span class="bigBold">Chat Message #{msg.id}</span>
<p>id: {msg.id}</p>
<p>Message Text: {msg.msgTxt}</p>
<p>Sent at: {msg.sentAt}</p>
<span>Author:</span>
<SimpleForm
buttonLabel={msg.author.displayName}
onSubmit={async () => {
    return await userSearch(msg);
}}></SimpleForm>

