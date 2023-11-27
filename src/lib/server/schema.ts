import { relations } from "drizzle-orm";
import { serial, text, timestamp, pgTable, integer, boolean, bigint } from "drizzle-orm/pg-core";
// import * as Drizzle from "drizzle-orm"

 
export const appusers = pgTable("appusers", {
  id: serial("id").primaryKey().unique(),
  displayName: text("display_name").notNull(),
  secret:text("secret").notNull(),
  idleStock:integer("idle_stock").notNull()
});
export type AppUser = typeof appusers.$inferSelect
export type InsertAppUser = typeof appusers.$inferInsert

export const usersRelations = relations(appusers, ({ many }) => ({
	msgs: many(chatMessages),
  positions:many(positions),
  invites:many(roomInvites),
}));

export const tubers = pgTable("tubers", {
  id: serial("id").primaryKey().unique(),
  channelName: text("channel_name").notNull(),
  channelId: text("channel_id").notNull(),
  count:integer("count").notNull(),
  countUpdatedAt:bigint("count_updated_at",{mode:"number"}).notNull(),
});
export type DbTuber = typeof tubers.$inferSelect
export type InsertDbTuber = typeof tubers.$inferInsert

export const chatMessages = pgTable("chatmsgs", {
  id: serial("id").primaryKey().unique(),
  userfk:integer('user_id').references(()=>appusers.id,{onDelete:'cascade'}).notNull(),
  msgTxt: text("msg_txt").notNull(),
  sentAt:bigint('sent_at',{mode:"number"}).notNull(),
});
export const msgsRelations = relations(chatMessages, ({ one }) => ({
	author: one(appusers, {
		fields: [chatMessages.userfk],
		references: [appusers.id],
	}),
}));

export type DbChatMsg = typeof chatMessages.$inferSelect
export type InsertDbChatMsg = typeof chatMessages.$inferInsert

export const privateMessages = pgTable("private_msgs", {
  id: serial("id").primaryKey(),
  userfk:integer('user_id').references(()=>appusers.id,{onDelete:'cascade'}).notNull(),
  roomfk:integer('room_id').references(()=>privateRooms.id,{onDelete:'cascade'}).notNull(),
  msgTxt: text("msg_txt").notNull(),
  sentAt:bigint('sent_at',{mode:"number"}).notNull(),
});
export const privateMsgRelations = relations(privateMessages, ({ one }) => ({
  author: one(appusers, {
    fields: [privateMessages.userfk],
		references: [appusers.id],
	}),
  room: one(privateRooms, {
    fields: [privateMessages.roomfk],
		references: [privateRooms.id],
	}),
}));
export type DbPrivateMsg = typeof privateMessages.$inferSelect
export type InsertPrivateMsg = typeof privateMessages.$inferInsert


export const privateRooms = pgTable("private_rooms",{
  id: serial('id').primaryKey(),
  roomName: text('room_name').notNull(),
  ownerId:integer('owner_id').references(()=>appusers.id,{onDelete:'cascade'}).notNull()
})
export const privateRoomRelations = relations(privateRooms,  ({ one,many }) => ({
  owner: one(appusers, {
    fields: [privateRooms.ownerId],
		references: [appusers.id],
	}),
  msgs: many(privateMessages)
}));
export type DbPrivateRoom = typeof privateRooms.$inferSelect
export type InsertPrivateRoom = typeof privateRooms.$inferInsert

export const roomInvites = pgTable("room_invites",{
  id:serial('id').primaryKey(),
  userfk:integer('user_id').references(()=>appusers.id,{onDelete:'cascade'}).notNull(),
  roomfk:integer('room_id').references(()=>privateRooms.id,{onDelete:'cascade'}).notNull(),
  joined:boolean('joined').notNull(),
})
export type DbRoomInvite = typeof roomInvites.$inferSelect
export type InsertRoomInvite = typeof roomInvites.$inferInsert
export const roomInviteRelations = relations(roomInvites,  ({ one }) => ({
  forUser: one(appusers, {
    fields: [roomInvites.userfk],
		references: [appusers.id],
	}),
  toRoom: one(privateRooms, {
    fields: [roomInvites.roomfk],
		references: [privateRooms.id],
	}),
}));

export const positions = pgTable("positions", {
  id: serial("id").primaryKey().unique(),
  userfk:integer('user_id').references(() => appusers.id,{onDelete:'cascade'}).notNull(),
  tuberfk:integer('tuber_id').references(() => tubers.id,{onDelete:'cascade'}).notNull(),
  tuberName: text('tuber_name').notNull(),
  amount: integer('amount').notNull(),
  subsAtStart: integer('subs_at_start').notNull(),
  long: boolean('long').notNull(),
});
export const positionsRelations = relations(positions, ({ one }) => ({
	holder: one(appusers, {
		fields: [positions.userfk],
		references: [appusers.id],
	}),
  forTuber:one(tubers,{
    fields: [positions.tuberfk],
    references: [tubers.id],
  })
}));
export type DbPosition = typeof positions.$inferSelect
export type InsertDbPosition = typeof positions.$inferInsert


