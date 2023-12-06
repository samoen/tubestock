<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import Opener from "./Opener.svelte";
    import SimpleForm from "./SimpleForm.svelte";
    import Room from "./Room.svelte";

    const appState = ClientState.getAppState();
    type Props = {
        thing:Utils.InviteOnClient
        // inviteId: number;
    };
    let { thing : invite } = $props<Props>();
    let inviteId = invite.id
    // let invite = $derived(
    //     (() => {
    //         return appState.value.roomInvites.findLast((i) => i.id == inviteId);
    //     })(),
    // );

    async function kickUser(roomId: number, userId: number) {
        const toSend: Utils.InviteToRoomRequest = {
            roomId: roomId,
            userToInviteId: userId,
            kick: true,
        };
        const resp = await ClientState.hitEndpoint(
            "inviteToRoom",
            toSend,
            Utils.worldEventSchema,
        );
        if (resp.failed) return resp;
        // ClientState.receiveWorldEvent(resp.value);
        return resp;
    }
    async function getEarlierPrivateMsgs(invite: Utils.InviteOnClient) {
        const oldestMsg = invite.toRoom.msgs.reduce((oldest, current) => {
            return current.sentAt < oldest.sentAt ? current : oldest;
        }, invite.toRoom.msgs[0]);

        const toSend: Utils.HistoricalMsgsRequest = {
            startAtTime: oldestMsg.sentAt,
            roomId: invite.toRoom.id,
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
        invite.toRoom.msgs.push(...resp.value.msgs);
        appState.dirty();

        return resp;
    }

    async function deleteRoom(roomId: number) {
        const toSend: Utils.DeleteRoomRequest = {
            rId: roomId,
        };
        const resp = await ClientState.hitEndpoint(
            "createRoom",
            toSend,
            Utils.worldEventSchema,
        );
        if (resp.failed) return resp;
        // appState.value.compies = appState.value.compies.filter(
        //     (c) => c.thingId != `room${inviteId}`,
        // );
        // ClientState.receiveWorldEvent(resp.value);
        return resp;
    }
    async function leaveRoom(roomId: number) {
        const toSend: Utils.JoinRoomRequest = {
            roomIdToJoin: roomId,
            leave: true,
        };
        const resp = await ClientState.hitEndpoint(
            "joinRoom",
            toSend,
            Utils.worldEventSchema,
        );
        if (resp.failed) return resp;
        // appState.value.compies = appState.value.compies.filter(
        //     (c) => c.thingId != `room${inviteId}`,
        // );
        ClientState.receiveWorldEvent(resp.value);
        return resp;
    }
</script>

{#if invite}
    <!-- <div style:marginBottom=60px> -->
    <BarItem
    compData={{ kind: "room", thingId:inviteId }}
        title={invite.toRoom.roomName}
    ></BarItem>
    <span class="bigBold">Private Room</span>
    <!-- </div> -->
    <br />
    <br />
    {#if invite.toRoom.ownerId == appState.value.myDbId}
        <SimpleForm
            buttonLabel="Delete Room"
            onSubmit={async () => {
                if(!invite)return {failed:true,error:new Error('huh')}
                return await deleteRoom(invite.toRoom.id);
            }}
        ></SimpleForm>
    {/if}
    {#if invite.toRoom.ownerId != appState.value.myDbId}
        <SimpleForm
            buttonLabel="leave"
            onSubmit={async () => {
                if(!invite)return {failed:true,error:new Error('huh')}
                return await leaveRoom(invite.toRoom.id);
            }}
        ></SimpleForm>
    {/if}
    <h4>Participants</h4>
    <div class="listOfBarItems">
        {#each invite.toRoom.invites as i (i.forUser.id)}
            <Opener label={i.forUser.displayName + (i.forUser.id == invite.toRoom.ownerId ? '(owner)' : '')}>
                {#if invite.toRoom.ownerId == appState.value.myDbId && i.forUser.id != appState.value.myDbId}
                    <SimpleForm
                        buttonLabel="kick"
                        onSubmit={async () => {
                            if(!invite)return {failed:true,error:new Error('huh')}
                            return await kickUser(invite.toRoom.id, i.forUser.id);
                        }}
                    ></SimpleForm>
                {/if}
                    </Opener>
        {/each}
    </div>
    <h4>Messages</h4>
    <div class="msgs">
        {#each invite.toRoom.msgs as m (m.id)}
            <div class="listItem">
                <p>{m.author.displayName} : {m.msgTxt}</p>
            </div>
        {/each}
        {#if invite.toRoom.msgs.length > 4}
            <SimpleForm
                buttonLabel="Show Earlier"
                onSubmit={async () => {
                    if(!invite)return {failed:true,error:new Error('huh')}
                    return await getEarlierPrivateMsgs(invite);
                }}
            ></SimpleForm>
        {/if}
    </div>
    <SimpleForm
        buttonLabel="Send"
        onSubmit={async (msgTxt) => {
            if(!invite)return {failed:true,error:new Error('huh')}
            return await ClientState.sendMsg(msgTxt, invite.toRoom.id);
        }}
        inputs={[{ itype: "text" }]}
    />
    <br />
    <br />
{/if}

<style>
    
</style>
