<script lang="ts">
    import * as ClientState from "$lib/client/clientState.svelte";
    import * as Utils from "$lib/utils";
    import BarItem from "./BarItem.svelte";
    import SimpleForm from "./SimpleForm.svelte";

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
    let roomsIOwn = $derived(
        (() => {
            const myId = appState.value.myDbId;
            // console.log('recalc invitables. myid is ' + myId + ', my invites are ' + JSON.stringify(appState.value.roomInvites))
            const i = appState.value.roomInvites.filter(
                (i) => i.toRoom.ownerId == myId,
            );
            return i;
        })(),
    );

    function showUser(u: Utils.OtherUserOnClient) {
        if (appState.value.compies.findLast((c) => c.id == `user${u.id}`)) {
            ClientState.hideComp(`user${u.id}`);
            return;
        }
        appState.value.compies.unshift({
            kind: "user",
            userOnClient: u,
            id: `user${u.id}`,
        });
        // appState.value.selectedUser = u;
        ClientState.createCounter().setToZero();
        appState.dirty();
    }
</script>

<div class='outer'>
<!-- <span class="bigBold">Users</span> -->
<BarItem forCompId={{kind:'static', id:"usrs"}} title="Users"></BarItem>
<!-- <button
    class="itemButton"
    on:click={() => {
        ClientState.hideComp("usrs");
    }}>Hide</button
> -->
<br/>
<br/>
    <div class="usrlist">
        {#each appState.value.userList as u (u.id)}
            <div class='usrItem'>
                <!-- <span>{u.displayName}</span> -->
                <BarItem forCompId={{kind:'user', id:`user${u.id}`,userOnClient:u}} title={u.displayName}></BarItem>
                <!-- <button
                    type="button"
                    class="itemButton"
                    on:click={() => {
                        showUser(u);
                    }}>show</button
                > -->
            </div>
        {/each}
    </div>
</div>

<style>
    .outer{

    }
    .usrlist{
        display:flex;
        gap:5px;
        flex-wrap: wrap;
        /* margin-bottom: 20px;
        margin-top: 20px;
        margin-inline: 20px; */
    }

</style>
