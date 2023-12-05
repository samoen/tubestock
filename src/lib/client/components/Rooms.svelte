<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import Room from "./Room.svelte";
    import SimpleForm from "./SimpleForm.svelte";

    const appState = ClientState.getAppState();
    // const displayingRooms = $derived(
    //     (() => {
    //         let result: Utils.InviteOnClient[] = [];
    //         const toRemove: number[] = [];
    //         for (const r of appState.value.displayingInvites) {
    //             const found = appState.value.roomInvites.findLast(
    //                 (f) => f.id == r,
    //             );
    //             if (!found || !found.joined) {
    //                 toRemove.push(r);
    //                 continue;
    //             }
    //             result.push(found);
    //         }
    //         appState.value.displayingInvites =
    //             appState.value.displayingInvites.filter(
    //                 (i) => !toRemove.includes(i),
    //             );
    //         return result;
    //     })(),
    // );

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

<BarItem forCompId={{ kind: "static", id: "rooms" }} title="Rooms"></BarItem>
<!-- <span class="bigBold">Rooms</span> -->
<!-- <button class="itemButton" on:click={hide}>Hide</button> -->
<div class="m">
    <h4>Joined</h4>
    {#each showables as i (i.id)}
        <BarItem
            forCompId={{ kind: "room", id: `room${i.id}`, invite: i }}
            title={i.toRoom.roomName}
        ></BarItem>
    {/each}
    <br/>
    <br/>
    {#if joinables.length > 0}
    <h4>Invited</h4>
    {#each joinables as i (i.id)}
    <div class="listItem">
        <span> {i.toRoom.roomName}</span>
        <SimpleForm
        buttonLabel="join"
        onSubmit={async () => {
            return await joinRoom(i.toRoom.id);
        }}
            ></SimpleForm>
        </div>
        {/each}
        {/if}
</div>
<SimpleForm
    buttonLabel="Create Room"
    inputs={[{ itype: "text" }]}
    onSubmit={createRoom}
></SimpleForm>
<br />

<!-- {#each displayingRooms as d}
    <Room {d}></Room>
{/each} -->

<style>
</style>
