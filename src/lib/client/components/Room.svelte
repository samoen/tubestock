<script lang="ts">
    import * as ClientState from '$lib/client/clientState.svelte'
    import * as Utils from '$lib/utils'
    import BarItem from './BarItem.svelte';
    import SimpleForm from './SimpleForm.svelte';

    const appState = ClientState.getAppState();
    type Props = {
        d:Utils.InviteOnClient
    }
    let {d} = $props<Props>();

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
        ClientState.receiveWorldEvent(resp.value);
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
        appState.value.compies = appState.value.compies.filter(c=>c.id != `room${d.id}`)
        ClientState.receiveWorldEvent(resp.value);
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
        appState.value.compies = appState.value.compies.filter(c=>c.id != `room${d.id}`)
        ClientState.receiveWorldEvent(resp.value);
        return resp;
    }
</script>

<!-- <div style:marginBottom=60px> -->
    <BarItem forCompId={{kind:"room",id:`room${d.id}`,invite:d}} title={d.toRoom.roomName}></BarItem>
    <span class='bigBold'>Private Room</span>
<!-- </div> -->
<br/>
<br/>
{#if d.toRoom.ownerId == appState.value.myDbId}
                <SimpleForm
                    buttonLabel="delete"
                    onSubmit={async () => {
                        return await deleteRoom(d.toRoom.id);
                    }}
                ></SimpleForm>
{/if}
{#if d.toRoom.ownerId != appState.value.myDbId}
                    <SimpleForm
                        buttonLabel="leave"
                        onSubmit={async () => {
                            return await leaveRoom(d.toRoom.id);
                        }}
                    ></SimpleForm>
                {/if}
<h4>Participants</h4>
<div class='msgs'>
    {#each d.toRoom.invites as i}
        <div class='listItem'>
            <span>{i.forUser.displayName}</span>
            {#if i.forUser.id == d.toRoom.ownerId}
                <span>(owner)</span>
            {/if}
            {#if d.toRoom.ownerId == appState.value.myDbId && i.forUser.id != appState.value.myDbId}
                <SimpleForm
                    buttonLabel="kick"
                    onSubmit={async () => {
                        return await kickUser(d.toRoom.id, i.forUser.id);
                    }}
                ></SimpleForm>
            {/if}
        </div>
    {/each}

</div>
<h4>Messages</h4>
<div class="msgs">
    {#each d.toRoom.msgs as m (m.id)}
        <div class='listItem'>
            <p>{m.author.displayName} : {m.msgTxt}</p>
        </div>
    {/each}
    <SimpleForm
        buttonLabel="Show Earlier"
        onSubmit={async () => {
            return await getEarlierPrivateMsgs(d);
        }}
    ></SimpleForm>
</div>
<SimpleForm
    buttonLabel="Send"
    onSubmit={async (msgTxt) => {
        return await ClientState.sendMsg(msgTxt, d.toRoom.id);
    }}
    inputs={[{ itype: "text" }]}
/>
<br />
<br />