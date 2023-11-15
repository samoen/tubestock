
import * as z from 'zod'

export type DataFirstLoad = {
    cookieMissing?: boolean;
    noPlayer?: boolean;
    username?: string;
    idleStock?: number;
    noMatch?: boolean;
    readyToSubscribe?: boolean;
    userId?: string;
};

export const setNameSchema = z.object({
    wantName: z.string()
})
export type SetName = z.infer<typeof setNameSchema>

export const sendMsgSchema = z.object({
    msgTxt: z.string()
})
export type SendMsg = z.infer<typeof sendMsgSchema>

export const savedChatMsgSchema = z.object({
    msgTxt: z.string(),
    from: z.string(),
})

export type SavedChatMsg = z.infer<typeof savedChatMsgSchema>

export const chatMsgBroadcastSchema = z.object({
    // yourName:z.string(),
    newMsg: savedChatMsgSchema
})
export type ChatMsgBroadcast = z.infer<typeof chatMsgBroadcastSchema>

export const userOnClientSchema = z.object({
    displayName: z.string(),
    publicId: z.string(),
})

export type UserOnClient = z.infer<typeof userOnClientSchema>

// export const userJoinedSchema = z.object({
//     joinedUserName:z.string(),
// })
// export type UserJoined = z.infer<typeof userJoinedSchema>

export const setNameResponseSchema = z.object({
    yourName: z.string(),
})
export type SetNameResponse = z.infer<typeof setNameResponseSchema>

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
    channelId: z.string().min(1).max(255),
})
export type ExitPositionRequest = z.infer<typeof exitPositionRequestSchema>

export const positionSchema = z.object({
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


export const welcomeSubscriberSchema = z.object({
    users: z.array(userOnClientSchema),
    tubers: z.array(tuberSchema),
    msgs: z.array(savedChatMsgSchema),
    positions: z.array(positionWithReturnValueSchema),
    yourName: z.string(),
    yourIdleStock: z.number(),
})
export type WelcomeSubscriber = z.infer<typeof welcomeSubscriberSchema>
