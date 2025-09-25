import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Contract {
  id: string;
  client_id: string;
  contract_number: string;
  contract_type: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  contract_value: number;
  billing_frequency: string;
  status: string;
  terms_and_conditions?: string;
  signed_date?: string;
  signed_by_client?: string;
  signed_by_company?: string;
  client_signature_url?: string;
  company_signature_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ServicePlan {
  id: string;
  contract_id: string;
  plan_name: string;
  description?: string;
  service_frequency: string;
  service_duration_hours: number;
  equipment_covered: any;
  locations_covered: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useContracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:clients(name, contact_name, contact_email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contracts.",
        variant: "destructive",
      });
    }
  };

  const fetchServicePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('service_plans')
        .select(`
          *,
          contract:contracts(title, client:clients(name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServicePlans(data || []);
    } catch (error) {
      console.error('Error fetching service plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch service plans.",
        variant: "destructive",
      });
    }
  };

  const createContract = async (contractData: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single();

      if (error) throw error;

      await fetchContracts();
      toast({
        title: "Success",
        description: "Contract created successfully.",
      });

      return data;
    } catch (error) {
      console.error('Error creating contract:', error);
      toast({
        title: "Error",
        description: "Failed to create contract.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateContract = async (id: string, updates: Partial<Contract>) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchContracts();
      toast({
        title: "Success",
        description: "Contract updated successfully.",
      });
    } catch (error) {
      console.error('Error updating contract:', error);
      toast({
        title: "Error",
        description: "Failed to update contract.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signContract = async (
    contractId: string,
    signatureData: string,
    signerName: string,
    signerRole: string,
    signatureType: 'client' | 'company'
  ) => {
    try {
      // Store signature
      const { data: signature, error: sigError } = await supabase
        .from('signatures')
        .insert({
          related_table: 'contracts',
          related_id: contractId,
          signature_type: signatureType,
          signature_data: signatureData,
          signer_name: signerName,
          signer_role: signerRole,
        })
        .select()
        .single();

      if (sigError) throw sigError;

      // Update contract with signature URL and details
      const updates: Partial<Contract> = {
        signed_date: new Date().toISOString(),
      };

      if (signatureType === 'client') {
        updates.signed_by_client = signerName;
        updates.client_signature_url = signature.id;
      } else {
        updates.signed_by_company = signerName;
        updates.company_signature_url = signature.id;
      }

      // If both signatures exist, mark as active
      const contract = contracts.find(c => c.id === contractId);
      if (contract) {
        const hasClientSig = signatureType === 'client' || contract.client_signature_url;
        const hasCompanySig = signatureType === 'company' || contract.company_signature_url;
        
        if (hasClientSig && hasCompanySig) {
          updates.status = 'active';
        }
      }

      await updateContract(contractId, updates);

      toast({
        title: "Success",
        description: "Contract signed successfully.",
      });
    } catch (error) {
      console.error('Error signing contract:', error);
      toast({
        title: "Error",
        description: "Failed to sign contract.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createServicePlan = async (planData: Omit<ServicePlan, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('service_plans')
        .insert(planData)
        .select()
        .single();

      if (error) throw error;

      await fetchServicePlans();
      toast({
        title: "Success",
        description: "Service plan created successfully.",
      });

      return data;
    } catch (error) {
      console.error('Error creating service plan:', error);
      toast({
        title: "Error",
        description: "Failed to create service plan.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getRevenueMetrics = async () => {
    try {
      const { data: contractData, error } = await supabase
        .from('contracts')
        .select('contract_value, billing_frequency, status, start_date, end_date');

      if (error) throw error;

      const activeContracts = contractData?.filter(c => c.status === 'active') || [];
      const totalValue = activeContracts.reduce((sum, c) => sum + Number(c.contract_value), 0);
      
      // Calculate MRR (Monthly Recurring Revenue)
      const mrr = activeContracts.reduce((sum, contract) => {
        const value = Number(contract.contract_value);
        switch (contract.billing_frequency) {
          case 'monthly':
            return sum + value;
          case 'quarterly':
            return sum + (value / 3);
          case 'annually':
            return sum + (value / 12);
          default:
            return sum;
        }
      }, 0);

      return {
        totalContracts: contractData?.length || 0,
        activeContracts: activeContracts.length,
        totalValue,
        mrr,
        averageContractValue: activeContracts.length ? totalValue / activeContracts.length : 0,
      };
    } catch (error) {
      console.error('Error calculating revenue metrics:', error);
      return {
        totalContracts: 0,
        activeContracts: 0,
        totalValue: 0,
        mrr: 0,
        averageContractValue: 0,
      };
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchContracts(), fetchServicePlans()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    contracts,
    servicePlans,
    loading,
    createContract,
    updateContract,
    signContract,
    createServicePlan,
    getRevenueMetrics,
    refetch: () => Promise.all([fetchContracts(), fetchServicePlans()]),
  };
};