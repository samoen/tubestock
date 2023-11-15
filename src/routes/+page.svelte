<script lang="ts">
    import {
        chatMsgBroadcastSchema,
        type SendMsg,
        type SetName,
    } from "$lib/utils";
    import { onMount } from "svelte";
    import * as Utils from "$lib/utils";
    import { invalidateAll } from "$app/navigation";
    import { derived, writable } from "svelte/store";

    export let data: Utils.DataFirstLoad;

    let setNameInput: string;
    let msgInput: string;
    let tuberInput: string;
    let chatMsgsDisplay: Utils.SavedChatMsg[] = [];
    let userList: Utils.UserOnClient[] = [];
    let tuberList: Utils.Tuber[] = [];
    let positionsList: Utils.PositionWithReturnValue[] = [];
    let myNameDisplay: string | undefined = undefined;
    let idleStockDisplay: number | undefined = undefined;
    let selectedTuber: Utils.Tuber | undefined = undefined;
    let putStockAmountInput: string;
    let loading = false;
    let source: EventSource | undefined = undefined;

    export const windowScrollY = writable(0);
    export const atTop = derived(windowScrollY, ($s) => {
        return $s < 35;
    });

    onMount(async () => {
        // if (import.meta.env.MODE == "development") {
        //     await invalidateAll();
        // }
        console.log("onmount fired with ssr data " + JSON.stringify(data));

        if (source) {
            console.log("mounted with existing source, weird");
        }

        window.addEventListener("unload", () => {
            console.log("window unload");
            source?.close();
        });
        subscribe();
    });

    async function setName() {
        if (!setNameInput) return;
        const toSend: SetName = {
            wantName: setNameInput,
        };
        setNameInput = "";
        const joincall = await fetch("/api/setname", {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!joincall.ok) {
            return;
        }
        const resp = await joincall.json();
        const welcome = Utils.setNameResponseSchema.safeParse(resp);
        if (!welcome.success) return;
        myNameDisplay = welcome.data.yourName;
    }

    async function sendMsg() {
        const toSend: SendMsg = {
            msgTxt: msgInput,
        };
        msgInput = "";
        const joincall = await fetch("/api/sendMsg", {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    
    async function subscribe() {
        if (source != undefined) {
            console.log("resubscribing");
            source.close();
            // return;
        }
        try {
            source = new EventSource("/api/events");
        } catch (e) {
            console.log("failed to source");
            console.log(e);
            return;
        }
        source.addEventListener("error", function (ev) {
            console.log("source error ");
            this.close();
        });

        source.addEventListener("chatmsg", (ev) => {
            const parsed = chatMsgBroadcastSchema.safeParse(
                JSON.parse(ev.data)
            );
            if (!parsed.success) {
                console.log("bad update from server");
                return;
            }
            console.log("got a chatmsg " + JSON.stringify(parsed.data));
            console.log("pushing new msg to list");
            chatMsgsDisplay.unshift(parsed.data.newMsg);
            chatMsgsDisplay = chatMsgsDisplay;
        });

        source.addEventListener("userJoined", (e) => {
            const parsed = Utils.userOnClientSchema.safeParse(
                JSON.parse(e.data)
            );
            if (!parsed.success) {
                console.log("bad update from server");
                return;
            }
            console.log("got user joined " + JSON.stringify(parsed.data));
            console.log("pushing new msg to list");
            userList.unshift(parsed.data);
            userList = userList;
        });

        source.addEventListener("welcomeSubscriber", (e) => {
            const parsed = Utils.welcomeSubscriberSchema.safeParse(
                JSON.parse(e.data)
            );
            if (!parsed.success) {
                console.log(JSON.parse(e.data));
                console.log("bad welcome sub update from server");
                return;
            }
            userList = parsed.data.users;
            tuberList = parsed.data.tubers;
            chatMsgsDisplay = parsed.data.msgs.reverse();
            positionsList = parsed.data.positions;
            myNameDisplay = parsed.data.yourName;
            idleStockDisplay = parsed.data.yourIdleStock;
        });

        source.addEventListener("tuberAdded", (e) => {
            console.log("got new tuber ");
            const parsed = Utils.tuberSchema.safeParse(JSON.parse(e.data));
            if (!parsed.success) {
                console.log("bad tuber added update from server");
                return;
            }
            tuberList.unshift(parsed.data);
            tuberList = tuberList;
        });

        console.log("subscribed");
    }
    async function deleteUser() {
        let f = await fetch("/api/delete", { method: "POST" });
        if (!f.ok) {
            console.log("failed delete hero request");
            return;
        }
    }
    async function requestTubeClicked() {
        if(!tuberInput)return
        loading = true
        requestTuber()
        loading = false
    }
    async function requestTuber(){
        const toSend: Utils.TubeRequest = {
            channelName: tuberInput,
        };
        let f = await fetch("/api/tube", {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!f.ok) {
            console.log("failed request tube");
            return;
        }
        const r = await f.json();
        const parsedResponse = Utils.tubeResponseSchema.safeParse(r);
        if (!parsedResponse.success) {
            console.log("bad tube response");
            return;
        }
        // displayCount = parsedResponse.data.count.toString();
        tuberInput = ''
    }
    async function shortStockClicked() {
        if (!selectedTuber) return;
        if (!putStockAmountInput) return;
        const intVal = Number.parseInt(putStockAmountInput);
        if (!intVal) {
            return;
        }
        loading = true;
        await putStock(selectedTuber.channelId, intVal, false);
        loading = false;
        putStockAmountInput = "";
    }

    async function longStockClicked() {
        if (!selectedTuber) return;
        if (!putStockAmountInput) return;
        const intVal = Number.parseInt(putStockAmountInput);
        if (!intVal) {
            return;
        }
        loading = true;
        await putStock(selectedTuber.channelId, intVal, true);
        loading = false;
        putStockAmountInput = "";
    }
    async function putStock(channelId: string, amt: number, long: boolean) {
        const toSend: Utils.PutStockRequest = {
            channelId: channelId,
            amount: amt,
            long: long,
        };
        let f = await fetch("/api/putstock", {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!f.ok) {
            console.log("failed request putstock");
            return;
        }
        const r = await f.json();
        const parsedResponse = Utils.putStockResponseSchema.safeParse(r);
        if (!parsedResponse.success) {
            console.log("bad put stock response");
            return;
        }
        idleStockDisplay = parsedResponse.data.idleStock;
        positionsList = parsedResponse.data.positions;
    }
    function exitPositionClicked(id: string) {
        loading = true;
        exitPosition(id);
        loading = false;
    }
    async function exitPosition(id: string) {
        const toSend: Utils.ExitPositionRequest = {
            channelId: id,
        };
        let f = await fetch("/api/exitposition", {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!f.ok) {
            console.log("failed request exit position");
            return;
        }
        const r = await f.json();
        const parsedResponse = Utils.exitPositionResponseSchema.safeParse(r);
        if (!parsedResponse.success) {
            console.log("bad exit position response");
            return;
        }
        idleStockDisplay = parsedResponse.data.idleStock;
        positionsList = parsedResponse.data.positions;
    }
    async function updateTubers() {
        const toSend = {
            secret: "fakesecret",
        };
        let f = await fetch("/api/updatetubers", {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!f.ok) {
            console.log("failed request updatetubers");
            return;
        }
    }
    function inputSubmit(
        event: KeyboardEvent & {
            currentTarget: EventTarget & HTMLInputElement;
        },
        toFire: () => {}
    ) {
        if (event.key === "Enter") {
            toFire();
            event.preventDefault();
        }
    }
</script>

<svelte:window bind:scrollY={$windowScrollY} />

<div class="topBar" class:solid={$atTop} class:blurry={!$atTop}>
    <span>Tubestock</span>
</div>
<button on:click={updateTubers}>update tubers</button>
<h3>User</h3>
<p>My name : {myNameDisplay}</p>
<p>My stock : {idleStockDisplay}</p>
<input
    type="text"
    bind:value={setNameInput}
    on:keydown={(event) => {
        inputSubmit(event, setName);
        // if (!setNameInput) {
        //     return;
        // }
        // if (event.key === "Enter") {
        //     setName();
        //     event.preventDefault();
        // }
    }}
/>
<button type="button" on:click={setName} disabled={!setNameInput}
    >Set Name</button
>
<br />
<button on:click={deleteUser}>delete user</button>
<br />
<br />
<h3>Positions</h3>
<div class="msgs">
    {#each positionsList as p (p.tuberId)}
        <div>
            <span>
                {p.tuberName} : {p.amount} : {p.subsAtStart} : {p.long
                    ? "(long)"
                    : "(short)"} : returns {p.amount + p.returnValue}
            </span>
            <button
                type="button"
                on:click={() => {
                    exitPositionClicked(p.tuberId);
                }}>exit</button
            >
        </div>
    {/each}
</div>
<br />
<br />

<!-- <button on:click={subscribe}>subscribe</button> -->

<h3>Chat</h3>
<div class="msgs">
    {#each chatMsgsDisplay as m}
        <p>{m.from} : {m.msgTxt}</p>
    {/each}
</div>
<input
    type="text"
    bind:value={msgInput}
    on:keydown={(event) => {
        inputSubmit(event, sendMsg);
    }}
/>
<button type="button" on:click={sendMsg} disabled={!msgInput}>Send Msg</button>
<h3>Users</h3>
<div class="msgs">
    {#each userList as u (u.publicId)}
        <p>{u.displayName}</p>
    {/each}
</div>
<h3>Tuber search</h3>
<input 
    type="text" 
    bind:value={tuberInput} 
    on:keydown={(event)=>inputSubmit(event,requestTubeClicked)}
    disabled={loading}

    />
<button on:click={requestTubeClicked} disabled={!tuberInput}>Search</button>
<h3>Tubers</h3>
<div class="msgs">
    {#each tuberList as t}
        <div>
            <span>{t.channelName} : {t.count}</span>
            <button type="button" on:click={() => (selectedTuber = t)}
                >Select</button
            >
        </div>
    {/each}
</div>

{#if selectedTuber}
    <h3>{selectedTuber.channelName}</h3>
    <input type="number" bind:value={putStockAmountInput} disabled={loading} />
    <button
        type="button"
        on:click={longStockClicked}
        disabled={loading || !putStockAmountInput}>Long Stock</button
    >
    <button
        type="button"
        on:click={shortStockClicked}
        disabled={loading || !putStockAmountInput}>Short Stock</button
    >
{/if}

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
    .topBar {
        position: sticky;
        top: 0px;
        border: 2px solid black;
    }
    .msgs {
        display: flex;
        flex-direction: column-reverse;
        height: 100px;
        overflow-y: auto;
        background-color: burlywood;
        margin: 10px;
    }
    .solid {
        background-color: pink;
    }
    .blurry {
        background-color: transparent;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
    }
</style>
