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
</script>

<button
    on:click={async () => {
        console.log("dev");
    }}>dev</button
>
{#if !appState.value.loading && (!appState.value.source || appState.value.source.readyState == 2)}
    <button on:click={ClientState.subscribe}>open source</button>
{/if}
{#if appState.value.loading}
    <span> loading... </span>
{/if}
<button on:click={ClientState.updateTubers}>update tubers</button>
<button on:click={ClientState.manualSourceError}>close source</button>
<h3>User</h3>
<p>My name : {appState.value.myNameDisplay}</p>
<p>Idle stock : {appState.value.idleStockDisplay}</p>
<SimpleForm buttonLabel="Set Username" fire={ClientState.setName} />
<br />
<button on:click={ClientState.deleteUser}>delete user</button>
<br />
<br />
<h3>Chat</h3>
<div class="msgs">
    {#each appState.value.chatMsgsDisplay as m (m.msgId)}
        <p>{m.fromUserName} : {m.msgTxt}</p>
    {/each}
</div>
<SimpleForm buttonLabel="Send" fire={ClientState.sendMsg} />
<br />
<br />
<h3>Users</h3>
<div class="msgs">
    {#each appState.value.userList as u (u.publicId)}
        <p>{u.displayName}</p>
    {/each}
</div>
<h3>Tubers</h3>
<SimpleForm buttonLabel="Search" fire={ClientState.requestTuber} />
<div class="msgs">
    {#each appState.value.tuberList as t (t.channelId)}
        <div>
            <span>{t.channelName} : {t.count}</span>
            <button
                type="button"
                on:click={() => (appState.value.selectedTuber = t)}
            >
                Select
            </button>
        </div>
    {/each}
</div>

{#if appState.value.selectedTuber}
    <h3>{appState.value.selectedTuber.channelName}</h3>
    <input
        type="number"
        bind:value={appState.value.putStockAmountInput}
        disabled={appState.value.loading}
    />
    <button
        type="button"
        on:click={ClientState.longStockClicked}
        disabled={!appState.value.putStockAmountInput}>Long Stock</button
    >
    <button
        type="button"
        on:click={ClientState.shortStockClicked}
        disabled={!appState.value.putStockAmountInput}>Short Stock</button
    >
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
                    type="button"
                    disabled={appState.value.loading}
                    on:click={() => {
                        ClientState.exitPositionClicked(p.positionId);
                    }}>exit</button
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

    .msgs {
        display: flex;
        flex-direction: column-reverse;
        height: 100px;
        overflow-y: auto;
        background-color: burlywood;
        margin: 10px;
    }
</style>
