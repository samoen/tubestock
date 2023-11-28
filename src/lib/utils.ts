
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
    msgTxt: safeString,
    toRoomId:z.number().optional(),
})
export type SendMsgRequest = z.infer<typeof sendMsgRequestSchema>

export const createRoomRequestSchema = z.object({
    roomName: safeString
})
export type CreateRoomRequest = z.infer<typeof createRoomRequestSchema>

export const joinRoomRequestSchema = z.object({
    roomIdToJoin: z.number()
})
export type JoinRoomRequest = z.infer<typeof joinRoomRequestSchema>

export const inviteToRoomRequestSchema = z.object({
    userToInviteId: z.number(),
    roomId:z.number()
})
export type InviteToRoomRequest = z.infer<typeof inviteToRoomRequestSchema>

export const chatMsgOnClientSchema = z.object({
    id:z.number(),
    msgTxt: z.string(),
    sentAt:z.number(),
    author:z.object({
        displayName: z.string(),
    }),
})

export type ChatMsgOnClient = z.infer<typeof chatMsgOnClientSchema>

export const chatMsgsResponseSchema = z.object({
    msgs: z.array(chatMsgOnClientSchema)
})
export type ChatMsgsResponse = z.infer<typeof chatMsgsResponseSchema>

export const addMsgEventSchema = z.object({
    msg: chatMsgOnClientSchema,
    roomId: z.number().optional(),
})
export type AddMsgEvent = z.infer<typeof addMsgEventSchema>


export const historicalMsgsRequestSchema = z.object({
    startAtTime:z.number(),
    offset:z.number()
})
export type HistoricalMsgsRequest = z.infer<typeof historicalMsgsRequestSchema>

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
    amount: z.number().gt(0),
    long: z.boolean(),
})
export type PutStockRequest = z.infer<typeof putStockRequestSchema>

export const exitPositionRequestSchema = z.object({
    positionId:z.number(),
})
export type ExitPositionRequest = z.infer<typeof exitPositionRequestSchema>

// export const positionSchema = z.object({
//     userfk:z.string(),
//     id:z.string(),
//     tuberfk:z.string(),
//     tuberId: z.string(),
//     tuberName: z.string(),
//     amount: z.number(),
//     subsAtStart: z.number(),
//     long: z.boolean(),
// })
// export type Position = z.infer<typeof positionSchema>
// export const positionWithReturnValueSchema = z.intersection(
//     positionSchema,
//     z.object({
//         returnValue: z.number()
//     })
// )
// export type PositionWithReturnValue = z.infer<typeof positionWithReturnValueSchema>
export const positionInClientSchema = z.object({
    id:z.number(),
    tuberName: z.string(),
    amount: z.number(),
    subsAtStart: z.number(),
    long: z.boolean(),
    returnValue:z.number(),
})
export type PositionInClient = z.infer<typeof positionInClientSchema>

export const inviteOnClientSchema = z.object({
    id:z.number(),
    toRoom:z.object({
        id:z.number(),
        roomName:z.string(),
        ownerId:z.number(),
        msgs:z.array(chatMsgOnClientSchema)
    }),
    joined:z.boolean(),
    userfk:z.number(),
})
export type InviteOnClient = z.infer<typeof inviteOnClientSchema>


export const exitPositionResponseSchema = z.object({
    idleStock: z.number(),
    positions: z.array(positionInClientSchema),
})
export type ExitPositionResponse = z.infer<typeof exitPositionResponseSchema>

export const positionUpdateEventSchema = z.object({
    positions:z.array(positionInClientSchema)
})

export const putStockResponseSchema = z.object({
    idleStock: z.number(),
    positions: z.array(positionInClientSchema),
})
export type PutStockResponse = z.infer<typeof putStockResponseSchema>

export const tuberInClientSchema = z.object({
    channelName: z.string(),
    channelId: z.string(),
    count: z.number(),
})
export type TuberInClient = z.infer<typeof tuberInClientSchema>

export const otherUserOnClientSchema = z.object({
    displayName: z.string(),
    id: z.number(),
    idleStock:z.number(),
    positions: z.array(positionInClientSchema)
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
    tubers: z.array(tuberInClientSchema).optional(),
    msgs: z.array(chatMsgOnClientSchema).optional(),
    positions: z.array(positionInClientSchema).optional(),
    // joinedRooms: z.array(inviteOnClientSchema).optional(),
    roomInvites: z.array(inviteOnClientSchema).optional(),
    yourName: z.string().optional(),
    yourIdleStock: z.number().optional(),
    yourPrivateId: z.string().optional(),
    yourDbId: z.number().optional(),
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

// export const dataFirstLoadSchema = z.object({
//     users: z.array(otherUserOnClientSchema),
//     tubers: z.array(tuberInClientSchema),
//     msgs: z.array(chatMsgOnClientSchema),
//     positions: z.array(positionInClientSchema).optional(),
//     yourName: z.string().optional(),
//     yourIdleStock: z.number().optional(),
//     yourPrivateId: z.string().optional(),
// })

// export type DataFirstLoad = z.infer<typeof dataFirstLoadSchema>

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