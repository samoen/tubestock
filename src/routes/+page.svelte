<script lang="ts">
    import * as Svelte from "svelte";
    import * as Utils from "$lib/utils";
    import * as ClientState from "$lib/client/clientState.svelte";
    import SimpleForm from "$lib/client/components/SimpleForm.svelte";

    console.log("init base page");

    // $effect(()=>{ // await not allowed
    Svelte.onMount(async () => {
        await ClientState.subscribe();
        console.log("mounted");
    });

    const appState = ClientState.getAppState();
    let netWorth = $derived(myNetWorth());

    function myNetWorth(): number | undefined {
        if (appState.value.myIdleStock == undefined) return undefined;
        return calcNetWorth(
            appState.value.myIdleStock,
            appState.value.positionsList || [],
        );
    }

    function calcNetWorth(
        idle: number,
        positions: Utils.PositionInClient[],
    ): number | undefined {
        let res: number = idle;
        for (const pos of positions) {
            res += pos.returnValue;
        }
        return res;
    }
    async function placeStockClicked(
        inTxt: string,
        short: string,
    ): Promise<Utils.SamResult<{}>> {
        if (!appState.value.selectedTuber)
            return { failed: true, error: new Error("no tuber selected") };
        const intVal = Number.parseInt(inTxt);
        if (!intVal) {
            return {
                failed: true,
                error: new Error("Must be number greater than 0"),
            };
        }
        const shortBool = short == "true" ? true : false;
        // putStockLoading = true;
        const r = await ClientState.putStock(
            appState.value.selectedTuber.channelId,
            intVal,
            !shortBool,
        );
        // putStockLoading = false;
        return r;
    }

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

    async function restoreClicked(
        pIdTxt: string,
        nameTxt: string,
    ): Promise<Utils.SamResult<{}>> {
        let r = await ClientState.restoreUser(pIdTxt, nameTxt);
        return r;
    }
    async function gogo() {
        ClientState.hitEndpoint("rando", {}, Utils.emptyObject);
    }
    async function getEarlierMsgs() {
        const oldestMsg = appState.value.chatMsgs.reduce((oldest, current) => {
            return current.sentAt < oldest.sentAt ? current : oldest;
        }, appState.value.chatMsgs[0]);

        const toSend: Utils.HistoricalMsgsRequest = {
            startAtTime: oldestMsg.sentAt,
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
        appState.value.chatMsgs.push(...resp.value.msgs);
        appState.dirty();
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
</script>

<br />
<button
    on:click={async () => {
        console.log("dev");
        gogo();
    }}>dev</button
>
{#if !appState.value.subscribing && (!appState.value.source || appState.value.source.readyState == 2)}
    <button on:click={ClientState.subscribe}>open source</button>
{/if}
{#if appState.value.subscribing}
    <span> loading... </span>
{/if}
<button on:click={ClientState.updateTubers}>update tubers</button>
<button on:click={ClientState.manualSourceError}>close source</button>
<br />
<br />
<h3>User</h3>
<p>My name : {appState.value.myUsername}</p>
<p>Idle stock : {appState.value.myIdleStock}</p>
<p>Net worth : {netWorth}</p>
<p class="selectableText">Private Id : {appState.value.myPrivateId}</p>
<!-- fire={ClientState.setName}  -->
<SimpleForm
    buttonLabel="Update Display Name"
    onSubmit={ClientState.setName}
    inputs={[{ itype: "text", placeHold: "name" }]}
/>
<br />
<SimpleForm
    buttonLabel="Restore Session"
    onSubmit={restoreClicked}
    inputs={[
        { itype: "text", placeHold: "id" },
        { itype: "text", placeHold: "name" },
    ]}
/>
<br />
<button type="button" on:click={ClientState.deleteUser}>delete user</button>
<br />
<br />
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
            Net worth: {calcNetWorth(
                appState.value.selectedUser.idleStock,
                appState.value.selectedUser.positions,
            )}
        </p>
        {#each appState.value.selectedUser.positions as p (p.id)}
            <p>
                {p.tuberName} : {p.long ? "(long)" : "(short)"} : value {p.returnValue}
            </p>
        {/each}
        {#each ClientState.showInvitables() as i}
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
<br />
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
<br />
<br />
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
<h3>Public Chat</h3>
<div class="msgs">
    {#each appState.value.chatMsgs as m (m.id)}
        <p>{m.author.displayName} : {m.msgTxt}</p>
    {/each}
    <SimpleForm buttonLabel="Show Earlier" onSubmit={getEarlierMsgs}
    ></SimpleForm>
</div>
<SimpleForm
    buttonLabel="Send"
    onSubmit={async (msgTxt) => {
        return await ClientState.sendMsg(msgTxt);
    }}
    inputs={[{ itype: "text" }]}
/>
<br />
<br />
<h3>Tubers</h3>
<div class="msgs">
    {#each appState.value.tuberList as t (t.channelId)}
        <div>
            <span>{t.channelName} : {t.count}</span>
            <button
                type="button"
                class="itemButton"
                on:click={() => {
                    appState.value.selectedTuber = t;
                    appState.dirty();
                }}
            >
                Select
            </button>
        </div>
    {/each}
</div>
<SimpleForm
    buttonLabel="Search"
    onSubmit={ClientState.requestTuber}
    inputs={[{ itype: "text" }]}
/>

{#if appState.value.selectedTuber}
    <h3>{appState.value.selectedTuber.channelName}</h3>
    <SimpleForm
        buttonLabel="Place stock"
        onSubmit={placeStockClicked}
        inputs={[
            { itype: "number" },
            { itype: "checkbox", placeHold: "short" },
        ]}
    />
{/if}
{#if appState.value.positionsList != undefined}
    <br />
    <br />
    <h3>My Positions</h3>
    <div class="msgs">
        {#each appState.value.positionsList as p (p.id)}
            <div>
                <span>
                    {p.tuberName} : {p.amount} : {p.subsAtStart} : {p.long
                        ? "(long)"
                        : "(short)"} : returns {p.returnValue}
                </span>
                <!-- class="itemButton red" -->
                <SimpleForm
                    buttonLabel="exit"
                    onSubmit={async () => {
                        return await ClientState.exitPosition(p.id);
                    }}
                ></SimpleForm>
            </div>
        {/each}
    </div>
{/if}

<!-- {/if} -->
<style>
    .selectableText {
        user-select: text;
    }
    .msgs {
        display: flex;
        flex-direction: column-reverse;
        align-items: flex-start;
        height: 100px;
        overflow-y: auto;
        background-color: burlywood;
        margin-block: 5px;
    }
    .bigBold {
        font-weight: bold;
        font-size: 1.3rem;
    }
    .itemButton {
        border-radius: 6px;
        padding-inline: 4px;
        padding-block: 2px;
        cursor: pointer;
        font-weight: bold;
        background-color: yellow;
    }
    .red {
        background-color: red;
        color: white;
        border-color: white;
    }
    .getEarlier {
        max-width: max-content;
        border-radius: 5px;
        padding-inline: 5px;
        padding-block: 2px;
    }
</style>
