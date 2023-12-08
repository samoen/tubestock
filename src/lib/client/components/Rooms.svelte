<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import Room from "./Room.svelte";
    import Rooms from "$lib/client/components/Rooms.svelte";
    import Opener from "./Opener.svelte";
    import SimpleForm from "./SimpleForm.svelte";

    const appState = ClientState.getAppState();

    async function joinRoom(roomId: number) {
        const toSend: Utils.JoinRoomRequest = {
            roomIdToJoin: roomId,
            leave: false,
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

    let showables = $derived(
        (() => {
            return appState.value.roomInvites.filter((i) => i.joined);
        })(),
    );
    let joinables = $derived(
        (() => {
            return appState.value.roomInvites.filter((i) => !i.joined);
        })(),
    );
</script>

<BarItem compData={{ kind: "rooms", thingId: undefined}} title="Rooms"
></BarItem>
<div class="m">
    {#if showables.length > 0}
        <h4>Joined</h4>
        <div class="listOfBarItems">
            {#each showables as i (i.id)}
                <BarItem
                    compData={{
                        kind: "room",
                        thingId: i.id,
                        maybeMakeProps() {
                            let found = appState.value.roomInvites.findLast(
                                (u) => u.id == i.id,
                            );
                            if (found) return { thing: found };
                            return undefined;
                        },
                    }}
                    title={i.toRoom.roomName}
                ></BarItem>
            {/each}
        </div>
        <!-- <br /> -->
        <!-- <br /> -->
    {/if}
    {#if joinables.length > 0}
        <h4>Invited</h4>
        {#each joinables as i (i.id)}
            <Opener label={i.toRoom.roomName}>
                <SimpleForm
                    buttonLabel="join"
                    onSubmit={async () => {
                        return await joinRoom(i.toRoom.id);
                    }}
                ></SimpleForm>
                Room Id: {i.toRoom.id}
            </Opener>
        {/each}
    {/if}
</div>
<h4>Create Room</h4>
<SimpleForm
    buttonLabel="Create"
    inputs={[{ itype: "text" }]}
    onSubmit={createRoom}
></SimpleForm>
<br />

<!-- {#each displayingRooms as d}
    <Room {d}></Room>
{/each} -->

<style>
</style>
