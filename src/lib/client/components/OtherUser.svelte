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
    let { thing: selectedUser } = $props<Props>();

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
    async function addOrRemoveFriend(){
        let toSend : Utils.AddFriendRequest = {
            userDbId:selectedUser.id,
            remove:isFriend
        }
        let r = await ClientState.hitEndpoint('addFriend',toSend,Utils.worldEventSchema)
        if(r.failed){
            return r
        }
        ClientState.receiveWorldEvent(r.value)
        console.log('got friends ' + JSON.stringify(r.value))
        return r
    }
    let roomsIOwn = $derived(
        (() => {
            const myId = appState.value.myDbId;
            // console.log('recalc invitables. myid is ' + myId + ', my invites are ' + JSON.stringify(appState.value.roomInvites))
            const i = appState.value.roomInvites.filter(
                (i) => i.toRoom.ownerId == myId,
            );
            console.log("recalc invitables. " + i.length);

            return i;
        })(),
    );
    let isFriend = $derived((()=>{
        return appState.value.friendsList.some(f=>f.id ==selectedUser.id)
    })())
</script>

{#if selectedUser}
    <BarItem
        compData={{
            kind: "otherUsr",
            thingId: selectedUser.id,
            maybeMakeProps() {
                let found = appState.value.friendsList.findLast(u=>u.id == selectedUser.id)
                if(found) return {thing:found}
                return undefined
            },
            template:ClientState.otherUsr
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
    <br/>
    <SimpleForm buttonLabel="{isFriend ? 'remove friend' : 'add friend'}" onSubmit={addOrRemoveFriend}></SimpleForm>
{:else}
    <p>component not found</p>
{/if}
