import React from 'react';
import { OfflineDataManager } from '@/components/OfflineDataManager';

const OfflineSettings = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Offline Data Management</h1>
          <p className="text-muted-foreground">
            Manage your offline data synchronization and caching preferences
          </p>
        </div>
        
        <OfflineDataManager />
      </div>
    </div>
  );
};

export default OfflineSettings;