<script lang="ts">
    import * as ClientState from '$lib/client/clientState.svelte'
    import * as Utils from '$lib/utils'
    import SimpleForm from './SimpleForm.svelte';
    
    const appState = ClientState.getAppState();
    
    async function joinRoom(roomId: number, leave: boolean = false) {
        const toSend: Utils.JoinRoomRequest = {
            roomIdToJoin: roomId,
            leave: leave,
        };
        const resp = await ClientState.hitEndpoint(
            "joinRoom",
            toSend,
            Utils.worldEventSchema,
        );
        if (resp.failed) return resp;
        ClientState.receiveWorldEvent(resp.value);
        return resp;
    }
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
    async function createRoom(inputTxt: string) {
        const toSend: Utils.CreateRoomRequest = {
            roomName: inputTxt,
        };
        const resp = await ClientState.hitEndpoint(
            "createRoom",
            toSend,
            Utils.worldEventSchema,
        );
        if (resp.failed) return resp;
        ClientState.receiveWorldEvent(resp.value);
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
</script>

<h3>Rooms</h3>
<div class="msgs">
    {#each appState.value.roomInvites as i (i.id)}
        <div>
            <span> {i.toRoom.roomName}</span>
            {#if i.joined}
                <button
                    type="button"
                    class="itemButton"
                    on:click={() => {
                        if (!appState.value.displayingInvites.includes(i.id)) {
                            appState.value.displayingInvites.push(i.id);
                            appState.dirty();
                        }
                    }}>show</button
                >
                {#if i.toRoom.ownerId != appState.value.myDbId}
                    <SimpleForm
                        buttonLabel="leave"
                        onSubmit={async () => {
                            return await joinRoom(i.toRoom.id, true);
                        }}
                    ></SimpleForm>
                {/if}
            {:else}
                <SimpleForm
                    buttonLabel="join"
                    onSubmit={async () => {
                        return await joinRoom(i.toRoom.id);
                    }}
                ></SimpleForm>
            {/if}
            {#if i.toRoom.ownerId == appState.value.myDbId}
                <SimpleForm
                    buttonLabel="delete"
                    onSubmit={async () => {
                        return await deleteRoom(i.toRoom.id);
                    }}
                ></SimpleForm>
            {/if}
        </div>
    {/each}
</div>
<SimpleForm
    buttonLabel="Create Room"
    inputs={[{ itype: "text" }]}
    onSubmit={createRoom}
></SimpleForm>

{#each ClientState.showDisplayingInvites() as d}
    <span class="bigBold">{d.toRoom.roomName}</span>
    <button
        type="button"
        class="itemButton"
        on:click={() => {
            appState.value.displayingInvites =
                appState.value.displayingInvites.filter((r) => r != d.id);
            appState.dirty();
        }}>hide</button
    >
    {#each d.toRoom.invites as i}
        <div>
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
    <div class="msgs">
        {#each d.toRoom.msgs as m (m.id)}
            <p>{m.author.displayName} : {m.msgTxt}</p>
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
{/each}

<style>
    .bigBold {
        font-weight: bold;
        font-size: 1.3rem;
    }
</style>