CREATE TABLE IF NOT EXISTS "appusers" (
	"id" serial PRIMARY KEY NOT NULL,
	"displayName" text,
	"privateId" text,
	"publicId" text,
	"idleStock" text
);
