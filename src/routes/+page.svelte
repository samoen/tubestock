<script lang="ts">
    import {
        chatMsgBroadcastSchema,
        type SendMsg,
        type SetName,
    } from "$lib/utils";
    import { onMount } from "svelte";
    import * as Utils from "$lib/utils";
    import { invalidateAll } from "$app/navigation";

    let signupInput: string;
    let msgInput: string;
    let tuberInput: string;
    let displayCount: string = "";
    let msgsFromServer: Utils.SavedChatMsg[] = [{ from: "noone", msgTxt: "hey" }];
    let userList: string[] = [];
    let tuberList: Utils.Tuber[] = [];
    let myNameFromServer: string | undefined = undefined;
    export let data: Utils.DataFirstLoad;

    onMount(async () => {
        // if (import.meta.env.MODE == "development") {
        //     await invalidateAll();
        // }
        console.log("onmount fired with ssr data " + JSON.stringify(data));
        if(data.username){
            myNameFromServer = data.username
        }

        if (source) {
            console.log("mounted with existing source, weird");
        }

        window.addEventListener('unload',()=>{
            console.log('window unload')
            source?.close()
        })
    });

    async function setName() {
        console.log(`set name ${signupInput}`);
        const toSend: SetName = {
            wantName: signupInput,
        };
        signupInput = "";
        const joincall = await fetch("/api/signup", {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        });
        if(!joincall.ok){
            return
        }
        const resp = await joincall.json()
        const welcome = Utils.welcomeSchema.safeParse(resp)
        if(!welcome.success)return
        myNameFromServer = welcome.data.yourName
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
    let source: EventSource | undefined = undefined;
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
        source.addEventListener("error", function(ev){
            console.log("source error ");
            this.close();
        });

        source.addEventListener("chatmsg", (ev) => {
            const parsed = chatMsgBroadcastSchema.safeParse(JSON.parse(ev.data));
            if (!parsed.success) {
                console.log("bad update from server");
                return;
            }
            console.log("got a chatmsg " + JSON.stringify(parsed.data));
            console.log("pushing new msg to list");
            msgsFromServer.unshift(parsed.data.newMsg);
            msgsFromServer = msgsFromServer;
        });

        source.addEventListener("userJoined", (e) => {
            const parsed = Utils.userJoinedSchema.safeParse(JSON.parse(e.data));
            if (!parsed.success) {
                console.log("bad update from server");
                return;
            }
            console.log("got user joined " + JSON.stringify(parsed.data));
            console.log("pushing new msg to list");
            userList.unshift(parsed.data.joinedUserName);
            userList = userList;
        });

        source.addEventListener("welcomeSubscriber", (e) => {
            const parsed = Utils.welcomeSubscriberSchema.safeParse(JSON.parse(e.data));
            if (!parsed.success) {
                console.log("bad update from server");
                return;
            }
            userList = parsed.data.users.map(u=>u.displayName);
            tuberList = parsed.data.tubers
            msgsFromServer = parsed.data.msgs
        });

        console.log("subscribed");
    }
    async function deleteUser(){
        let f = await fetch('/api/delete', { method: 'POST' });
		if (!f.ok) {
			console.log('failed delete hero request');
            return
		}
    }
    async function requestTube(){
        const toSend : Utils.TubeRequest = {
            channelName:tuberInput
        }
        let f = await fetch(
            '/api/tube',
            {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        });
		if (!f.ok) {
			console.log('failed request tube');
            return
		}
        const r = await f.json()
        const parsedResponse = Utils.tubeResponseSchema.safeParse(r)
        if(!parsedResponse.success){
            console.log('bad tube response')
            return
        }
        displayCount = parsedResponse.data.count.toString()

    }
</script>

<div class="topBar">
    <span>Tubestock</span>
</div>

<p>My name : {myNameFromServer}</p>
<button on:click={deleteUser}>delete user</button>
<br/>
<br/>
<input type='text' bind:value={tuberInput}>
<button on:click={requestTube}>get subscribers</button>
<div style="display: inline;">{displayCount}</div>
<br/>
<br/>

<button on:click={subscribe}>subscribe</button>

<input
    type="text"
    bind:value={signupInput}
    on:keydown={(event) => {
        if (!signupInput) {
            return;
        }
        if (event.key === "Enter") {
            setName();
            event.preventDefault();
        }
    }}
/>
<button type="button" on:click={setName} disabled={!signupInput}
    >Set Name</button
>

<h3>Chat</h3>
<div class="msgs">
    {#each msgsFromServer as m}
    <p>{m.from} : {m.msgTxt}</p>
    {/each}
</div>
<input
type="text"
bind:value={msgInput}
on:keydown={(event) => {
    if (!msgInput) {
        return;
    }
    if (event.key === "Enter") {
        sendMsg();
        event.preventDefault();
    }
}}
/>
<button type="button" on:click={sendMsg} disabled={!msgInput}>Send Msg</button>
<h3>Users</h3>
<div class="msgs">
    {#each userList as u}
    <p>{u}</p>
    {/each}
</div>
<h3>Tubers</h3>
<div class="msgs">
    {#each tuberList as t}
    <p>{t.channelName} : {t.count}</p>
    {/each}
</div>

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
        background-color: aqua;
    }
    .msgs {
        display: flex;
        flex-direction: column-reverse;
        height: 100px;
        overflow-y: auto;
        background-color: burlywood;
        margin:10px;
    }
</style>
