import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Minus,
  RotateCcw,
  Search,
  Filter,
  DollarSign,
  Box,
  Truck
} from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';

const categories = [
  'Cables',
  'Connectors', 
  'Patch Panels',
  'Switches',
  'Routers',
  'Accessories',
  'Tools',
  'Hardware',
];

const unitsOfMeasure = [
  'each',
  'feet',
  'meters',
  'box',
  'pack',
  'roll',
  'pair',
  'pound',
];

export function InventoryManager() {
  const { 
    inventory, 
    transactions, 
    updateStock, 
    addInventoryItem, 
    getLowStockItems, 
    getInventoryValue,
    loading 
  } = useInventory();
  const { employees } = useEmployees();
  const { projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [stockAction, setStockAction] = useState<'in' | 'out' | 'adjustment'>('in');
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockNotes, setStockNotes] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    sku: '',
    description: '',
    unit_of_measure: 'each',
    current_stock: 0,
    minimum_stock: 1,
    maximum_stock: 100,
    unit_cost: 0,
    supplier: '',
    location: '',
  });

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = getLowStockItems();
  const inventoryValue = getInventoryValue();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockLevel = (item: any) => {
    if (item.maximum_stock) {
      return (item.current_stock / item.maximum_stock) * 100;
    }
    return (item.current_stock / (item.minimum_stock * 2)) * 100;
  };

  const handleAddItem = async () => {
    try {
      await addInventoryItem({
        ...newItem,
        status: 'available',
      });
      setNewItem({
        name: '',
        category: '',
        sku: '',
        description: '',
        unit_of_measure: 'each',
        current_stock: 0,
        minimum_stock: 1,
        maximum_stock: 100,
        unit_cost: 0,
        supplier: '',
        location: '',
      });
      setShowAddItem(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleStockUpdate = async () => {
    if (!selectedItem || !stockQuantity) return;

    try {
      await updateStock(
        selectedItem,
        stockAction,
        parseInt(stockQuantity),
        selectedEmployee || undefined,
        selectedProject || undefined,
        stockNotes || undefined
      );
      
      setSelectedItem(null);
      setStockQuantity('');
      setStockNotes('');
      setSelectedEmployee('');
      setSelectedProject('');
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const categoryStats = categories.map(category => {
    const items = inventory.filter(item => item.category === category);
    const totalValue = items.reduce((sum, item) => sum + (item.current_stock * (item.unit_cost || 0)), 0);
    return {
      category,
      itemCount: items.length,
      totalValue,
    };
  });

  if (loading) {
    return <div className="text-center py-8">Loading inventory...</div>;
  }

  if (!inventory) {
    return <div className="text-center py-8 text-muted-foreground">Failed to load inventory data. Please try refreshing the page.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${inventoryValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={() => setShowAddItem(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="alerts">
            Low Stock ({lowStockItems.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4">
            {filteredInventory.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{item.category}</span>
                          {item.sku && (
                            <>
                              <span>•</span>
                              <span>SKU: {item.sku}</span>
                            </>
                          )}
                          {item.supplier && (
                            <>
                              <span>•</span>
                              <span>{item.supplier}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(item.status)}
                      >
                        {item.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Current Stock:</span>
                      <div className="text-lg font-bold">
                        {item.current_stock} {item.unit_of_measure}
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Min/Max:</span>
                      <div>
                        {item.minimum_stock}/{item.maximum_stock || 'N/A'} {item.unit_of_measure}
                      </div>
                    </div>
                    
                    {item.unit_cost && (
                      <div>
                        <span className="font-medium">Unit Cost:</span>
                        <div>${item.unit_cost.toFixed(2)}</div>
                      </div>
                    )}
                    
                    <div>
                      <span className="font-medium">Total Value:</span>
                      <div className="font-bold">
                        ${(item.current_stock * (item.unit_cost || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Stock Level Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Stock Level</span>
                      <span>{Math.round(getStockLevel(item))}%</span>
                    </div>
                    <Progress 
                      value={getStockLevel(item)} 
                      className="h-2"
                    />
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item.id);
                        setStockAction('in');
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Stock
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item.id);
                        setStockAction('out');
                      }}
                    >
                      <Minus className="h-3 w-3 mr-1" />
                      Remove Stock
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item.id);
                        setStockAction('adjustment');
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Adjust
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <div className="grid gap-4">
            {transactions.slice(0, 20).map((transaction) => {
              const item = inventory.find(i => i.id === transaction.inventory_item_id);
              const employee = employees.find(e => e.id === transaction.employee_id);
              
              return (
                <Card key={transaction.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {transaction.transaction_type === 'in' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        
                        <div>
                          <div className="font-medium">
                            {item?.name || 'Unknown Item'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.transaction_type.toUpperCase()}: {transaction.quantity} {item?.unit_of_measure}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm">
                        <div>{employee?.first_name} {employee?.last_name}</div>
                        <div className="text-muted-foreground">
                          {new Date(transaction.transaction_date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    {transaction.notes && (
                      <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                        {transaction.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          {lowStockItems.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  No low stock alerts
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {lowStockItems.map((item) => (
                <Card key={item.id} className="border-yellow-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Current: {item.current_stock} {item.unit_of_measure} • 
                          Minimum: {item.minimum_stock} {item.unit_of_measure}
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(item.status)}
                      >
                        {item.status === 'out_of_stock' ? 'OUT OF STOCK' : 'LOW STOCK'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stock Update Modal */}
      {selectedItem && (
        <Card className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {stockAction === 'in' ? 'Add Stock' : stockAction === 'out' ? 'Remove Stock' : 'Adjust Stock'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label>
                  {stockAction === 'adjustment' ? 'New Stock Level' : 'Quantity'}
                </Label>
                <Input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </div>
              
              <div>
                <Label>Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Project (Optional)</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Notes</Label>
                <Input
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleStockUpdate}>
                Update Stock
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <Card className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Inventory Item</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Item name"
                />
              </div>
              
              <div>
                <Label>Category</Label>
                <Select 
                  value={newItem.category} 
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>SKU</Label>
                <Input
                  value={newItem.sku}
                  onChange={(e) => setNewItem(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Stock keeping unit"
                />
              </div>
              
              <div>
                <Label>Unit of Measure</Label>
                <Select 
                  value={newItem.unit_of_measure} 
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, unit_of_measure: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsOfMeasure.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Current Stock</Label>
                <Input
                  type="number"
                  value={newItem.current_stock}
                  onChange={(e) => setNewItem(prev => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label>Minimum Stock</Label>
                <Input
                  type="number"
                  value={newItem.minimum_stock}
                  onChange={(e) => setNewItem(prev => ({ ...prev, minimum_stock: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label>Maximum Stock</Label>
                <Input
                  type="number"
                  value={newItem.maximum_stock}
                  onChange={(e) => setNewItem(prev => ({ ...prev, maximum_stock: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label>Unit Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.unit_cost}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Input
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Item description"
                />
              </div>
              
              <div>
                <Label>Supplier</Label>
                <Input
                  value={newItem.supplier}
                  onChange={(e) => setNewItem(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Supplier name"
                />
              </div>
              
              <div>
                <Label>Location</Label>
                <Input
                  value={newItem.location}
                  onChange={(e) => setNewItem(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Storage location"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddItem(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem} disabled={!newItem.name}>
                Add Item
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}