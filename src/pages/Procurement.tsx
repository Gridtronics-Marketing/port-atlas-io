import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ShoppingCart, Phone, FileText } from 'lucide-react';
import { SuppliersManager } from '@/components/SuppliersManager';
import { PurchaseOrderManager } from '@/components/PurchaseOrderManager';
import { SupplierCatalogManager } from '@/components/SupplierCatalogManager';
import { OpenPhoneManager } from '@/components/OpenPhoneManager';

const Procurement = () => {
  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Procurement & Communications
        </h1>
        <p className="text-muted-foreground mt-1">
          Supplier management, purchase orders, catalog, and integrated communications
        </p>
      </div>

      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suppliers">
            <Package className="h-4 w-4 mr-2" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="catalog">
            <FileText className="h-4 w-4 mr-2" />
            Catalog
          </TabsTrigger>
          <TabsTrigger value="purchase-orders">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="openphone">
            <Phone className="h-4 w-4 mr-2" />
            OpenPhone
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="suppliers" className="space-y-6">
          <SuppliersManager />
        </TabsContent>
        
        <TabsContent value="catalog" className="space-y-6">
          <SupplierCatalogManager />
        </TabsContent>
        
        <TabsContent value="purchase-orders" className="space-y-6">
          <PurchaseOrderManager />
        </TabsContent>

        <TabsContent value="openphone" className="space-y-6">
          <OpenPhoneManager />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Procurement;