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
    // let putStockChecked = $state(false);
    // let putStockLoading = $state(false);

    function myNetWorth(): number | undefined {
        if (appState.value.myIdleStock == undefined) return undefined;
        if (!appState.value.positionsList) {
            return undefined;
        }
        return calcNetWorth(
            appState.value.myIdleStock,
            appState.value.positionsList
        );
    }

    function calcNetWorth(
        idle: number,
        positions: Utils.PositionWithReturnValue[]
    ): number | undefined {
        let res: number = idle;
        for (const pos of positions) {
            res += pos.returnValue;
        }
        return res;
    }
    async function placeStockClicked(
        inTxt: string,
        short: string
    ): Promise<Utils.SamResult<{}>> {
        if (!appState.value.selectedTuber)
            return { failed: true, error: new Error("no tuber selected") };
        const intVal = Number.parseInt(inTxt);
        if (!intVal) {
            return { failed: true, error: new Error("must be number") };
        }
        const shortBool = short == "true" ? true : false;
        // putStockLoading = true;
        const r = await ClientState.putStock(
            appState.value.selectedTuber.channelId,
            intVal,
            !shortBool
        );
        // putStockLoading = false;
        return r;
    }

    let exitPositionLoading = $state(false);
    async function exitPositionClicked(positionId: string) {
        exitPositionLoading = true;
        await ClientState.exitPosition(positionId);
        exitPositionLoading = false;
    }

    async function restoreClicked(
        pIdTxt: string,
        nameTxt: string
    ): Promise<Utils.SamResult<{}>> {
        let r = await ClientState.restoreUser(pIdTxt, nameTxt);
        return r;
    }
</script>

<button
    on:click={async () => {
        console.log("dev");
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
<h3>User</h3>
<p>My name : {appState.value.myUsername}</p>
<p>Idle stock : {appState.value.myIdleStock}</p>
<p>Net worth : {netWorth}</p>
<p class="selectableText">Private Id : {appState.value.myPrivateId}</p>
<!-- fire={ClientState.setName}  -->
<SimpleForm
    buttonLabel="Update Display Name"
    coolfire={ClientState.setName}
    things={[{ itype: "text", placeHold: "name" }]}
/>
<br />
<SimpleForm
    buttonLabel="Restore Session"
    coolfire={restoreClicked}
    things={[
        { itype: "text", placeHold: "id" },
        { itype: "text", placeHold: "name" },
    ]}
/>
<br />
<button on:click={ClientState.deleteUser}>delete user</button>
<br />
<br />
<h3>Chat</h3>
<div class="msgs">
    {#each appState.value.chatMsgs as m (m.msgId)}
        <p>{m.fromUserName} : {m.msgTxt}</p>
    {/each}
</div>
<SimpleForm
    buttonLabel="Send"
    coolfire={ClientState.sendMsg}
    things={[{ itype: "text" }]}
/>
<br />
<br />
<h3>Users</h3>
<div class="msgs">
    {#each appState.value.userList as u (u.publicId)}
        <div>
            <span>{u.displayName}</span>
            <button
                class="itemButton yellow"
                on:click={() => {
                    appState.value.selectedUser = u;
                    appState.dirty();
                }}>details</button
            >
        </div>
    {/each}
</div>
{#if appState.value.selectedUser}
    <h4>
        {appState.value.selectedUser.displayName} : {calcNetWorth(
            appState.value.selectedUser.idleStock,
            appState.value.selectedUser.positions
        )}
    </h4>
    {#each appState.value.selectedUser.positions as p (p.positionId)}
        <p>
            {p.tuberName} : {p.long
                ? "(long)"
                : "(short)"} : value {p.returnValue}
        </p>
    {/each}
{/if}
<br />
<h3>Tubers</h3>
<SimpleForm
    buttonLabel="Search"
    coolfire={ClientState.requestTuber}
    things={[{ itype: "text" }]}
/>
<div class="msgs">
    {#each appState.value.tuberList as t (t.channelId)}
        <div>
            <span>{t.channelName} : {t.count}</span>
            <button
                class="itemButton yellow"
                type="button"
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

{#if appState.value.selectedTuber}
    <h3>{appState.value.selectedTuber.channelName}</h3>
    <SimpleForm
        buttonLabel="Place stock"
        coolfire={placeStockClicked}
        inputType="number"
        things={[
            { itype: "number" },
            { itype: "checkbox", placeHold: "short" },
        ]}
    />
{/if}
{#if appState.value.positionsList != undefined}
    <h3>Positions</h3>
    <div class="msgs">
        {#each appState.value.positionsList as p (p.positionId)}
            <div>
                <span>
                    {p.tuberName} : {p.amount} : {p.subsAtStart} : {p.long
                        ? "(long)"
                        : "(short)"} : returns {p.returnValue}
                </span>
                <button
                    class="itemButton red"
                    type="button"
                    disabled={exitPositionLoading}
                    on:click={() => {
                        exitPositionClicked(p.positionId);
                    }}>Exit</button
                >
            </div>
        {/each}
    </div>
{/if}

<!-- {/if} -->
<style>
    :global(body) {
        background-color: aliceblue;
        /* padding-inline: 5px; */
        /* padding: 0; */
        /* margin: 0; */
        /* word-wrap: break-word; */
    }
    :global(*) {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        user-select: none;
        touch-action: manipulation;
        font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS",
            sans-serif;
    }

    .selectableText {
        user-select: text;
    }
    .msgs {
        display: flex;
        flex-direction: column-reverse;
        height: 100px;
        overflow-y: auto;
        background-color: burlywood;
        margin: 10px;
    }
    .itemButton {
        border-radius: 6px;
        padding-inline: 4px;
        padding-block: 2px;
        cursor: pointer;
        font-weight: bold;
    }
    .red {
        background-color: red;
        color: white;
        border-color: white;
    }
    .yellow {
        background-color: yellow;
    }
</style>
