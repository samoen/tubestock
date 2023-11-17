<script lang="ts">
    import {
        chatMsgBroadcastSchema,
        type SendMsgRequest,
        type SetNameRequest,
    } from "$lib/utils";
    import { onMount } from "svelte";
    import * as Utils from "$lib/utils";
    import * as ClientState from "$lib/client/clientState";
    import { invalidateAll } from "$app/navigation";
    import { derived, writable } from "svelte/store";
    import spinny from "$lib/client/svg/spinny.svg";
    import SubmitButton from "$lib/client/components/SimpleForm.svelte";
    import SimpleForm from "$lib/client/components/SimpleForm.svelte";
    import { z } from "zod";

    export let data: Utils.DataFirstLoad;

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
    let mounted = false;

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
        mounted = true;
    });

    async function setName(inputTxt: string) {
        const toSend: SetNameRequest = {
            wantName: inputTxt,
        };
        const fSafe = await hitEndpoint('setname',toSend,Utils.setNameResponseSchema)
        if(fSafe.failed)return
        myNameDisplay = fSafe.value.yourName;
    }

    async function sendMsg(chatInputTxt: string) {
        const toSend: SendMsgRequest = {
            msgTxt: chatInputTxt,
        };
        hitEndpoint('sendMsg',toSend,Utils.emptyObject)
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
            console.log("source error");
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
            if (parsed.data.users) {
                userList = parsed.data.users;
            }
            if (parsed.data.tubers) {
                tuberList = parsed.data.tubers;
            }
            if (parsed.data.msgs) {
                chatMsgsDisplay = parsed.data.msgs.reverse();
            }
            if (parsed.data.positions) {
                positionsList = parsed.data.positions;
            }
            if (parsed.data.yourName) {
                myNameDisplay = parsed.data.yourName;
            }
            if (parsed.data.yourIdleStock !== undefined) {
                idleStockDisplay = parsed.data.yourIdleStock;
            }
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
        loading = true
        await hitEndpoint('delete',{},Utils.emptyObject)
        loading = false
    }

    async function requestTuber(searchTxt: string) {
        loading = true
        const toSend: Utils.TubeRequest = {
            channelName: searchTxt,
        };
        await hitEndpoint('tube',toSend,Utils.tubeResponseSchema)
        loading = false
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
        let resp = await hitEndpoint('putstock',toSend,Utils.putStockResponseSchema)
        if(resp.failed)return
        idleStockDisplay = resp.value.idleStock;
        positionsList = resp.value.positions;
    }
    function exitPositionClicked(positionId: string) {
        loading = true;
        exitPosition(positionId);
        loading = false;
    }
    async function exitPosition(positionId: string) {
        const toSend: Utils.ExitPositionRequest = {
            positionId: positionId,
        };
        let fSafe = await hitEndpoint('exitposition',toSend,Utils.exitPositionResponseSchema)
        if(fSafe.failed)return
        
        idleStockDisplay = fSafe.value.idleStock;
        positionsList = fSafe.value.positions;
    }

    async function updateTubers() {
        const toSend = {
            secret: "fakesecret",
        };
        await hitEndpoint('updatetubers',toSend,Utils.emptyObject)
    }

    async function hitEndpoint<
        T extends z.ZodTypeAny, 
        V extends z.infer<T>
    >(
        endPoint: string,
        toSend: object,
        responseSchema : T
    ): Promise<Utils.SamResult<V>> {
        try {
            
            let fetched = await fetch(`/api/${endPoint}`, {
                method: "POST",
                body: JSON.stringify(toSend),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const bod = await fetched.json();
            if (!fetched.ok) {
                const msg = bod['message']
                console.log(`Endpoint ${endPoint} failed with message: ${msg}`)
                return {
                    failed:true,
                    error:new Error(msg)
                }
            }
            const parsed = responseSchema.safeParse(bod)
            if(!parsed.success){
                console.log('parsed not succuss')
                return{
                    failed:true,
                    error: parsed.error
                }
            }
            return {
                failed: false,
                value: parsed.data,
            };
        } catch (e) {
            console.log(`Endpoint ${endPoint} unknown failure: ${String(e)}`)
            return {
                failed: true,
                error: ((a: unknown) => {
                    if (a instanceof Error) {
                        return a;
                    }
                    return new Error(String(a));
                })(e),
            };
        }
    }
</script>

<svelte:window bind:scrollY={$windowScrollY} />

<div class="topBar" class:solid={$atTop} class:blurry={!$atTop}>
    <span>Tubestock</span>
</div>
{#if mounted && (!source || source.readyState == 2)}
    <button on:click={subscribe}>subscribe</button>
{/if}
<!-- {#if loading}
    <img src={spinny} alt='spinner'>
{/if} -->
<button on:click={updateTubers}>update tubers</button>
<h3>User</h3>
<p>My name : {myNameDisplay}</p>
<p>My stock : {idleStockDisplay}</p>
<SimpleForm buttonLabel="Set Username" fire={setName} />
<br />
<button on:click={deleteUser}>delete user</button>
<br />
<br />
<h3>Positions</h3>
<div class="msgs">
    {#each positionsList as p (p.positionId)}
        <div>
            <span>
                {p.tuberName} : {p.amount} : {p.subsAtStart} : {p.long
                    ? "(long)"
                    : "(short)"} : returns {p.amount + p.returnValue}
            </span>
            <button
                type="button"
                disabled={loading}
                on:click={() => {
                    exitPositionClicked(p.positionId);
                }}>exit</button
            >
        </div>
    {/each}
</div>
<br />
<br />

<h3>Chat</h3>
<div class="msgs">
    {#each chatMsgsDisplay as m}
        <p>{m.fromUserName} : {m.msgTxt}</p>
    {/each}
</div>
<SimpleForm buttonLabel="Send" fire={sendMsg} />
<h3>Users</h3>
<div class="msgs">
    {#each userList as u (u.publicId)}
        <p>{u.displayName}</p>
    {/each}
</div>
<h3>Tuber search</h3>
<SimpleForm buttonLabel="Search" fire={requestTuber} />
<h3>Tubers</h3>
<div class="msgs">
    {#each tuberList as t (t.channelId)}
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
