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
    let { thing } = $props<Props>();

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
    async function addOrRemoveFriend() {
        let toSend: Utils.AddFriendRequest = {
            userDbId: thing.id,
            remove: isFriend,
        };
        let r = await ClientState.hitEndpoint(
            "addFriend",
            toSend,
            Utils.worldEventSchema,
        );
        if (r.failed) {
            return r;
        }
        ClientState.receiveWorldEvent(r.value);
        // console.log('got friends ' + JSON.stringify(r.value))
        return r;
    }
    let roomsIOwn = $derived(
        (() => {
            const myId = appState.value.myDbId;
            // console.log('recalc invitables. myid is ' + myId + ', my invites are ' + JSON.stringify(appState.value.roomInvites))
            const i = appState.value.roomInvites.filter(
                (i) => i.toRoom.ownerId == myId,
            );
            // console.log("recalc invitables. " + i.length);

            return i;
        })(),
    );
    let isFriend = $derived(
        (() => {
            return appState.value.friendsList.some(
                (f) => f.id == thing.id,
            );
        })(),
    );
    // function weirdAddComp(p:Utils.PositionInClient){
    //     const c : ClientState.ComponentWantShow = {
    //         kind: "position",
    //         thingId: p.id,
    //         maybeMakeProps() {
    //             return { positionInClient: p };
    //         },
    //     }
    //     ClientState.showCompy(c)
    // }
</script>

<!-- {#if thing} -->
<BarItem
    compData={{
        kind: "otherUsr",
        thingId: thing.id,
        maybeMakeProps() {
            let found = appState.value.friendsList.findLast(
                (u) => u.id == thing.id,
            );
            if (found) return { thing: found };
            
            return undefined;
        },
    }}
    title={thing.displayName}
></BarItem>
<span class="bigBold"> User #{thing.id} </span>
<p>
    Id: {thing.id}
</p>
<p>
    Net worth: {ClientState.calcNetWorth(
        thing.idleStock,
        thing.positions,
    )}
</p>
{#if roomsIOwn.length > 0}
    <Opener label="Invite to Room">
        {#each roomsIOwn as i}
            <SimpleForm
                buttonLabel={`${i.toRoom.roomName}`}
                onSubmit={async () => {
                    return await inviteToRoomClicked(
                        thing.id,
                        i.toRoom.id,
                    );
                }}
            ></SimpleForm>
        {/each}
    </Opener>
    <br/>
{/if}

<SimpleForm
    buttonLabel={isFriend ? "remove friend" : "add friend"}
    onSubmit={addOrRemoveFriend}
></SimpleForm>
<br />
<h4>Positions</h4>
{#each thing.positions as p (p.id)}
    <BarItem
        compData={{
            kind: "position",
            thingId: p.id,
            maybeMakeProps() {
                return { positionInClient: p };
            },
        }}
        title={p.tuberName + " " + p.id}
    ></BarItem>
    <!-- <button class="itemButton inset-brutal" on:click={()=>{
        weirdAddComp(p)
    }}>{p.tuberName + " " + p.id}</button> -->
    <!-- <p>
        {p.tuberName} : {p.long ? "(long)" : "(short)"} : value {p.returnValue}
    </p> -->
{/each}
<!-- {:else} -->
<!-- <p>component not found</p> -->
<!-- {/if} -->
