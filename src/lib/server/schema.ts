import { serial, text, timestamp, pgTable } from "drizzle-orm/pg-core";
 
export const appusers = pgTable("appusers", {
  id: serial("id").primaryKey(),
  displayName: text("displayName"),
  privateId:text("privateId"),
  publicId:text("publicId"),
  idleStock:text("idleStock")
});