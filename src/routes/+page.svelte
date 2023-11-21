<script lang="ts">
    import * as Svelte from "svelte";
    import * as Utils from "$lib/utils";
    import * as ClientState from "$lib/client/clientState.svelte";
    import SimpleForm from "$lib/client/components/SimpleForm.svelte";

    console.log("init base page");

    // $effect(()=>{
    Svelte.onMount(async () => {
        await ClientState.subscribe();
        // console.log("onmount fired with ssr data " + JSON.stringify(data));
    });
    // onMount(async () => {
    // if (import.meta.env.MODE == "development") {
    //     await invalidateAll();
    // }

    const sobj = ClientState.getCState();
</script>

<!-- {#if sobj.back} -->
<button
    on:click={async () => {
        console.log('dev')
    }}>dev</button
>
{#if !sobj.back.loading && (!sobj.back.source || sobj.back.source.readyState == 2)}
    <button on:click={ClientState.subscribe}>open source</button>
{/if}
{#if sobj.back.loading}
    <span> loading... </span>
{/if}
<button on:click={ClientState.updateTubers}>update tubers</button>
<button
    on:click={() => {
        ClientState.manualSourceError();
    }}>close source</button
>
<h3>User</h3>
<p>My name : {sobj.back.myNameDisplay}</p>
<p>My stock : {sobj.back.idleStockDisplay}</p>
<SimpleForm buttonLabel="Set Username" fire={ClientState.setName} />
<br />
<button on:click={ClientState.deleteUser}>delete user</button>
<br />
<br />
{#if sobj.back.positionsList != undefined}
    <h3>Positions</h3>
    <div class="msgs">
        {#each sobj.back.positionsList as p (p.positionId)}
            <div>
                <span>
                    {p.tuberName} : {p.amount} : {p.subsAtStart} : {p.long
                        ? "(long)"
                        : "(short)"} : returns {p.amount + p.returnValue}
                </span>
                <button
                    type="button"
                    disabled={sobj.back.loading}
                    on:click={() => {
                        ClientState.exitPositionClicked(p.positionId);
                    }}>exit</button
                >
            </div>
        {/each}
    </div>
{/if}
<br />
<br />
<h3>Chat</h3>
<div class="msgs">
    {#each sobj.back.chatMsgsDisplay as m (m.msgId)}
        <p>{m.fromUserName} : {m.msgTxt}</p>
    {/each}
</div>
<SimpleForm buttonLabel="Send" fire={ClientState.sendMsg} />

<h3>Users</h3>
<div class="msgs">
    {#each sobj.back.userList as u (u.publicId)}
        <p>{u.displayName}</p>
    {/each}
</div>
<h3>Tuber search</h3>
<SimpleForm buttonLabel="Search" fire={ClientState.requestTuber} />
<h3>Tubers</h3>
<div class="msgs">
    {#each sobj.back.tuberList as t (t.channelId)}
        <div>
            <span>{t.channelName} : {t.count}</span>
            <button type="button" on:click={() => (sobj.back.selectedTuber = t)}
                >Select</button
            >
        </div>
    {/each}
</div>

{#if sobj.back.selectedTuber}
    <h3>{sobj.back.selectedTuber.channelName}</h3>
    <input
        type="number"
        bind:value={sobj.back.putStockAmountInput}
        disabled={sobj.back.loading}
    />
    <button
        type="button"
        on:click={ClientState.longStockClicked}
        disabled={!sobj.back.putStockAmountInput}>Long Stock</button
    >
    <button
        type="button"
        on:click={ClientState.shortStockClicked}
        disabled={!sobj.back.putStockAmountInput}>Short Stock</button
    >
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
