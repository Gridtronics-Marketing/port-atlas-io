import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Wrench } from 'lucide-react';
import { useOrganizationTrades } from '@/hooks/useOrganizationTrades';
import {
  TRADE_CATEGORIES,
  TRADE_DISPLAY_NAMES,
  getTradeColor,
  type TradeType,
} from '@/lib/trade-registry';

interface OrganizationTradesManagerProps {
  organizationId: string;
}

export const OrganizationTradesManager = ({ organizationId }: OrganizationTradesManagerProps) => {
  const { tradeValues, loading, addTrade, removeTrade } = useOrganizationTrades(organizationId);

  const handleToggle = (trade: TradeType, checked: boolean) => {
    if (checked) {
      addTrade(trade);
    } else {
      removeTrade(trade);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Organization Trades
        </CardTitle>
        <CardDescription>
          Select the trades your organization performs. Drop points will be tagged to trades for filtering.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active trades summary */}
        {tradeValues.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tradeValues.map(trade => (
              <Badge
                key={trade}
                style={{ backgroundColor: `hsl(${getTradeColor(trade)} / 0.15)`, color: `hsl(${getTradeColor(trade)})`, borderColor: `hsl(${getTradeColor(trade)} / 0.3)` }}
                variant="outline"
              >
                {TRADE_DISPLAY_NAMES[trade]}
              </Badge>
            ))}
          </div>
        )}

        {TRADE_CATEGORIES.map((category, idx) => (
          <div key={category.label}>
            {idx > 0 && <Separator className="mb-4" />}
            <h4 className="text-sm font-medium text-muted-foreground mb-3">{category.label}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {category.trades.map(trade => (
                <div key={trade} className="flex items-center space-x-2">
                  <Checkbox
                    id={`trade-${trade}`}
                    checked={tradeValues.includes(trade)}
                    onCheckedChange={(checked) => handleToggle(trade, checked as boolean)}
                  />
                  <Label htmlFor={`trade-${trade}`} className="text-sm cursor-pointer">
                    {TRADE_DISPLAY_NAMES[trade]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
