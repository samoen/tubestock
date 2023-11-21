<script lang="ts">
    import { getContext, onMount } from "svelte";
    import * as Utils from "$lib/utils";
    import * as ClientState from "$lib/client/clientState.svelte";
    import SimpleForm from "$lib/client/components/SimpleForm.svelte";
    import { z } from "zod";

    console.log("init base page");
    // let cState: ClientState.ClientAppState = getContext(
    //     ClientState.CLIENT_STATE_CTX
    // );
    let cState = ClientState.clientAppStateRune.value;

    // $effect(()=>{
    onMount(async () => {
        await subscribe();
        // console.log("onmount fired with ssr data " + JSON.stringify(data));
        console.log("eyewyudsfhgfdq");
    });
    // onMount(async () => {
    // if (import.meta.env.MODE == "development") {
    //     await invalidateAll();
    // }

    // cState = getContext('state')

    // if ($state.source) {
    //     console.log("mounted with existing source, weird");
    // }

    // });

    async function setName(inputTxt: string) {
        const toSend: Utils.SetNameRequest = {
            wantName: inputTxt,
        };
        const fSafe = await hitEndpoint(
            "setname",
            toSend,
            Utils.setNameResponseSchema
        );
        if (fSafe.failed) return;
        cState.myNameDisplay = fSafe.value.yourName;
    }

    async function sendMsg(chatInputTxt: string) {
        const toSend: Utils.SendMsgRequest = {
            msgTxt: chatInputTxt,
        };
        hitEndpoint("sendMsg", toSend, Utils.emptyObject);
    }

    async function deleteUser() {
        await hitEndpoint("delete", {}, Utils.emptyObject);
    }

    async function requestTuber(searchTxt: string) {
        const toSend: Utils.TubeRequest = {
            channelName: searchTxt,
        };
        await hitEndpoint("tube", toSend, Utils.tubeResponseSchema);
    }
    async function shortStockClicked() {
        if (!cState.selectedTuber) return;
        if (!cState.putStockAmountInput) return;
        const intVal = Number.parseInt(cState.putStockAmountInput);
        if (!intVal) {
            return;
        }
        await putStock(cState.selectedTuber.channelId, intVal, false);
    }

    async function longStockClicked() {
        if (!cState.selectedTuber) return;
        if (!cState.putStockAmountInput) return;
        const intVal = Number.parseInt(cState.putStockAmountInput);
        if (!intVal) {
            return;
        }
        await putStock(cState.selectedTuber.channelId, intVal, true);
    }
    async function putStock(channelId: string, amt: number, long: boolean) {
        const toSend: Utils.PutStockRequest = {
            channelId: channelId,
            amount: amt,
            long: long,
        };
        let resp = await hitEndpoint(
            "putstock",
            toSend,
            Utils.putStockResponseSchema
        );
        if (resp.failed) return;
        cState.putStockAmountInput = "";
        cState.idleStockDisplay = resp.value.idleStock;
        cState.positionsList = resp.value.positions;
    }
    function exitPositionClicked(positionId: string) {
        exitPosition(positionId);
    }
    async function exitPosition(positionId: string) {
        const toSend: Utils.ExitPositionRequest = {
            positionId: positionId,
        };
        let fSafe = await hitEndpoint(
            "exitposition",
            toSend,
            Utils.exitPositionResponseSchema
        );
        if (fSafe.failed) return;

        cState.idleStockDisplay = fSafe.value.idleStock;
        cState.positionsList = fSafe.value.positions;
    }

    async function updateTubers() {
        const toSend = {
            secret: "fakesecret",
        };
        await hitEndpoint("updatetubers", toSend, Utils.emptyObject);
    }

    async function hitEndpoint<T extends z.ZodTypeAny, V extends z.infer<T>>(
        endPoint: string,
        toSend: object,
        responseSchema: T
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
                const msg = bod["message"];
                console.log(`Endpoint ${endPoint} failed with message: ${msg}`);
                return {
                    failed: true,
                    error: new Error(msg),
                };
            }
            const parsed = responseSchema.safeParse(bod);
            if (!parsed.success) {
                console.log("parsed not succuss");
                return {
                    failed: true,
                    error: parsed.error,
                };
            }
            return {
                failed: false,
                value: parsed.data,
            };
        } catch (e) {
            console.log(`Endpoint ${endPoint} unknown failure: ${String(e)}`);
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
    export async function subscribe() {
        cState.loading = true;
        console.log("subscribing to events");
        if (cState.source != undefined) {
            // for some reason if we navigate back to this page the source fires but the ui doesnt update. so resubscribe
            // console.log("closing old source to resubscribe");
            // cState.source.close();
            // await new Promise((r) => setTimeout(r, 500));

            console.log(
                "already subscribed with status" + cState.source.readyState
            );
            cState.loading = false;
            return;
        }
        // window.onunload = () => {
        //     manualSourceError();
        // };
        // try {

        cState.source = new EventSource("/api/events");
        if (!cState.source) {
            console.log("source still undef after updated");
            return;
        }
        // } catch (e) {
        //     console.log("failed to source");
        //     console.log(e);
        //     return;
        // }

        cState.source.addEventListener("open", function (ev) {
            console.log("source opened");
            cState.loading = false;
        });
        cState.source.addEventListener("error", function (ev) {
            console.log("source error");
            // console.log('this readystate ' + this.readyState)
            // const sReady = source ? source.readyState : 'undefined'
            // console.log('source readystate ' + sReady)
            this.close();
            cState.source?.close();
            cState.source = undefined;
            // cState = cState
        });

        cState.source.addEventListener("chatmsg", (ev) => {
            console.log("got chatmsg event");
            const parsed = Utils.chatMsgBroadcastSchema.safeParse(
                JSON.parse(ev.data)
            );
            if (!parsed.success) {
                console.log("bad update from server");
                return;
            }
            cState.chatMsgsDisplay = [
                parsed.data.newMsg,
                ...cState.chatMsgsDisplay,
            ];
        });

        cState.source.addEventListener("userJoined", (e) => {
            const parsed = Utils.userOnClientSchema.safeParse(
                JSON.parse(e.data)
            );
            if (!parsed.success) {
                console.log("bad update from server");
                return;
            }
            console.log("got user joined " + JSON.stringify(parsed.data));
            cState.userList = [parsed.data, ...cState.userList];
        });

        cState.source.addEventListener("world", (e) => {
            const parsed = Utils.worldEventSchema.safeParse(JSON.parse(e.data));
            if (!parsed.success) {
                console.log(JSON.parse(e.data));
                console.log("bad welcome sub update from server");
                return;
            }
            if (parsed.data.users) {
                cState.userList = parsed.data.users;
            }
            if (parsed.data.tubers) {
                cState.tuberList = parsed.data.tubers;
            }
            if (parsed.data.msgs) {
                cState.chatMsgsDisplay = parsed.data.msgs.reverse();
            }
            if (parsed.data.positions) {
                cState.positionsList = parsed.data.positions;
            }
            if (parsed.data.yourName) {
                cState.myNameDisplay = parsed.data.yourName;
            }
            if (parsed.data.yourIdleStock !== undefined) {
                cState.idleStockDisplay = parsed.data.yourIdleStock;
            }
            cState = cState;
        });

        cState.source.addEventListener("tuberAdded", (e) => {
            const parsed = Utils.tuberSchema.safeParse(JSON.parse(e.data));
            if (!parsed.success) {
                console.log("bad tuber added update from server");
                return;
            }
            cState.tuberList = [parsed.data, ...cState.tuberList];
        });
    }
    export function manualSourceError() {
        cState.source?.dispatchEvent(new Event("error"));
    }
</script>

<!-- {#if cState} -->
{#if !cState.loading && (!cState.source || cState.source.readyState == 2)}
    <button on:click={subscribe}>open source</button>
{/if}
{#if cState.loading}
    <span> loading... </span>
{/if}
<button on:click={updateTubers}>update tubers</button>
<button
    on:click={() => {
        manualSourceError();
    }}>close source</button
>
<h3>User</h3>
<p>My name : {cState.myNameDisplay}</p>
<p>My stock : {cState.idleStockDisplay}</p>
<SimpleForm buttonLabel="Set Username" fire={setName} />
<br />
<button on:click={deleteUser}>delete user</button>
<br />
<br />
{#if cState.positionsList != undefined}
    <h3>Positions</h3>
    <div class="msgs">
        {#each cState.positionsList as p (p.positionId)}
            <div>
                <span>
                    {p.tuberName} : {p.amount} : {p.subsAtStart} : {p.long
                        ? "(long)"
                        : "(short)"} : returns {p.amount + p.returnValue}
                </span>
                <button
                    type="button"
                    disabled={cState.loading}
                    on:click={() => {
                        exitPositionClicked(p.positionId);
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
    {#each cState.chatMsgsDisplay as m (m.msgId)}
        <p>{m.fromUserName} : {m.msgTxt}</p>
    {/each}
</div>
<SimpleForm buttonLabel="Send" fire={sendMsg} />

<h3>Users</h3>
<div class="msgs">
    {#each cState.userList as u (u.publicId)}
        <p>{u.displayName}</p>
    {/each}
</div>
<h3>Tuber search</h3>
<SimpleForm buttonLabel="Search" fire={requestTuber} />
<h3>Tubers</h3>
<div class="msgs">
    {#each cState.tuberList as t (t.channelId)}
        <div>
            <span>{t.channelName} : {t.count}</span>
            <button type="button" on:click={() => (cState.selectedTuber = t)}
                >Select</button
            >
        </div>
    {/each}
</div>

{#if cState.selectedTuber}
    <h3>{cState.selectedTuber.channelName}</h3>
    <input
        type="number"
        bind:value={cState.putStockAmountInput}
        disabled={cState.loading}
    />
    <button
        type="button"
        on:click={longStockClicked}
        disabled={!cState.putStockAmountInput}>Long Stock</button
    >
    <button
        type="button"
        on:click={shortStockClicked}
        disabled={!cState.putStockAmountInput}>Short Stock</button
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
