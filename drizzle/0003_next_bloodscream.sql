CREATE TABLE IF NOT EXISTS "private_msgs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"room_id" integer NOT NULL,
	"msg_txt" text NOT NULL,
	"sent_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "private_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"room_id" integer NOT NULL,
	"joined" boolean NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "private_msgs" ADD CONSTRAINT "private_msgs_user_id_appusers_id_fk" FOREIGN KEY ("user_id") REFERENCES "appusers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "private_msgs" ADD CONSTRAINT "private_msgs_room_id_private_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "private_rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_invites" ADD CONSTRAINT "room_invites_user_id_appusers_id_fk" FOREIGN KEY ("user_id") REFERENCES "appusers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_invites" ADD CONSTRAINT "room_invites_room_id_private_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "private_rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
