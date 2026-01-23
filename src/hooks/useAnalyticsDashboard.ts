import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, format } from 'date-fns';

// Type definitions for analytics tables (not yet in generated types)
interface AnalyticsSession {
  id: string;
  visitor_id: string;
  user_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  page_count: number;
  is_bounce: boolean;
  entry_page: string | null;
  exit_page: string | null;
  referrer: string | null;
  referrer_domain: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  device_type: string | null;
  browser: string | null;
}

interface AnalyticsPageView {
  id: string;
  session_id: string | null;
  visitor_id: string;
  page_path: string;
  page_title: string | null;
  time_on_page_seconds: number | null;
  viewed_at: string;
}

// Helper to query analytics tables (bypasses type checking for new tables)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const analyticsQuery = (table: string): any => {
  return (supabase as unknown as { from: (t: string) => unknown }).from(table);
};

export interface AnalyticsDateRange {
  startDate: Date;
  endDate: Date;
}

export interface RealtimeMetrics {
  activeVisitors: number;
  todaySessions: number;
  todayPageViews: number;
  todayEvents: number;
}

export interface TopPage {
  page_path: string;
  views: number;
  avg_time_seconds: number;
  bounce_rate: number;
}

export interface TopReferrer {
  referrer_domain: string;
  sessions: number;
  bounce_rate: number;
}

export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
}

export interface BrowserBreakdown {
  browser: string;
  count: number;
  percentage: number;
}

export const useAnalyticsDashboard = (dateRange: AnalyticsDateRange) => {
  const { startDate, endDate } = dateRange;

  // Fetch realtime metrics (last 30 minutes active)
  const { data: realtimeMetrics, isLoading: realtimeLoading } = useQuery({
    queryKey: ['analytics-realtime'],
    queryFn: async (): Promise<RealtimeMetrics> => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const todayStart = startOfDay(new Date()).toISOString();

      // Active visitors (sessions updated in last 30 min)
      const { count: activeCount } = await analyticsQuery('analytics_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', thirtyMinutesAgo);

      // Today's sessions
      const { count: todaySessions } = await analyticsQuery('analytics_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', todayStart);

      // Today's page views
      const { count: todayPageViews } = await analyticsQuery('analytics_page_views')
        .select('*', { count: 'exact', head: true })
        .gte('viewed_at', todayStart);

      // Today's events
      const { count: todayEvents } = await analyticsQuery('analytics_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

      return {
        activeVisitors: activeCount || 0,
        todaySessions: todaySessions || 0,
        todayPageViews: todayPageViews || 0,
        todayEvents: todayEvents || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch aggregated stats for date range
  const { data: periodStats, isLoading: periodLoading } = useQuery({
    queryKey: ['analytics-period', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const startStr = startOfDay(startDate).toISOString();
      const endStr = endOfDay(endDate).toISOString();

      // Get sessions in range
      const { data: sessions } = await analyticsQuery('analytics_sessions')
        .select('*')
        .gte('started_at', startStr)
        .lte('started_at', endStr) as { data: AnalyticsSession[] | null };

      // Get page views in range
      const { data: pageViews } = await analyticsQuery('analytics_page_views')
        .select('*')
        .gte('viewed_at', startStr)
        .lte('viewed_at', endStr) as { data: AnalyticsPageView[] | null };

      // Get events in range
      const { count: eventCount } = await analyticsQuery('analytics_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startStr)
        .lte('created_at', endStr);

      const totalSessions = sessions?.length || 0;
      const uniqueVisitors = new Set(sessions?.map(s => s.visitor_id)).size;
      const totalPageViews = pageViews?.length || 0;
      const bounceSessions = sessions?.filter(s => s.is_bounce).length || 0;
      const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;
      
      const totalDuration = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
      const avgSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
      const avgPagesPerSession = totalSessions > 0 ? totalPageViews / totalSessions : 0;

      // Device breakdown
      const desktop = sessions?.filter(s => s.device_type === 'desktop').length || 0;
      const mobile = sessions?.filter(s => s.device_type === 'mobile').length || 0;
      const tablet = sessions?.filter(s => s.device_type === 'tablet').length || 0;

      // New vs returning
      const visitorFirstSeen = new Map<string, string>();
      sessions?.forEach(s => {
        if (!visitorFirstSeen.has(s.visitor_id) || s.started_at < visitorFirstSeen.get(s.visitor_id)!) {
          visitorFirstSeen.set(s.visitor_id, s.started_at);
        }
      });
      
      const newVisitors = sessions?.filter(s => {
        const firstSeen = visitorFirstSeen.get(s.visitor_id);
        return firstSeen && new Date(firstSeen) >= startDate;
      }).length || 0;

      return {
        totalSessions,
        uniqueVisitors,
        totalPageViews,
        totalEvents: eventCount || 0,
        bounceRate,
        avgSessionDuration,
        avgPagesPerSession,
        deviceBreakdown: { desktop, mobile, tablet } as DeviceBreakdown,
        newVisitors,
        returningVisitors: totalSessions - newVisitors,
      };
    },
  });

  // Fetch daily trend data
  const { data: dailyTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['analytics-trend', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const startStr = startOfDay(startDate).toISOString();
      const endStr = endOfDay(endDate).toISOString();

      const { data: sessions } = await analyticsQuery('analytics_sessions')
        .select('started_at, visitor_id, is_bounce, duration_seconds')
        .gte('started_at', startStr)
        .lte('started_at', endStr) as { data: AnalyticsSession[] | null };

      const { data: pageViews } = await analyticsQuery('analytics_page_views')
        .select('viewed_at')
        .gte('viewed_at', startStr)
        .lte('viewed_at', endStr) as { data: AnalyticsPageView[] | null };

      // Group by day
      const dailyData = new Map<string, {
        sessions: number;
        visitors: Set<string>;
        pageViews: number;
        bounces: number;
        totalDuration: number;
      }>();

      sessions?.forEach(s => {
        const day = format(new Date(s.started_at), 'yyyy-MM-dd');
        if (!dailyData.has(day)) {
          dailyData.set(day, { sessions: 0, visitors: new Set(), pageViews: 0, bounces: 0, totalDuration: 0 });
        }
        const data = dailyData.get(day)!;
        data.sessions++;
        data.visitors.add(s.visitor_id);
        if (s.is_bounce) data.bounces++;
        data.totalDuration += s.duration_seconds || 0;
      });

      pageViews?.forEach(pv => {
        const day = format(new Date(pv.viewed_at), 'yyyy-MM-dd');
        if (dailyData.has(day)) {
          dailyData.get(day)!.pageViews++;
        }
      });

      return Array.from(dailyData.entries())
        .map(([date, data]) => ({
          date,
          sessions: data.sessions,
          visitors: data.visitors.size,
          pageViews: data.pageViews,
          bounceRate: data.sessions > 0 ? (data.bounces / data.sessions) * 100 : 0,
          avgDuration: data.sessions > 0 ? data.totalDuration / data.sessions : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });

  // Fetch top pages
  const { data: topPages, isLoading: pagesLoading } = useQuery({
    queryKey: ['analytics-top-pages', startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<TopPage[]> => {
      const startStr = startOfDay(startDate).toISOString();
      const endStr = endOfDay(endDate).toISOString();

      const { data: pageViews } = await analyticsQuery('analytics_page_views')
        .select('page_path, time_on_page_seconds')
        .gte('viewed_at', startStr)
        .lte('viewed_at', endStr) as { data: AnalyticsPageView[] | null };

      // Aggregate by page
      const pageStats = new Map<string, { views: number; totalTime: number }>();
      pageViews?.forEach(pv => {
        if (!pageStats.has(pv.page_path)) {
          pageStats.set(pv.page_path, { views: 0, totalTime: 0 });
        }
        const stats = pageStats.get(pv.page_path)!;
        stats.views++;
        stats.totalTime += pv.time_on_page_seconds || 0;
      });

      return Array.from(pageStats.entries())
        .map(([page_path, stats]) => ({
          page_path,
          views: stats.views,
          avg_time_seconds: stats.views > 0 ? stats.totalTime / stats.views : 0,
          bounce_rate: 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 20);
    },
  });

  // Fetch top referrers
  const { data: topReferrers, isLoading: referrersLoading } = useQuery({
    queryKey: ['analytics-referrers', startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<TopReferrer[]> => {
      const startStr = startOfDay(startDate).toISOString();
      const endStr = endOfDay(endDate).toISOString();

      const { data: sessions } = await analyticsQuery('analytics_sessions')
        .select('referrer_domain, is_bounce')
        .gte('started_at', startStr)
        .lte('started_at', endStr)
        .not('referrer_domain', 'is', null) as { data: AnalyticsSession[] | null };

      // Aggregate by referrer
      const referrerStats = new Map<string, { sessions: number; bounces: number }>();
      sessions?.forEach(s => {
        if (!s.referrer_domain) return;
        if (!referrerStats.has(s.referrer_domain)) {
          referrerStats.set(s.referrer_domain, { sessions: 0, bounces: 0 });
        }
        const stats = referrerStats.get(s.referrer_domain)!;
        stats.sessions++;
        if (s.is_bounce) stats.bounces++;
      });

      return Array.from(referrerStats.entries())
        .map(([referrer_domain, stats]) => ({
          referrer_domain,
          sessions: stats.sessions,
          bounce_rate: stats.sessions > 0 ? (stats.bounces / stats.sessions) * 100 : 0,
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10);
    },
  });

  // Fetch browser breakdown
  const { data: browserBreakdown, isLoading: browserLoading } = useQuery({
    queryKey: ['analytics-browsers', startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<BrowserBreakdown[]> => {
      const startStr = startOfDay(startDate).toISOString();
      const endStr = endOfDay(endDate).toISOString();

      const { data: sessions } = await analyticsQuery('analytics_sessions')
        .select('browser')
        .gte('started_at', startStr)
        .lte('started_at', endStr) as { data: AnalyticsSession[] | null };

      const browserCounts = new Map<string, number>();
      sessions?.forEach(s => {
        const browser = s.browser || 'Unknown';
        browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1);
      });

      const total = sessions?.length || 1;
      return Array.from(browserCounts.entries())
        .map(([browser, count]) => ({
          browser,
          count,
          percentage: (count / total) * 100,
        }))
        .sort((a, b) => b.count - a.count);
    },
  });

  // Fetch traffic sources breakdown
  const { data: trafficSources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['analytics-sources', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const startStr = startOfDay(startDate).toISOString();
      const endStr = endOfDay(endDate).toISOString();

      const { data: sessions } = await analyticsQuery('analytics_sessions')
        .select('utm_source, utm_medium, referrer_domain')
        .gte('started_at', startStr)
        .lte('started_at', endStr) as { data: AnalyticsSession[] | null };

      let direct = 0, organic = 0, referral = 0, social = 0, paid = 0, email = 0;

      sessions?.forEach(s => {
        if (s.utm_medium === 'email') {
          email++;
        } else if (['cpc', 'ppc', 'paid'].includes(s.utm_medium || '')) {
          paid++;
        } else if (s.utm_medium === 'social' || /facebook|twitter|linkedin|instagram/.test(s.referrer_domain || '')) {
          social++;
        } else if (s.utm_medium === 'organic' || /google|bing|yahoo|duckduckgo/.test(s.referrer_domain || '')) {
          organic++;
        } else if (s.referrer_domain) {
          referral++;
        } else {
          direct++;
        }
      });

      const total = sessions?.length || 1;
      return [
        { source: 'Direct', count: direct, percentage: (direct / total) * 100, color: 'hsl(var(--primary))' },
        { source: 'Organic Search', count: organic, percentage: (organic / total) * 100, color: 'hsl(142, 76%, 36%)' },
        { source: 'Referral', count: referral, percentage: (referral / total) * 100, color: 'hsl(221, 83%, 53%)' },
        { source: 'Social', count: social, percentage: (social / total) * 100, color: 'hsl(280, 67%, 55%)' },
        { source: 'Paid', count: paid, percentage: (paid / total) * 100, color: 'hsl(24, 95%, 53%)' },
        { source: 'Email', count: email, percentage: (email / total) * 100, color: 'hsl(173, 80%, 40%)' },
      ].filter(s => s.count > 0);
    },
  });

  return {
    realtimeMetrics,
    periodStats,
    dailyTrend,
    topPages,
    topReferrers,
    browserBreakdown,
    trafficSources,
    isLoading: realtimeLoading || periodLoading || trendLoading || pagesLoading || referrersLoading || browserLoading || sourcesLoading,
  };
};
