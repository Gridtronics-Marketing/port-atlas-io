import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TradeType } from '@/lib/trade-registry';

export interface OrganizationTrade {
  id: string;
  organization_id: string;
  trade: TradeType;
  created_at: string;
}

export const useOrganizationTrades = (organizationId?: string) => {
  const [trades, setTrades] = useState<OrganizationTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTrades = useCallback(async () => {
    if (!organizationId) {
      setTrades([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organization_trades')
        .select('*')
        .eq('organization_id', organizationId)
        .order('trade');

      if (error) throw error;
      setTrades((data || []) as OrganizationTrade[]);
    } catch (err: any) {
      console.error('Error fetching organization trades:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const addTrade = async (trade: TradeType) => {
    if (!organizationId) return;
    try {
      const { error } = await supabase
        .from('organization_trades')
        .insert({ organization_id: organizationId, trade });
      if (error) throw error;
      await fetchTrades();
      toast({ title: 'Trade added', description: `Added ${trade} to organization.` });
    } catch (err: any) {
      console.error('Error adding trade:', err);
      toast({ title: 'Error', description: 'Failed to add trade.', variant: 'destructive' });
    }
  };

  const removeTrade = async (trade: TradeType) => {
    if (!organizationId) return;
    try {
      const { error } = await supabase
        .from('organization_trades')
        .delete()
        .eq('organization_id', organizationId)
        .eq('trade', trade);
      if (error) throw error;
      await fetchTrades();
      toast({ title: 'Trade removed', description: `Removed ${trade} from organization.` });
    } catch (err: any) {
      console.error('Error removing trade:', err);
      toast({ title: 'Error', description: 'Failed to remove trade.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [organizationId]);

  return {
    trades,
    tradeValues: trades.map(t => t.trade),
    loading,
    addTrade,
    removeTrade,
    fetchTrades,
  };
};
