-- Analytics Sessions table - tracks visitor sessions
CREATE TABLE public.analytics_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL, -- Anonymous visitor ID (stored in localStorage)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Linked user if authenticated
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  page_count INTEGER DEFAULT 0,
  is_bounce BOOLEAN DEFAULT true,
  entry_page TEXT,
  exit_page TEXT,
  referrer TEXT,
  referrer_domain TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  device_type TEXT, -- desktop, mobile, tablet
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  language TEXT,
  country TEXT,
  city TEXT,
  timezone TEXT,
  ip_hash TEXT, -- Hashed IP for privacy
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Analytics Page Views table
CREATE TABLE public.analytics_page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  page_url TEXT,
  referrer TEXT,
  time_on_page_seconds INTEGER,
  scroll_depth_percent INTEGER,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Analytics Events table - for custom event tracking
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_category TEXT NOT NULL,
  event_action TEXT NOT NULL,
  event_label TEXT,
  event_value NUMERIC,
  page_path TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Analytics daily aggregates for faster dashboard queries
CREATE TABLE public.analytics_daily_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_sessions INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  avg_session_duration_seconds NUMERIC DEFAULT 0,
  avg_pages_per_session NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  new_visitors INTEGER DEFAULT 0,
  returning_visitors INTEGER DEFAULT 0,
  desktop_sessions INTEGER DEFAULT 0,
  mobile_sessions INTEGER DEFAULT 0,
  tablet_sessions INTEGER DEFAULT 0,
  top_pages JSONB DEFAULT '[]',
  top_referrers JSONB DEFAULT '[]',
  traffic_sources JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_analytics_sessions_visitor_id ON public.analytics_sessions(visitor_id);
CREATE INDEX idx_analytics_sessions_started_at ON public.analytics_sessions(started_at);
CREATE INDEX idx_analytics_sessions_user_id ON public.analytics_sessions(user_id);
CREATE INDEX idx_analytics_page_views_session_id ON public.analytics_page_views(session_id);
CREATE INDEX idx_analytics_page_views_page_path ON public.analytics_page_views(page_path);
CREATE INDEX idx_analytics_page_views_viewed_at ON public.analytics_page_views(viewed_at);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_category ON public.analytics_events(event_category);
CREATE INDEX idx_analytics_daily_stats_date ON public.analytics_daily_stats(date);

-- Enable RLS
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only super admins can view analytics
CREATE POLICY "Super admins can view all analytics sessions"
  ON public.analytics_sessions FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all page views"
  ON public.analytics_page_views FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all events"
  ON public.analytics_events FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view daily stats"
  ON public.analytics_daily_stats FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- Allow anonymous inserts for tracking (no auth required)
CREATE POLICY "Anyone can insert sessions"
  ON public.analytics_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own session"
  ON public.analytics_sessions FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can insert page views"
  ON public.analytics_page_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own page views"
  ON public.analytics_page_views FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can insert events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

-- Super admins can manage daily stats
CREATE POLICY "Super admins can manage daily stats"
  ON public.analytics_daily_stats FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- Function to aggregate daily stats (run via cron or manually)
CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_sessions INTEGER;
  v_unique_visitors INTEGER;
  v_total_page_views INTEGER;
  v_total_events INTEGER;
  v_avg_duration NUMERIC;
  v_avg_pages NUMERIC;
  v_bounce_rate NUMERIC;
  v_new_visitors INTEGER;
  v_returning_visitors INTEGER;
  v_desktop INTEGER;
  v_mobile INTEGER;
  v_tablet INTEGER;
  v_top_pages JSONB;
  v_top_referrers JSONB;
  v_traffic_sources JSONB;
BEGIN
  -- Calculate session metrics
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(DISTINCT visitor_id)::INTEGER,
    COALESCE(AVG(duration_seconds), 0),
    COALESCE(AVG(page_count), 0),
    COALESCE(AVG(CASE WHEN is_bounce THEN 1 ELSE 0 END) * 100, 0),
    COUNT(*) FILTER (WHERE device_type = 'desktop')::INTEGER,
    COUNT(*) FILTER (WHERE device_type = 'mobile')::INTEGER,
    COUNT(*) FILTER (WHERE device_type = 'tablet')::INTEGER
  INTO v_total_sessions, v_unique_visitors, v_avg_duration, v_avg_pages, v_bounce_rate,
       v_desktop, v_mobile, v_tablet
  FROM analytics_sessions
  WHERE started_at::DATE = target_date;

  -- Count page views
  SELECT COUNT(*)::INTEGER INTO v_total_page_views
  FROM analytics_page_views
  WHERE viewed_at::DATE = target_date;

  -- Count events
  SELECT COUNT(*)::INTEGER INTO v_total_events
  FROM analytics_events
  WHERE created_at::DATE = target_date;

  -- Calculate new vs returning visitors
  WITH visitor_history AS (
    SELECT visitor_id, MIN(started_at::DATE) as first_visit
    FROM analytics_sessions
    GROUP BY visitor_id
  )
  SELECT 
    COUNT(*) FILTER (WHERE first_visit = target_date)::INTEGER,
    COUNT(*) FILTER (WHERE first_visit < target_date)::INTEGER
  INTO v_new_visitors, v_returning_visitors
  FROM analytics_sessions s
  JOIN visitor_history vh ON s.visitor_id = vh.visitor_id
  WHERE s.started_at::DATE = target_date;

  -- Top pages
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_top_pages
  FROM (
    SELECT page_path, COUNT(*) as views
    FROM analytics_page_views
    WHERE viewed_at::DATE = target_date
    GROUP BY page_path
    ORDER BY views DESC
    LIMIT 10
  ) t;

  -- Top referrers
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_top_referrers
  FROM (
    SELECT referrer_domain, COUNT(*) as sessions
    FROM analytics_sessions
    WHERE started_at::DATE = target_date AND referrer_domain IS NOT NULL AND referrer_domain != ''
    GROUP BY referrer_domain
    ORDER BY sessions DESC
    LIMIT 10
  ) t;

  -- Traffic sources
  SELECT jsonb_build_object(
    'direct', COUNT(*) FILTER (WHERE utm_source IS NULL AND referrer_domain IS NULL),
    'organic', COUNT(*) FILTER (WHERE utm_medium = 'organic' OR referrer_domain LIKE '%google%' OR referrer_domain LIKE '%bing%'),
    'referral', COUNT(*) FILTER (WHERE referrer_domain IS NOT NULL AND utm_medium IS NULL),
    'social', COUNT(*) FILTER (WHERE utm_medium = 'social' OR referrer_domain LIKE '%facebook%' OR referrer_domain LIKE '%twitter%' OR referrer_domain LIKE '%linkedin%'),
    'paid', COUNT(*) FILTER (WHERE utm_medium IN ('cpc', 'ppc', 'paid')),
    'email', COUNT(*) FILTER (WHERE utm_medium = 'email')
  ) INTO v_traffic_sources
  FROM analytics_sessions
  WHERE started_at::DATE = target_date;

  -- Upsert daily stats
  INSERT INTO analytics_daily_stats (
    date, total_sessions, unique_visitors, total_page_views, total_events,
    avg_session_duration_seconds, avg_pages_per_session, bounce_rate,
    new_visitors, returning_visitors, desktop_sessions, mobile_sessions, tablet_sessions,
    top_pages, top_referrers, traffic_sources, updated_at
  ) VALUES (
    target_date, v_total_sessions, v_unique_visitors, v_total_page_views, v_total_events,
    v_avg_duration, v_avg_pages, v_bounce_rate,
    v_new_visitors, v_returning_visitors, v_desktop, v_mobile, v_tablet,
    v_top_pages, v_top_referrers, v_traffic_sources, now()
  )
  ON CONFLICT (date) DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    unique_visitors = EXCLUDED.unique_visitors,
    total_page_views = EXCLUDED.total_page_views,
    total_events = EXCLUDED.total_events,
    avg_session_duration_seconds = EXCLUDED.avg_session_duration_seconds,
    avg_pages_per_session = EXCLUDED.avg_pages_per_session,
    bounce_rate = EXCLUDED.bounce_rate,
    new_visitors = EXCLUDED.new_visitors,
    returning_visitors = EXCLUDED.returning_visitors,
    desktop_sessions = EXCLUDED.desktop_sessions,
    mobile_sessions = EXCLUDED.mobile_sessions,
    tablet_sessions = EXCLUDED.tablet_sessions,
    top_pages = EXCLUDED.top_pages,
    top_referrers = EXCLUDED.top_referrers,
    traffic_sources = EXCLUDED.traffic_sources,
    updated_at = now();
END;
$$;