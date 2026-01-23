import { useEffect, useRef, useCallback, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/hooks/useAuth';

// Helper to query analytics tables (bypasses type checking for new tables)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const analyticsQuery = (table: string): any => {
  return (supabase as any).from(table);
};

// Safe hook to get user without throwing if outside AuthProvider
const useSafeAuth = () => {
  const context = useContext(AuthContext);
  return context?.user ?? null;
};

interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  language: string;
  timezone: string;
}

const getVisitorId = (): string => {
  const storageKey = 'ta_visitor_id';
  let visitorId = localStorage.getItem(storageKey);
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, visitorId);
  }
  return visitorId;
};

const getSessionId = (): { sessionId: string; isNew: boolean } => {
  const storageKey = 'ta_session';
  const sessionTimeout = 30 * 60 * 1000;
  const stored = localStorage.getItem(storageKey);
  const now = Date.now();
  
  if (stored) {
    const { id, lastActivity } = JSON.parse(stored);
    if (now - lastActivity < sessionTimeout) {
      localStorage.setItem(storageKey, JSON.stringify({ id, lastActivity: now }));
      return { sessionId: id, isNew: false };
    }
  }
  
  const newId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem(storageKey, JSON.stringify({ id: newId, lastActivity: now }));
  return { sessionId: newId, isNew: true };
};

const getDeviceInfo = (): DeviceInfo => {
  const ua = navigator.userAgent;
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) deviceType = 'tablet';
  else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) deviceType = 'mobile';
  
  let browser = 'Unknown', browserVersion = '';
  if (ua.includes('Firefox/')) { browser = 'Firefox'; browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || ''; }
  else if (ua.includes('Edg/')) { browser = 'Edge'; browserVersion = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || ''; }
  else if (ua.includes('Chrome/')) { browser = 'Chrome'; browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || ''; }
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) { browser = 'Safari'; browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1] || ''; }
  
  let os = 'Unknown', osVersion = '';
  if (ua.includes('Windows NT')) os = 'Windows';
  else if (ua.includes('Mac OS X')) { os = 'macOS'; osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || ''; }
  else if (ua.includes('Android')) { os = 'Android'; osVersion = ua.match(/Android (\d+\.\d+)/)?.[1] || ''; }
  else if (/iPhone|iPad|iPod/.test(ua)) { os = 'iOS'; osVersion = ua.match(/OS (\d+_\d+)/)?.[1]?.replace('_', '.') || ''; }
  else if (ua.includes('Linux')) os = 'Linux';
  
  return { deviceType, browser, browserVersion, os, osVersion, screenWidth: window.screen.width, screenHeight: window.screen.height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight, language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
};

const getUtmParams = () => {
  const params = new URLSearchParams(window.location.search);
  return { utm_source: params.get('utm_source'), utm_medium: params.get('utm_medium'), utm_campaign: params.get('utm_campaign'), utm_term: params.get('utm_term'), utm_content: params.get('utm_content') };
};

const getReferrerDomain = (referrer: string): string | null => {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.hostname === window.location.hostname) return null;
    return url.hostname;
  } catch { return null; }
};

export const useAnalyticsTracking = () => {
  const location = useLocation();
  const user = useSafeAuth();
  const sessionDbIdRef = useRef<string | null>(null);
  const currentPageViewIdRef = useRef<string | null>(null);
  const pageStartTimeRef = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
        if (scrollPercent > maxScrollDepthRef.current) maxScrollDepthRef.current = scrollPercent;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const ensureSession = useCallback(async () => {
    const visitorId = getVisitorId();
    const { isNew } = getSessionId();
    const deviceInfo = getDeviceInfo();
    const utmParams = getUtmParams();
    const referrerDomain = getReferrerDomain(document.referrer);

    if (isNew || !sessionDbIdRef.current) {
      try {
        const { data, error } = await analyticsQuery('analytics_sessions')
          .insert({ visitor_id: visitorId, user_id: user?.id || null, entry_page: location.pathname, referrer: document.referrer || null, referrer_domain: referrerDomain, ...utmParams, device_type: deviceInfo.deviceType, browser: deviceInfo.browser, browser_version: deviceInfo.browserVersion, os: deviceInfo.os, os_version: deviceInfo.osVersion, screen_width: deviceInfo.screenWidth, screen_height: deviceInfo.screenHeight, viewport_width: deviceInfo.viewportWidth, viewport_height: deviceInfo.viewportHeight, language: deviceInfo.language, timezone: deviceInfo.timezone })
          .select('id').single();
        if (!error && data) sessionDbIdRef.current = data.id;
      } catch (err) { console.error('Analytics session error:', err); }
    }
    return sessionDbIdRef.current;
  }, [user?.id, location.pathname]);

  const trackPageView = useCallback(async () => {
    const visitorId = getVisitorId();
    const sessionId = await ensureSession();

    if (currentPageViewIdRef.current) {
      const timeOnPage = Math.round((Date.now() - pageStartTimeRef.current) / 1000);
      try {
        await analyticsQuery('analytics_page_views').update({ time_on_page_seconds: timeOnPage, scroll_depth_percent: maxScrollDepthRef.current, exited_at: new Date().toISOString() }).eq('id', currentPageViewIdRef.current);
      } catch (err) { console.error('Analytics page view update error:', err); }
    }

    pageStartTimeRef.current = Date.now();
    maxScrollDepthRef.current = 0;

    try {
      const { data, error } = await analyticsQuery('analytics_page_views').insert({ session_id: sessionId, visitor_id: visitorId, user_id: user?.id || null, page_path: location.pathname, page_title: document.title, page_url: window.location.href, referrer: document.referrer || null }).select('id').single();
      if (!error && data) currentPageViewIdRef.current = data.id;
      if (sessionId) {
        await analyticsQuery('analytics_sessions').update({ exit_page: location.pathname, is_bounce: false }).eq('id', sessionId);
      }
    } catch (err) { console.error('Analytics page view error:', err); }
  }, [ensureSession, user?.id, location.pathname]);

  const trackEvent = useCallback(async (category: string, action: string, label?: string, value?: number, metadata?: Record<string, unknown>) => {
    const visitorId = getVisitorId();
    const sessionId = sessionDbIdRef.current;
    try {
      await analyticsQuery('analytics_events').insert([{ session_id: sessionId, visitor_id: visitorId, user_id: user?.id || null, event_category: category, event_action: action, event_label: label || null, event_value: value || null, page_path: location.pathname, metadata: metadata || {} }]);
    } catch (err) { console.error('Analytics event error:', err); }
  }, [user?.id, location.pathname]);

  useEffect(() => { trackPageView(); }, [location.pathname, trackPageView]);

  return { trackEvent };
};

export default useAnalyticsTracking;
