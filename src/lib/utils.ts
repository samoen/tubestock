
import * as z from 'zod'

export type DataFirstLoad = {
	cookieMissing?: boolean;
	noPlayer?: boolean;
	username?: string;
	noMatch?: boolean;
	readyToSubscribe?: boolean;
	userId?: string;
};

export const setNameSchema = z.object({
    wantName:z.string()
})
export type SetName = z.infer<typeof setNameSchema>

export const sendMsgSchema = z.object({
    msgTxt:z.string()
})
export type SendMsg = z.infer<typeof sendMsgSchema>

export const savedChatMsgSchema = z.object({
    msgTxt:z.string(),
    from:z.string(),
})

export type SavedChatMsg = z.infer<typeof savedChatMsgSchema>

export const chatMsgBroadcastSchema = z.object({
    // yourName:z.string(),
    newMsg:savedChatMsgSchema
})
export type ChatMsgBroadcast = z.infer<typeof chatMsgBroadcastSchema>

export const userJoinedSchema = z.object({
    joinedUserName:z.string(),
})
export type UserJoined = z.infer<typeof userJoinedSchema>

export const welcomeSchema = z.object({
    yourName:z.string(),
})
export type Welcome = z.infer<typeof welcomeSchema>

export const tubeRequestSchema = z.object({
    channelName:z.string()
})
export type TubeRequest = z.infer<typeof tubeRequestSchema>

export const welcomeSubscriberSchema = z.object({
    users:z.array(z.object({displayName:z.string()}))
})
export type WelcomeSubscriber = z.infer<typeof welcomeSubscriberSchema>