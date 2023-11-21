import * as Utils from '$lib/utils'
import { getContext, hasContext, setContext } from "svelte"

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
let cState = $state(as)
// export function getClientAppStateRune(){
//     console.log('getting state rune')
//     return {
//         get value(){
//             return s
//         },
//         set value(v){
//             s = v
//         }
//     }
// }
export let clientAppStateRune = {
    get value(){
        return cState
    },
    set value(v:ClientAppState){
        console.log('setting state')
        cState = v
    }
}




