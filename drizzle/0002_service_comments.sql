CREATE TABLE "service_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "service_id" uuid NOT NULL,
  "body" varchar(500) NOT NULL,
  "moderation_status" varchar(16) DEFAULT 'pending' NOT NULL,
  "anonymous_hash" varchar(64) NOT NULL,
  "ip_prefix_hash" varchar(64) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "moderated_at" timestamp with time zone,
  CONSTRAINT "service_comments_moderation_check" CHECK ("moderation_status" in ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "service_comments" ADD CONSTRAINT "service_comments_service_id_services_id_fk"
  FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "service_comments_public_idx" ON "service_comments" USING btree ("service_id", "moderation_status", "created_at");
--> statement-breakpoint
CREATE INDEX "service_comments_pending_idx" ON "service_comments" USING btree ("moderation_status", "created_at");
--> statement-breakpoint
CREATE INDEX "service_comments_anon_idx" ON "service_comments" USING btree ("anonymous_hash", "created_at");
