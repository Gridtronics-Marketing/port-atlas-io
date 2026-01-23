-- Ensure PostgREST roles can access tables (RLS still controls row visibility)

-- Leads: public forms need INSERT for anon; dashboards use authenticated.
GRANT INSERT ON TABLE public.lead_captures TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lead_captures TO authenticated;

-- Onboarding responses: public onboarding needs INSERT for anon.
GRANT INSERT ON TABLE public.onboarding_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.onboarding_responses TO authenticated;

-- Analytics: public tracking needs INSERT for anon; dashboards use authenticated.
GRANT INSERT ON TABLE public.analytics_sessions TO anon;
GRANT INSERT ON TABLE public.analytics_page_views TO anon;
GRANT INSERT ON TABLE public.analytics_events TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.analytics_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.analytics_page_views TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.analytics_events TO authenticated;

-- Daily stats are derived server-side; keep anon with no access.
GRANT SELECT ON TABLE public.analytics_daily_stats TO authenticated;