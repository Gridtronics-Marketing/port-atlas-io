import React, { useState } from 'react';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

export const SuppliersManager = () => {
  const { suppliers, loading } = useSuppliers();

  if (loading) {
    return <div>Loading suppliers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Suppliers</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <Card key={supplier.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{supplier.name}</span>
                <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                  {supplier.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {supplier.contact_name && (
                  <p><strong>Contact:</strong> {supplier.contact_name}</p>
                )}
                {supplier.contact_email && (
                  <p><strong>Email:</strong> {supplier.contact_email}</p>
                )}
                {supplier.contact_phone && (
                  <p><strong>Phone:</strong> {supplier.contact_phone}</p>
                )}
                <p><strong>Payment Terms:</strong> {supplier.payment_terms}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};