CREATE INDEX "aw_created_at_idx" ON "aggregated_windows" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "aw_window_start_idx" ON "aggregated_windows" USING btree ("window_start");