SET LOCAL lock_timeout = '5s';
--> statement-breakpoint
SET LOCAL statement_timeout = '60s';
--> statement-breakpoint
LOCK TABLE reports, baselines, aggregated_windows, incidents, incident_regions IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "aggregated_windows" WHERE NOT ("aggregated_windows"."window_end" > "aggregated_windows"."window_start")) THEN RAISE EXCEPTION 'Preflight: aggregated_windows contiene valores incompatibles; revisar sin borrar datos automaticamente'; END IF;
  IF EXISTS (SELECT 1 FROM "aggregated_windows" WHERE NOT ("aggregated_windows"."total_reports" >= 0 and "aggregated_windows"."unique_reporters" >= 0 and "aggregated_windows"."unique_reporters" <= "aggregated_windows"."total_reports" and "aggregated_windows"."weighted_reports" >= 0 and "aggregated_windows"."weighted_reports" < 'Infinity'::real)) THEN RAISE EXCEPTION 'Preflight: aggregated_windows contiene valores incompatibles; revisar sin borrar datos automaticamente'; END IF;
  IF EXISTS (SELECT 1 FROM "aggregated_windows" WHERE NOT ("aggregated_windows"."anomaly_score" between 0 and 100 and "aggregated_windows"."technical_score" between 0 and 100 and "aggregated_windows"."confidence" between 0 and 100)) THEN RAISE EXCEPTION 'Preflight: aggregated_windows contiene valores incompatibles; revisar sin borrar datos automaticamente'; END IF;
  IF EXISTS (SELECT 1 FROM "baselines" WHERE NOT ("baselines"."weekday" between 0 and 6 and "baselines"."hour" between 0 and 23)) THEN RAISE EXCEPTION 'Preflight: baselines contiene valores incompatibles; revisar sin borrar datos automaticamente'; END IF;
  IF EXISTS (SELECT 1 FROM "baselines" WHERE NOT ("baselines"."median_reports" >= 0 and "baselines"."median_reports" < 'Infinity'::real and "baselines"."dispersion" > 0 and "baselines"."dispersion" < 'Infinity'::real and "baselines"."sample_size" >= 0)) THEN RAISE EXCEPTION 'Preflight: baselines contiene valores incompatibles; revisar sin borrar datos automaticamente'; END IF;
  IF EXISTS (SELECT 1 FROM "incident_regions" WHERE NOT ("incident_regions"."report_count" >= 0 and "incident_regions"."confidence" between 0 and 100)) THEN RAISE EXCEPTION 'Preflight: incident_regions contiene valores incompatibles; revisar sin borrar datos automaticamente'; END IF;
  IF EXISTS (SELECT 1 FROM "incidents" WHERE NOT ("incidents"."confidence" between 0 and 100)) THEN RAISE EXCEPTION 'Preflight: incidents contiene valores incompatibles; revisar sin borrar datos automaticamente'; END IF;
  IF EXISTS (SELECT 1 FROM "incidents" WHERE NOT ("incidents"."ended_at" >= "incidents"."started_at")) THEN RAISE EXCEPTION 'Preflight: incidents contiene valores incompatibles; revisar sin borrar datos automaticamente'; END IF;
  IF EXISTS (SELECT 1 FROM "reports" WHERE NOT ("reports"."confidence" between 0 and 1)) THEN RAISE EXCEPTION 'Preflight: reports contiene valores incompatibles; revisar sin borrar datos automaticamente'; END IF;
  IF EXISTS (SELECT 1 FROM "baselines" GROUP BY service_id,state_id,weekday,hour HAVING count(*) > 1) THEN RAISE EXCEPTION 'Preflight: baselines contiene duplicados; requieren revision explicita'; END IF;
  IF EXISTS (SELECT 1 FROM "aggregated_windows" GROUP BY service_id,state_id,window_start HAVING count(*) > 1) THEN RAISE EXCEPTION 'Preflight: aggregated_windows contiene duplicados; requieren revision explicita'; END IF;
END $$;
--> statement-breakpoint
DROP INDEX "baselines_unique_bucket";--> statement-breakpoint
ALTER TABLE "aggregated_windows" ADD CONSTRAINT "aggregated_windows_unique_bucket" UNIQUE NULLS NOT DISTINCT("service_id","state_id","window_start");--> statement-breakpoint
ALTER TABLE "baselines" ADD CONSTRAINT "baselines_unique_bucket" UNIQUE NULLS NOT DISTINCT("service_id","state_id","weekday","hour");--> statement-breakpoint
ALTER TABLE "aggregated_windows" ADD CONSTRAINT "aggregated_windows_time_order" CHECK ("aggregated_windows"."window_end" > "aggregated_windows"."window_start");--> statement-breakpoint
ALTER TABLE "aggregated_windows" ADD CONSTRAINT "aggregated_windows_counts_range" CHECK ("aggregated_windows"."total_reports" >= 0 and "aggregated_windows"."unique_reporters" >= 0 and "aggregated_windows"."unique_reporters" <= "aggregated_windows"."total_reports" and "aggregated_windows"."weighted_reports" >= 0 and "aggregated_windows"."weighted_reports" < 'Infinity'::real);--> statement-breakpoint
ALTER TABLE "aggregated_windows" ADD CONSTRAINT "aggregated_windows_scores_range" CHECK ("aggregated_windows"."anomaly_score" between 0 and 100 and "aggregated_windows"."technical_score" between 0 and 100 and "aggregated_windows"."confidence" between 0 and 100);--> statement-breakpoint
ALTER TABLE "baselines" ADD CONSTRAINT "baselines_time_range" CHECK ("baselines"."weekday" between 0 and 6 and "baselines"."hour" between 0 and 23);--> statement-breakpoint
ALTER TABLE "baselines" ADD CONSTRAINT "baselines_stats_range" CHECK ("baselines"."median_reports" >= 0 and "baselines"."median_reports" < 'Infinity'::real and "baselines"."dispersion" > 0 and "baselines"."dispersion" < 'Infinity'::real and "baselines"."sample_size" >= 0);--> statement-breakpoint
ALTER TABLE "incident_regions" ADD CONSTRAINT "incident_regions_counts_range" CHECK ("incident_regions"."report_count" >= 0 and "incident_regions"."confidence" between 0 and 100);--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_confidence_range" CHECK ("incidents"."confidence" between 0 and 100);--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_time_order" CHECK ("incidents"."ended_at" >= "incidents"."started_at");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_confidence_range" CHECK ("reports"."confidence" between 0 and 1);
