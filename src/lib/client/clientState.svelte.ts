import * as Utils from '$lib/utils'
import * as z from 'zod'
import User from '$lib/client/components/User.svelte'
import Users from '$lib/client/components/Users.svelte'
import Rooms from './components/Rooms.svelte'

console.log('running clientstate')

export type SimpleFormProps = {
    boundInputTxt: string,
    loading: boolean,
}
export type ClientAppState = {
    source: EventSource | undefined
    chatMsgs: Utils.ChatMsgOnClient[];
    userList: Utils.OtherUserOnClient[];
    tuberList: Utils.TuberInClient[];
    roomInvites:Utils.InviteOnClient[];
    displayingInvites:number[];
    positionsList: Utils.PositionInClient[] | undefined;
    myUsername: string | undefined;
    myIdleStock: number | undefined;
    myPrivateId: string | undefined;
    myDbId:number|undefined;
    selectedTuber: Utils.TuberInClient | undefined;
    selectedUser: Utils.OtherUserOnClient | undefined;
    subscribing: boolean;
    compies:any[]
}


const stateFactory = () => {
    const as: ClientAppState = {
        source: undefined,
        chatMsgs: [],
        userList: [],
        positionsList: undefined,
        tuberList: [],
        roomInvites:[],
        displayingInvites:[],
        // joinedRooms:[],
        myUsername: undefined,
        myIdleStock: undefined,
        myPrivateId: undefined,
        myDbId:undefined,
        selectedTuber: undefined,
        selectedUser:undefined,
        subscribing: false,
        compies: [User,Users,Rooms],
    };
    let value = $state(as)
    return {
        get value() { return value; },
        // set back (val) { 
        // back = val
        // return value; 
        // },
        dirty() {
            value = value
        },
        update(mod: (s: ClientAppState) => void) {
            mod(value)
            this.dirty()
        }
    };
};


export function getAppState(){
    if(appState)return appState
    appState = stateFactory()
    return appState;
}
let appState: ReturnType<typeof stateFactory>;

export function showDisplayingInvites() : Utils.InviteOnClient[]{
    // console.log('recalc show invites to show chat ui')
    let result : Utils.InviteOnClient[] = []
    const toRemove: number[] = []
    for(const r of appState.value.displayingInvites){
        const found = appState.value.roomInvites.findLast(f=>f.id == r)
        if(!found || !found.joined){
            toRemove.push(r)
            continue
        }
        result.push(found)
    }
    appState.value.displayingInvites = appState.value.displayingInvites.filter(i=>!toRemove.includes(i))
    return result
}

export async function setName(inputTxt: string) : Promise<Utils.SamResult<unknown>>{
    const toSend: Utils.SetNameRequest = {
        wantName: inputTxt,
    };
    const fSafe = await hitEndpoint(
        "setname",
        toSend,
        Utils.setNameResponseSchema
    );
    if (fSafe.failed) return fSafe;
    appState.value.myUsername = fSafe.value.yourName;
    appState.dirty()
    return fSafe
}

export async function subscribe() {
    console.log("maybe subscribing to events");
    if (appState.value.source != undefined) {
        // for some reason if we navigate back to this page the source fires but the ui doesnt update. so resubscribe
        // console.log("closing old source to resubscribe");
        // stateSingleton.value.source.close();
        // await new Promise((r) => setTimeout(r, 500));

        console.log("already subscribed with status " + appState.value.source.readyState);
        appState.value.subscribing = false;
        appState.dirty()
        return;
    }
    // window.onunload = () => {
        //     manualSourceError();
        // };
        
        // try {
    appState.value.subscribing = true;
    appState.dirty()
    appState.value.source = new EventSource("/api/events");
    if (!appState.value.source) {
        console.log("source still undef after updated");
        return;
    }
    // } catch (e) {
    //     console.log("failed to source");
    //     console.log(e);
    //     return;
    // }

    appState.value.source.addEventListener("open", function (ev) {
        console.log("source opened");
        appState.value.subscribing = false;
    });
    appState.value.source.addEventListener("error", function (ev) {
        console.log("source error");
        this.close();
        appState.value.source?.close();
        appState.value.source = undefined;
        appState.dirty()
    });

    appState.value.source.addEventListener("chatmsg", (ev) => {
        const parsed = Utils.addMsgEventSchema.safeParse(
            JSON.parse(ev.data)
            );
        // console.log("got chatmsg event " + JSON.stringify(parsed));
        if (!parsed.success) {
            console.log("bad update from server");
            return;
        }
        if(!parsed.data.roomId){
            appState.value.chatMsgs.unshift(parsed.data.msg)
        }else{
            const foundInvite = appState.value.roomInvites.findLast(ri=>ri.toRoom.id == parsed.data.roomId)
            if(foundInvite){
                foundInvite.toRoom.msgs.unshift(parsed.data.msg)
            }
        }
        appState.dirty()
    });

    appState.value.source.addEventListener("userJoined", (e) => {
        const parsed = Utils.otherUserOnClientSchema.safeParse(
            JSON.parse(e.data)
        );
        if (!parsed.success) {
            console.log("bad update from server");
            return;
        }
        console.log("got user joined " + JSON.stringify(parsed.data));
        appState.value.userList.unshift(parsed.data)
    });

    appState.value.source.addEventListener("world", (e) => {
        console.log('got world event')
        const parsed = Utils.worldEventSchema.safeParse(JSON.parse(e.data));
        if (!parsed.success) {
            console.log(JSON.parse(e.data));
            console.log("bad world update from server");
            return;
        }
        receiveWorldEvent(parsed.data)
    });

    appState.value.source.addEventListener("tuberAdded", (e) => {
        const parsed = Utils.tuberInClientSchema.safeParse(JSON.parse(e.data));
        if (!parsed.success) {
            console.log("bad tuber added update from server");
            return;
        }
        appState.value.tuberList.push(parsed.data)
        appState.dirty()
    });
}

export function calcNetWorth(
    idle: number,
    positions: Utils.PositionInClient[],
): number | undefined {
    let res: number = idle;
    for (const pos of positions) {
        res += pos.returnValue;
    }
    return res;
}

export function receiveWorldEvent(we:Utils.WorldEvent){
    if (we.users) {
        appState.value.userList = we.users;
    }
    if (we.tubers) {
        appState.value.tuberList = we.tubers;
    }
    if (we.msgs) {
        appState.value.chatMsgs = we.msgs;
    }
    if (we.positions) {
        console.log('got positions ' + JSON.stringify(we.positions))
        appState.value.positionsList = we.positions;
    }
    if (we.roomInvites) {
        appState.value.roomInvites = we.roomInvites;
    }
    if (we.yourName) {
        appState.value.myUsername = we.yourName;
    }
    if (we.yourIdleStock !== undefined) {
        appState.value.myIdleStock = we.yourIdleStock;
    }
    if (we.yourPrivateId !== undefined) {
        appState.value.myPrivateId = we.yourPrivateId;
    }
    if (we.yourDbId !== undefined) {
        appState.value.myDbId = we.yourDbId;
    }
    appState.dirty()
}

export function manualSourceError() {
    appState.value.source?.dispatchEvent(new Event("error"));
}


export async function sendMsg(chatInputTxt: string, toRoom:number|undefined = undefined) : Promise<Utils.SamResult<{}>> {
    const toSend: Utils.SendMsgRequest = {
        msgTxt: chatInputTxt,
    };
    if(toRoom != undefined){
        toSend.toRoomId = toRoom
    }
    let r = await hitEndpoint("sendMsg", toSend, Utils.emptyObject);
    return r
}

export async function deleteUser() {
    await hitEndpoint("delete", {}, Utils.emptyObject);
}

export async function requestTuber(searchTxt: string) : Promise<Utils.SamResult<{}>> {
    const toSend: Utils.TubeRequest = {
        channelName: searchTxt,
    };
    let r = await hitEndpoint("tube", toSend, Utils.tubeResponseSchema);
    return r
}



export async function putStock(channelId: string, amt: number, long: boolean) : Promise<Utils.SamResult<Utils.PutStockResponse>> {
    const toSend: Utils.PutStockRequest = {
        channelId: channelId,
        amount: amt,
        long: long,
    };
    console.log('putstock req ' + JSON.stringify(toSend))
    let resp = await hitEndpoint(
        "putstock",
        toSend,
        Utils.putStockResponseSchema
    );
    if (resp.failed) {
        return resp
    };
    appState.value.myIdleStock = resp.value.idleStock;
    appState.value.positionsList = resp.value.positions;
    appState.dirty()
    return resp
}

export async function exitPosition(positionId: number) : Promise< Utils.SamResult<Utils.ExitPositionResponse>> {
    const toSend: Utils.ExitPositionRequest = {
        positionId: positionId,
    };
    let fSafe = await hitEndpoint(
        "exitposition",
        toSend,
        Utils.exitPositionResponseSchema
    );
    if (fSafe.failed) return fSafe;

    appState.value.myIdleStock = fSafe.value.idleStock;
    appState.value.positionsList = fSafe.value.positions;
    appState.dirty()
    return fSafe
}

export async function restoreUser(pId:string,displayName: string) : Promise<Utils.SamResult<{}>> {
    const toSend: Utils.RestoreRequest = {
        displayName: displayName,
        privateId:pId,
    };
    let res = await hitEndpoint(
        "restore",
        toSend,
        Utils.emptyObject
    );
    if (res.failed) return res;
    
    manualSourceError()
    subscribe()
    return res
}

export async function updateTubers() {
    const toSend = {
        secret: "fakesecret",
    };
    await hitEndpoint("updatetubers", toSend, Utils.emptyObject);
}

export async function hitEndpoint<T extends z.ZodTypeAny, V extends z.infer<T>>(
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




