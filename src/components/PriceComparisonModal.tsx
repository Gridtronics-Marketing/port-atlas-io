import React, { useState } from 'react';
import { useSupplierCatalog, type PriceComparison } from '@/hooks/useSupplierCatalog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

interface PriceComparisonModalProps {
  trigger?: React.ReactNode;
}

export const PriceComparisonModal: React.FC<PriceComparisonModalProps> = ({ trigger }) => {
  const { getPriceComparison } = useSupplierCatalog();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [comparison, setComparison] = useState<PriceComparison | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const result = await getPriceComparison(searchTerm);
      setComparison(result);
    } catch (error) {
      console.error('Error getting price comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBestPrice = () => {
    if (!comparison || comparison.suppliers.length === 0) return null;
    return Math.min(...comparison.suppliers.map(s => s.unit_price));
  };

  const getWorstPrice = () => {
    if (!comparison || comparison.suppliers.length === 0) return null;
    return Math.max(...comparison.suppliers.map(s => s.unit_price));
  };

  const getPriceDifferenceIcon = (price: number, bestPrice: number) => {
    if (price === bestPrice) return <Minus className="h-4 w-4 text-muted-foreground" />;
    return price > bestPrice ? 
      <TrendingUp className="h-4 w-4 text-red-500" /> : 
      <TrendingDown className="h-4 w-4 text-green-500" />;
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'default';
      case 'limited': return 'outline';
      case 'out_of_stock': return 'destructive';
      case 'discontinued': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Compare Prices
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Price Comparison</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search */}
          <div className="flex space-x-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="search">Search Item</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter item name to compare prices"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="pt-7">
              <Button onClick={handleSearch} disabled={loading || !searchTerm.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Results */}
          {comparison && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Best Price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ${getBestPrice()?.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Highest Price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      ${getWorstPrice()?.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Price Range</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ${(getWorstPrice()! - getBestPrice()!).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Price Comparison for "{comparison.item_name}"</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead>Lead Time</TableHead>
                        <TableHead>Min Order</TableHead>
                        <TableHead>Savings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparison.suppliers
                        .sort((a, b) => a.unit_price - b.unit_price)
                        .map((supplier, index) => {
                          const bestPrice = getBestPrice()!;
                          const savings = supplier.unit_price - bestPrice;
                          const savingsPercentage = bestPrice > 0 ? (savings / bestPrice) * 100 : 0;

                          return (
                            <TableRow key={supplier.supplier_id}>
                              <TableCell className="font-medium">
                                {supplier.supplier_name}
                                {index === 0 && (
                                  <Badge variant="default" className="ml-2">Best Price</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getPriceDifferenceIcon(supplier.unit_price, bestPrice)}
                                  <span className={supplier.unit_price === bestPrice ? 'font-bold text-green-600' : ''}>
                                    ${supplier.unit_price.toFixed(2)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getAvailabilityColor(supplier.availability_status)}>
                                  {supplier.availability_status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>{supplier.lead_time_days} days</TableCell>
                              <TableCell>{supplier.minimum_order_quantity}</TableCell>
                              <TableCell>
                                {savings === 0 ? (
                                  <span className="text-green-600 font-medium">Best Price</span>
                                ) : (
                                  <span className="text-red-500">
                                    +${savings.toFixed(2)} ({savingsPercentage.toFixed(1)}%)
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const bestPriceSupplier = comparison.suppliers.find(s => s.unit_price === getBestPrice());
                      const fastestDelivery = comparison.suppliers.reduce((prev, current) => 
                        prev.lead_time_days < current.lead_time_days ? prev : current
                      );
                      
                      return (
                        <>
                          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                            <TrendingDown className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-800">Best Price Option</p>
                              <p className="text-sm text-green-700">
                                {bestPriceSupplier?.supplier_name} offers the lowest price at ${bestPriceSupplier?.unit_price.toFixed(2)}
                                {bestPriceSupplier?.lead_time_days && ` with ${bestPriceSupplier.lead_time_days} days lead time`}
                              </p>
                            </div>
                          </div>
                          
                          {fastestDelivery.supplier_id !== bestPriceSupplier?.supplier_id && (
                            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                              <div>
                                <p className="font-medium text-blue-800">Fastest Delivery</p>
                                <p className="text-sm text-blue-700">
                                  {fastestDelivery.supplier_name} offers fastest delivery in {fastestDelivery.lead_time_days} days 
                                  at ${fastestDelivery.unit_price.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!comparison && !loading && searchTerm && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No pricing data found for "{searchTerm}". Try a different search term.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};