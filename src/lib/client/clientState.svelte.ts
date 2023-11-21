import * as Utils from '$lib/utils'
import { getContext, hasContext, setContext } from "svelte"
import * as z from 'zod'

console.log('running clientstate')

export type SimpleFormProps = {
    boundInputTxt: string,
    loading: boolean,
}
export type ClientAppState = {
    source: EventSource | undefined
    chatMsgsDisplay: Utils.SavedChatMsg[];
    userList: Utils.UserOnClient[];
    tuberList: Utils.Tuber[];
    positionsList: Utils.PositionWithReturnValue[] | undefined;
    myNameDisplay: string | undefined;
    idleStockDisplay: number | undefined;
    selectedTuber: Utils.Tuber | undefined;
    putStockAmountInput: string;
    loading: boolean;
}
export const CLIENT_STATE_CTX = 'state'

let stateSingleton : ReturnType<typeof stateFactory>;
export const getCState = () => stateSingleton ?? (stateSingleton = stateFactory());
const stateFactory = () => {
    const as: ClientAppState = {
        source: undefined,
        chatMsgsDisplay: [],
        userList: [],
        positionsList: undefined,
        tuberList: [],
        myNameDisplay: undefined,
        idleStockDisplay: undefined,
        selectedTuber: undefined,
        putStockAmountInput: "",
        loading: false,
    };
    let back = $state(as)
	return {
		get back () { return back; },
		set back (val) { 
            back = val
            // return value; 
        },
        dirty(){
            back = back
        }
	};
};


export async function setName(inputTxt: string) {
    const toSend: Utils.SetNameRequest = {
        wantName: inputTxt,
    };
    const fSafe = await hitEndpoint(
        "setname",
        toSend,
        Utils.setNameResponseSchema
    );
    if (fSafe.failed) return;
    console.log('got new name ' + fSafe.value.yourName)
    // let r = createStateRune()
    // r.value.myNameDisplay = fSafe.value.yourName; 
    // r.value = r.value
    stateSingleton.back.myNameDisplay = fSafe.value.yourName;
    stateSingleton.dirty()
    // cState = cState
    
}
export async function subscribe() {
    stateSingleton.back.loading = true;
    stateSingleton.dirty()
    console.log("subscribing to events");
    if (stateSingleton.back.source != undefined) {
        // for some reason if we navigate back to this page the source fires but the ui doesnt update. so resubscribe
        // console.log("closing old source to resubscribe");
        // stateSingleton.back.source.close();
        // await new Promise((r) => setTimeout(r, 500));

        console.log("already subscribed with status " + stateSingleton.back.source.readyState);
        stateSingleton.back.loading = false;
        stateSingleton.dirty()
        return;
    }
    // window.onunload = () => {
    //     manualSourceError();
    // };
    // try {

    stateSingleton.back.source = new EventSource("/api/events");
    if (!stateSingleton.back.source) {
        console.log("source still undef after updated");
        return;
    }
    // } catch (e) {
    //     console.log("failed to source");
    //     console.log(e);
    //     return;
    // }

    stateSingleton.back.source.addEventListener("open", function (ev) {
        console.log("source opened");
        stateSingleton.back.loading = false;
    });
    stateSingleton.back.source.addEventListener("error", function (ev) {
        console.log("source error");
        // console.log('this readystate ' + this.readyState)
        // const sReady = source ? source.readyState : 'undefined'
        // console.log('source readystate ' + sReady)
        this.close();
        stateSingleton.back.source?.close();
        stateSingleton.back.source = undefined;
        stateSingleton.back = stateSingleton.back
        // cState = cState
    });

    stateSingleton.back.source.addEventListener("chatmsg", (ev) => {
        console.log("got chatmsg event");
        const parsed = Utils.chatMsgBroadcastSchema.safeParse(
            JSON.parse(ev.data)
        );
        if (!parsed.success) {
            console.log("bad update from server");
            return;
        }
        stateSingleton.back.chatMsgsDisplay = [
            parsed.data.newMsg,
            ...stateSingleton.back.chatMsgsDisplay,
        ];

        stateSingleton.back = stateSingleton.back

    });

    stateSingleton.back.source.addEventListener("userJoined", (e) => {
        const parsed = Utils.userOnClientSchema.safeParse(
            JSON.parse(e.data)
        );
        if (!parsed.success) {
            console.log("bad update from server");
            return;
        }
        console.log("got user joined " + JSON.stringify(parsed.data));
        stateSingleton.back.userList = [parsed.data, ...stateSingleton.back.userList];
    });

    stateSingleton.back.source.addEventListener("world", (e) => {
        const parsed = Utils.worldEventSchema.safeParse(JSON.parse(e.data));
        if (!parsed.success) {
            console.log(JSON.parse(e.data));
            console.log("bad welcome sub update from server");
            return;
        }
        if (parsed.data.users) {
            stateSingleton.back.userList = parsed.data.users;
        }
        if (parsed.data.tubers) {
            stateSingleton.back.tuberList = parsed.data.tubers;
        }
        if (parsed.data.msgs) {
            stateSingleton.back.chatMsgsDisplay = parsed.data.msgs.reverse();
        }
        if (parsed.data.positions) {
            stateSingleton.back.positionsList = parsed.data.positions;
        }
        if (parsed.data.yourName) {
            stateSingleton.back.myNameDisplay = parsed.data.yourName;
        }
        if (parsed.data.yourIdleStock !== undefined) {
            stateSingleton.back.idleStockDisplay = parsed.data.yourIdleStock;
        }
        stateSingleton.dirty()
    });

    stateSingleton.back.source.addEventListener("tuberAdded", (e) => {
        const parsed = Utils.tuberSchema.safeParse(JSON.parse(e.data));
        if (!parsed.success) {
            console.log("bad tuber added update from server");
            return;
        }
        stateSingleton.back.tuberList = [parsed.data, ...stateSingleton.back.tuberList];
        stateSingleton.dirty()
    });
}
export function manualSourceError() {
    stateSingleton.back.source?.dispatchEvent(new Event("error"));
}


export async function sendMsg(chatInputTxt: string) {
    const toSend: Utils.SendMsgRequest = {
        msgTxt: chatInputTxt,
    };
    await hitEndpoint("sendMsg", toSend, Utils.emptyObject);
}

export async function deleteUser() {
    await hitEndpoint("delete", {}, Utils.emptyObject);
}

export async function requestTuber(searchTxt: string) {
    const toSend: Utils.TubeRequest = {
        channelName: searchTxt,
    };
    await hitEndpoint("tube", toSend, Utils.tubeResponseSchema);
}
export async function shortStockClicked() {
    if (!stateSingleton.back.selectedTuber) return;
    if (!stateSingleton.back.putStockAmountInput) return;
    const intVal = Number.parseInt(stateSingleton.back.putStockAmountInput);
    if (!intVal) {
        return;
    }
    await putStock(stateSingleton.back.selectedTuber.channelId, intVal, false);
}

export async function longStockClicked() {
    if (!stateSingleton.back.selectedTuber) return;
    if (!stateSingleton.back.putStockAmountInput) return;
    const intVal = Number.parseInt(stateSingleton.back.putStockAmountInput);
    if (!intVal) {
        return;
    }
    await putStock(stateSingleton.back.selectedTuber.channelId, intVal, true);
}
export async function putStock(channelId: string, amt: number, long: boolean) {
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
    stateSingleton.back.putStockAmountInput = "";
    stateSingleton.back.idleStockDisplay = resp.value.idleStock;
    stateSingleton.back.positionsList = resp.value.positions;
    stateSingleton.dirty()
}
export function exitPositionClicked(positionId: string) {
    exitPosition(positionId);
}
export async function exitPosition(positionId: string) {
    const toSend: Utils.ExitPositionRequest = {
        positionId: positionId,
    };
    let fSafe = await hitEndpoint(
        "exitposition",
        toSend,
        Utils.exitPositionResponseSchema
    );
    if (fSafe.failed) return;

    stateSingleton.back.idleStockDisplay = fSafe.value.idleStock;
    stateSingleton.back.positionsList = fSafe.value.positions;
    stateSingleton.dirty()
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




