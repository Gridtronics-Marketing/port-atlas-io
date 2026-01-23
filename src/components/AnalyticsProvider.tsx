import { ReactNode, createContext, useContext } from 'react';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';

interface AnalyticsContextType {
  trackEvent: (
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, unknown>
  ) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    // Return a no-op if used outside provider (for SSR or tests)
    return {
      trackEvent: async () => {},
    };
  }
  return context;
};

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  const { trackEvent } = useAnalyticsTracking();

  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export default AnalyticsProvider;
