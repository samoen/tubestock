ALTER TABLE "private_rooms" ADD COLUMN "owner_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "private_rooms" ADD CONSTRAINT "private_rooms_owner_id_appusers_id_fk" FOREIGN KEY ("owner_id") REFERENCES "appusers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
