CREATE TABLE IF NOT EXISTS "appusers" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"secret" text NOT NULL,
	"public_id" text NOT NULL,
	"idle_stock" integer NOT NULL,
	CONSTRAINT "appusers_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chatmsgs" (
	"id" serial PRIMARY KEY NOT NULL,
	"msg_txt" text NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "chatmsgs_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tuber_id" integer NOT NULL,
	"tuber_name" text NOT NULL,
	"amount" integer NOT NULL,
	"subs_at_start" integer NOT NULL,
	"long" boolean NOT NULL,
	CONSTRAINT "positions_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tubers" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_name" text NOT NULL,
	"channel_id" text NOT NULL,
	"count" integer NOT NULL,
	"count_updated_at" bigint NOT NULL,
	CONSTRAINT "tubers_id_unique" UNIQUE("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chatmsgs" ADD CONSTRAINT "chatmsgs_user_id_appusers_id_fk" FOREIGN KEY ("user_id") REFERENCES "appusers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "positions" ADD CONSTRAINT "positions_user_id_appusers_id_fk" FOREIGN KEY ("user_id") REFERENCES "appusers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "positions" ADD CONSTRAINT "positions_tuber_id_tubers_id_fk" FOREIGN KEY ("tuber_id") REFERENCES "tubers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
