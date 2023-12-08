<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import Opener from "./Opener.svelte";
    import SimpleForm from "./SimpleForm.svelte";
    import Room from "./Room.svelte";

    const appState = ClientState.getAppState();
    type Props = {
        thing: Utils.InviteOnClient;
        // inviteId: number;
    };
    let { thing } = $props<Props>();
    let inviteId = thing.id;
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
    async function userSearch(m: number): Promise<Utils.SamResult<{}>> {
        const hit = await ClientState.userSearch(m);
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
        ClientState.showCompy(cWantshow);
        return hit;
    }
</script>

{#if thing}
    <!-- <div style:marginBottom=60px> -->
    <BarItem
        compData={{
            kind: "room",
            thingId: inviteId,
            maybeMakeProps() {
                let found = appState.value.roomInvites.findLast(
                    (u) => u.id == inviteId,
                );
                if (found) return { thing: found };
                return undefined;
            },
        }}
        title={thing.toRoom.roomName}
    ></BarItem>
    <span class="bigBold">Private Room #{inviteId}</span>
    <!-- </div> -->
    <br />
    <br />
    {#if thing.toRoom.ownerId != appState.value.myDbId}
        <SimpleForm
            buttonLabel="leave"
            onSubmit={async () => {
                if (!thing) return { failed: true, error: new Error("huh") };
                return await leaveRoom(thing.toRoom.id);
            }}
        ></SimpleForm>
    {/if}
    {#if thing.toRoom.ownerId == appState.value.myDbId}
        <h4>Admin</h4>
        {#if thing.toRoom.ownerId == appState.value.myDbId}
            <SimpleForm
                buttonLabel="Delete Room"
                onSubmit={async () => {
                    if (!thing)
                        return { failed: true, error: new Error("huh") };
                    return await deleteRoom(thing.toRoom.id);
                }}
            ></SimpleForm>
            <br/>
        {/if}
        <Opener label="Kick Participant">
            {#each thing.toRoom.invites as i (i.forUser.id)}
                <!-- {#if i.forUser.id != appState.value.myDbId} -->
                <SimpleForm
                    buttonLabel={i.forUser.displayName}
                    onSubmit={async () => {
                        if (!thing)
                            return {
                                failed: true,
                                error: new Error("huh"),
                            };
                        return await kickUser(thing.toRoom.id, i.forUser.id);
                    }}
                ></SimpleForm>
                <!-- {/if} -->
            {/each}
        </Opener>
    {/if}
    <h4>Participants</h4>
    <div class="listOfBarItems">
        {#each thing.toRoom.invites as i (i.forUser.id)}
            <SimpleForm
                buttonLabel={i.forUser.displayName}
                onSubmit={async () => {
                    const hit = await userSearch(i.forUser.id);
                    return hit;
                    // ClientState.showCompy(cWantshow)
                }}
            ></SimpleForm>
            <!-- <BarItem compData={{kind:'otherUsr',thingId:i.forUser.id,maybeMakeProps() {
                    
                },}} title={i.forUser.displayName}></BarItem> -->
            <!-- {#if invite.toRoom.ownerId == appState.value.myDbId && i.forUser.id != appState.value.myDbId}
                    <SimpleForm
                        buttonLabel="kick"
                        onSubmit={async () => {
                            if (!invite)
                                return {
                                    failed: true,
                                    error: new Error("huh"),
                                };
                            return await kickUser(
                                invite.toRoom.id,
                                i.forUser.id,
                            );
                        }}
                    ></SimpleForm>
                {/if} -->
        {/each}
    </div>

    <h4>Messages</h4>
    <div class="msgs">
        {#each thing.toRoom.msgs as m (m.id)}
            <div class="listItem">
                <p>{m.author.displayName} : {m.msgTxt}</p>
            </div>
        {/each}
        {#if thing.toRoom.msgs.length > 4}
            <SimpleForm
                buttonLabel="Show Earlier"
                onSubmit={async () => {
                    if (!thing)
                        return { failed: true, error: new Error("huh") };
                    return await getEarlierPrivateMsgs(thing);
                }}
            ></SimpleForm>
        {/if}
    </div>
    <SimpleForm
        buttonLabel="Send"
        onSubmit={async (msgTxt) => {
            if (!thing) return { failed: true, error: new Error("huh") };
            return await ClientState.sendMsg(msgTxt, thing.toRoom.id);
        }}
        inputs={[{ itype: "text" }]}
    />
    <br />
    <br />
{/if}

<style>
</style>
