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


