<script lang="ts">
    import * as ClientState from '$lib/client/clientState.svelte'
    import * as Utils from '$lib/utils'
    import SimpleForm from './SimpleForm.svelte';
    
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
<h3>Users</h3>
<div class="msgs">
    {#each appState.value.userList as u (u.id)}
        <div>
            <span>{u.displayName}</span>
            <button
                type="button"
                class="itemButton"
                on:click={() => {
                    appState.value.selectedUser = u;
                    appState.dirty();
                }}>details</button
            >
        </div>
    {/each}
</div>
{#if appState.value.selectedUser}
    {#key appState.value.selectedUser}
        <h4>
            {appState.value.selectedUser.displayName}
        </h4>
        <p>
            Net worth: {ClientState.calcNetWorth(
                appState.value.selectedUser.idleStock,
                appState.value.selectedUser.positions,
            )}
        </p>
        {#each appState.value.selectedUser.positions as p (p.id)}
            <p>
                {p.tuberName} : {p.long ? "(long)" : "(short)"} : value {p.returnValue}
            </p>
        {/each}
        {#each roomsIOwn as i}
            <SimpleForm
                buttonLabel={`Invite to ${i.toRoom.roomName}`}
                onSubmit={async () => {
                    if (!appState.value.selectedUser) {
                        return {
                            failed: true,
                            error: new Error("selected user is undefined"),
                        };
                    }
                    return await inviteToRoomClicked(
                        appState.value.selectedUser.id,
                        i.toRoom.id,
                    );
                }}
            ></SimpleForm>
        {/each}
    {/key}
{/if}