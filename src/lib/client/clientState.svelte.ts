import * as Utils from '$lib/utils'
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
    putStockLoading:boolean;
    putStockChecked:boolean;
    subscribing: boolean;
}

let appState: ReturnType<typeof stateFactory>;
export const getAppState = () => appState ?? (appState = stateFactory());
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
        putStockLoading:false,
        putStockChecked:true,
        subscribing: false,
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
    // appState.update(mod => {
    //     mod.myNameDisplay = fSafe.value.yourName
    // })
    appState.value.myNameDisplay = fSafe.value.yourName;
    appState.dirty()
}

export async function subscribe() {
    appState.value.subscribing = true;
    appState.dirty()
    console.log("subscribing to events");
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
        console.log("got chatmsg event");
        const parsed = Utils.chatMsgBroadcastSchema.safeParse(
            JSON.parse(ev.data)
        );
        if (!parsed.success) {
            console.log("bad update from server");
            return;
        }
        appState.value.chatMsgsDisplay.unshift(parsed.data.newMsg)
        appState.dirty()
    });

    appState.value.source.addEventListener("userJoined", (e) => {
        const parsed = Utils.userOnClientSchema.safeParse(
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
        const parsed = Utils.worldEventSchema.safeParse(JSON.parse(e.data));
        if (!parsed.success) {
            console.log(JSON.parse(e.data));
            console.log("bad world update from server");
            return;
        }
        if (parsed.data.users) {
            appState.value.userList = parsed.data.users;
        }
        if (parsed.data.tubers) {
            appState.value.tuberList = parsed.data.tubers;
        }
        if (parsed.data.msgs) {
            appState.value.chatMsgsDisplay = parsed.data.msgs.reverse();
        }
        if (parsed.data.positions) {
            appState.value.positionsList = parsed.data.positions.reverse();
        }
        if (parsed.data.yourName) {
            appState.value.myNameDisplay = parsed.data.yourName;
        }
        if (parsed.data.yourIdleStock !== undefined) {
            appState.value.idleStockDisplay = parsed.data.yourIdleStock;
        }
        appState.dirty()
    });

    appState.value.source.addEventListener("tuberAdded", (e) => {
        const parsed = Utils.tuberSchema.safeParse(JSON.parse(e.data));
        if (!parsed.success) {
            console.log("bad tuber added update from server");
            return;
        }
        appState.value.tuberList.push(parsed.data)
        appState.dirty()
    });
}
export function manualSourceError() {
    appState.value.source?.dispatchEvent(new Event("error"));
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

export async function placeStockClicked(long:boolean, inTxt:string) {
    if (!appState.value.selectedTuber) return;
    // if (!appState.value.putStockAmountInput) return;
    // const intVal = Number.parseInt(appState.value.putStockAmountInput);
    const intVal = Number.parseInt(inTxt);
    if (!intVal) {
        return;
    }
    appState.value.putStockLoading = true
    appState.dirty()
    await putStock(appState.value.selectedTuber.channelId, intVal, long);
    appState.value.putStockLoading = false
    appState.dirty()
}

export async function putStock(channelId: string, amt: number, long: boolean) {
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
        console.log(resp.error.message)
        return
    };
    // appState.value.putStockAmountInput = "";
    appState.value.idleStockDisplay = resp.value.idleStock;
    appState.value.positionsList = resp.value.positions.reverse();
    appState.dirty()
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

    appState.value.idleStockDisplay = fSafe.value.idleStock;
    appState.value.positionsList = fSafe.value.positions.reverse();
    appState.dirty()
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




