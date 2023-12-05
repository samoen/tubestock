<script lang="ts">
    import * as ClientState from '$lib/client/clientState.svelte'
    import * as Utils from '$lib/utils'
    import BarItem from './BarItem.svelte';
    import SimpleForm from './SimpleForm.svelte';
    import Opener from './Opener.svelte';

    type Props = {
        selectedUser:Utils.OtherUserOnClient
    }
    let {selectedUser} = $props<Props>()
    
    const appState = ClientState.getAppState();
    
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
    let roomsIOwn = $derived((()=>{
        const myId = appState.value.myDbId
        // console.log('recalc invitables. myid is ' + myId + ', my invites are ' + JSON.stringify(appState.value.roomInvites))
        const i = appState.value.roomInvites.filter((i) => i.toRoom.ownerId == myId)
        return i
    })())
</script>

<BarItem compData={{id:`user${selectedUser.id}`, kind:'user', userOnClient:selectedUser}} title={selectedUser.displayName}></BarItem>
<span class='bigBold'>
    User
</span>
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
{#if roomsIOwn.length > 1}
    <Opener label='Invite'>
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