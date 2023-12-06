<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import SimpleForm from "./SimpleForm.svelte";
    import Opener from "./Opener.svelte";
    import OtherUser from "./OtherUser.svelte";

    const appState = ClientState.getAppState();

    type Props = {
        thing: Utils.OtherUserOnClient;
    };
    let { thing : selectedUser } = $props<Props>();

    async function inviteToRoomClicked(
        userIdToInvite: number,
        roomIdToInviteTo: number,
    ): Promise<Utils.SamResult<{}>> {
        const toSend: Utils.InviteToRoomRequest = {
            roomId: roomIdToInviteTo,
            userToInviteId: userIdToInvite,
        };
        const r = await ClientState.hitEndpoint(
            "inviteToRoom",
            toSend,
            Utils.emptyObject,
        );
        return r;
    }
    let roomsIOwn = $derived(
        (() => {
            const myId = appState.value.myDbId;
            // console.log('recalc invitables. myid is ' + myId + ', my invites are ' + JSON.stringify(appState.value.roomInvites))
            const i = appState.value.roomInvites.filter(
                (i) => i.toRoom.ownerId == myId,
                );
                console.log('recalc invitables. ' + i.length)
            
            return i;
        })(),
    );
</script>

{#if selectedUser}
    <BarItem
        compData={{
            kind: "otherUsr",
            thingId:selectedUser.id,
            
        }}
        title={selectedUser.displayName}
    ></BarItem>
    <span class="bigBold"> User </span>
    <p>
        Id: {selectedUser.id}
    </p>
    <p>
        Net worth: {ClientState.calcNetWorth(
            selectedUser.idleStock,
            selectedUser.positions,
        )}
    </p>
    {#each selectedUser.positions as p (p.id)}
        <p>
            {p.tuberName} : {p.long ? "(long)" : "(short)"} : value {p.returnValue}
        </p>
    {/each}
    {#if roomsIOwn.length > 0}
        <Opener label="Invite">
            {#each roomsIOwn as i}
                <SimpleForm
                    buttonLabel={`${i.toRoom.roomName}`}
                    onSubmit={async () => {
                        if (!selectedUser) {
                            return {
                                failed: true,
                                error: new Error("selected user is undefined"),
                            };
                        }
                        return await inviteToRoomClicked(
                            selectedUser.id,
                            i.toRoom.id,
                        );
                    }}
                ></SimpleForm>
            {/each}
        </Opener>
    {/if}
    {:else}
    <p>component not found</p>
{/if}
