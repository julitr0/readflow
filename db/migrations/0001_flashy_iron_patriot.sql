CREATE TABLE "conversion" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"source" text NOT NULL,
	"sourceUrl" text,
	"date" timestamp NOT NULL,
	"wordCount" integer NOT NULL,
	"readingTime" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"fileUrl" text,
	"fileSize" integer,
	"error" text,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"deliveredAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "userSettings" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"kindleEmail" text,
	"personalEmail" text NOT NULL,
	"conversionPreferences" text,
	"notificationPreferences" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "userSettings_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "conversion" ADD CONSTRAINT "conversion_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userSettings" ADD CONSTRAINT "userSettings_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;