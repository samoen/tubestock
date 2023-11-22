
import * as z from 'zod'



export const safeString = z.string().min(1).max(255)

export const emptyObject = z.object({})

export const setNameRequestSchema = z.object({
    wantName: safeString
})
export type SetNameRequest = z.infer<typeof setNameRequestSchema>

export const setNameResponseSchema = z.object({
    yourName: z.string(),
})
export type SetNameResponse = z.infer<typeof setNameResponseSchema>

export const restoreRequestSchema = z.object({
    displayName: z.string(),
    privateId:z.string(),
})
export type RestoreRequest = z.infer<typeof restoreRequestSchema>


export const sendMsgRequestSchema = z.object({
    msgTxt: safeString
})
export type SendMsgRequest = z.infer<typeof sendMsgRequestSchema>

export const savedChatMsgSchema = z.object({
    msgId:z.string(),
    msgTxt: z.string(),
    fromUserName: z.string(),
})

export type SavedChatMsg = z.infer<typeof savedChatMsgSchema>

export const chatMsgBroadcastSchema = z.object({
    // yourName:z.string(),
    newMsg: savedChatMsgSchema
})
export type ChatMsgBroadcast = z.infer<typeof chatMsgBroadcastSchema>



export const tubeRequestSchema = z.object({
    channelName: z.string()
})
export type TubeRequest = z.infer<typeof tubeRequestSchema>


export const tubeResponseSchema = z.object({
    count: z.number()
})
export type TubeResponse = z.infer<typeof tubeResponseSchema>

export const putStockRequestSchema = z.object({
    channelId: z.string().min(1).max(255),
    amount: z.number(),
    long: z.boolean(),
})
export type PutStockRequest = z.infer<typeof putStockRequestSchema>

export const exitPositionRequestSchema = z.object({
    positionId:z.string(),
})
export type ExitPositionRequest = z.infer<typeof exitPositionRequestSchema>

export const positionSchema = z.object({
    positionId:z.string(),
    tuberId: z.string(),
    tuberName: z.string(),
    amount: z.number(),
    subsAtStart: z.number(),
    long: z.boolean(),
})
export type Position = z.infer<typeof positionSchema>
export const positionWithReturnValueSchema = z.intersection(
    positionSchema,
    z.object({
        returnValue: z.number()
    })
)
export type PositionWithReturnValue = z.infer<typeof positionWithReturnValueSchema>

export const exitPositionResponseSchema = z.object({
    idleStock: z.number(),
    positions: z.array(positionWithReturnValueSchema),
})
export type ExitPositionResponse = z.infer<typeof exitPositionResponseSchema>

export const positionUpdateEventSchema = z.object({
    positions:z.array(positionWithReturnValueSchema)
})

export const putStockResponseSchema = z.object({
    idleStock: z.number(),
    positions: z.array(positionWithReturnValueSchema),
})
export type PutStockResponse = z.infer<typeof putStockResponseSchema>

export const tuberSchema = z.object({
    channelName: z.string(),
    channelId: z.string(),
    count: z.number(),
    countUpdatedAt: z.number(),
})
export type Tuber = z.infer<typeof tuberSchema>

export const otherUserOnClientSchema = z.object({
    displayName: z.string(),
    publicId: z.string(),
    idleStock:z.number(),
    positions: z.array(positionWithReturnValueSchema)
})

export type OtherUserOnClient = z.infer<typeof otherUserOnClientSchema>

export function findRunRemove<T>(arr:T[],find:(f:T)=>boolean,run:(f:T)=>void):boolean{
    let didFind = false
    for (let i = arr.length - 1; i >= 0; i--) {
        const item = arr[i];
        if (find(item)) {
            run(item)
            arr.splice(i, 1);
            didFind = true
        }
    }
    return didFind
}

export const worldEventSchema = z.object({
    users: z.array(otherUserOnClientSchema).optional(),
    tubers: z.array(tuberSchema).optional(),
    msgs: z.array(savedChatMsgSchema).optional(),
    positions: z.array(positionWithReturnValueSchema).optional(),
    yourName: z.string().optional(),
    yourIdleStock: z.number().optional(),
    yourPrivateId: z.string().optional(),
})
export type WorldEvent = z.infer<typeof worldEventSchema>

// export type DataFirstLoad = {
//     cookieMissing?: boolean;
//     noPlayer?: boolean;
//     username?: string;
//     idleStock?: number;
//     noMatch?: boolean;
//     readyToSubscribe?: boolean;
//     userId?: string;
// };

export const dataFirstLoadSchema = z.object({
    users: z.array(otherUserOnClientSchema),
    tubers: z.array(tuberSchema),
    msgs: z.array(savedChatMsgSchema),
    positions: z.array(positionWithReturnValueSchema).optional(),
    yourName: z.string().optional(),
    yourIdleStock: z.number().optional(),
    yourPrivateId: z.string().optional(),
})

export type DataFirstLoad = z.infer<typeof dataFirstLoadSchema>

export type SamResult<T> = {
    failed:false
    value : T,
} | {
    failed: true,
    error: Error
}
export function runCatching<T>(toRun:()=>T):SamResult<T>{
	try{
		const ran = toRun()
		return {
			failed:false,
			value:ran,
		}
	}catch(e){
        let error : Error
        if(e instanceof Error){
            error = e
        }else{
            error = new Error(String(e))
        }
        console.log('run catching caught ' + error.message)

		return {
            failed:true,
            error:error,
        }
	}
}