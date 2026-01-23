import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { usePricingPlans, PricingPlan, PricingFeature } from "@/hooks/usePricingPlans";
import { Plus, Edit2, Trash2, GripVertical, Loader2, Star } from "lucide-react";

export function PricingManagementPanel() {
  const { 
    plans, 
    features, 
    isLoading, 
    createPlan, 
    updatePlan, 
    deletePlan,
    createFeature,
    updateFeature,
    deleteFeature 
  } = usePricingPlans();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFeatureOpen, setIsFeatureOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [editingFeature, setEditingFeature] = useState<PricingFeature | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [planForm, setPlanForm] = useState({
    name: "",
    slug: "",
    description: "",
    price_monthly: "",
    price_yearly: "",
    max_locations: "",
    max_users: "",
    is_popular: false,
    is_enterprise: false,
    is_active: true,
    sort_order: 0,
  });

  const [featureForm, setFeatureForm] = useState({
    feature_name: "",
    feature_value: "",
    is_included: true,
    sort_order: 0,
  });

  const handleEditPlan = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      price_monthly: plan.price_monthly?.toString() || "",
      price_yearly: plan.price_yearly?.toString() || "",
      max_locations: plan.max_locations?.toString() || "",
      max_users: plan.max_users?.toString() || "",
      is_popular: plan.is_popular,
      is_enterprise: plan.is_enterprise,
      is_active: plan.is_active,
      sort_order: plan.sort_order,
    });
    setIsEditOpen(true);
  };

  const handleNewPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: "",
      slug: "",
      description: "",
      price_monthly: "",
      price_yearly: "",
      max_locations: "",
      max_users: "",
      is_popular: false,
      is_enterprise: false,
      is_active: true,
      sort_order: (plans?.length || 0) + 1,
    });
    setIsEditOpen(true);
  };

  const handleSavePlan = async () => {
    const data = {
      name: planForm.name,
      slug: planForm.slug || planForm.name.toLowerCase().replace(/\s+/g, "-"),
      description: planForm.description || null,
      price_monthly: planForm.price_monthly ? parseFloat(planForm.price_monthly) : null,
      price_yearly: planForm.price_yearly ? parseFloat(planForm.price_yearly) : null,
      max_locations: planForm.max_locations ? parseInt(planForm.max_locations) : null,
      max_users: planForm.max_users ? parseInt(planForm.max_users) : null,
      is_popular: planForm.is_popular,
      is_enterprise: planForm.is_enterprise,
      is_active: planForm.is_active,
      sort_order: planForm.sort_order,
    };

    if (editingPlan) {
      await updatePlan.mutateAsync({ id: editingPlan.id, ...data });
    } else {
      await createPlan.mutateAsync(data);
    }
    setIsEditOpen(false);
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm("Are you sure you want to delete this plan? This will also delete all associated features.")) {
      await deletePlan.mutateAsync(id);
    }
  };

  const handleEditFeature = (feature: PricingFeature, planId: string) => {
    setEditingFeature(feature);
    setSelectedPlanId(planId);
    setFeatureForm({
      feature_name: feature.feature_name,
      feature_value: feature.feature_value || "",
      is_included: feature.is_included,
      sort_order: feature.sort_order,
    });
    setIsFeatureOpen(true);
  };

  const handleNewFeature = (planId: string) => {
    setEditingFeature(null);
    setSelectedPlanId(planId);
    const planFeatures = features?.filter(f => f.plan_id === planId) || [];
    setFeatureForm({
      feature_name: "",
      feature_value: "",
      is_included: true,
      sort_order: planFeatures.length + 1,
    });
    setIsFeatureOpen(true);
  };

  const handleSaveFeature = async () => {
    if (!selectedPlanId) return;

    const data = {
      plan_id: selectedPlanId,
      feature_name: featureForm.feature_name,
      feature_value: featureForm.feature_value || null,
      is_included: featureForm.is_included,
      sort_order: featureForm.sort_order,
    };

    if (editingFeature) {
      await updateFeature.mutateAsync({ id: editingFeature.id, ...data });
    } else {
      await createFeature.mutateAsync(data);
    }
    setIsFeatureOpen(false);
  };

  const handleDeleteFeature = async (id: string) => {
    if (confirm("Are you sure you want to delete this feature?")) {
      await deleteFeature.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pricing Plans</CardTitle>
              <CardDescription>Manage your pricing tiers and features</CardDescription>
            </div>
            <Button onClick={handleNewPlan} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {plans?.map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? "opacity-50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {plan.is_popular && (
                          <Badge className="gap-1">
                            <Star className="h-3 w-3" />
                            Popular
                          </Badge>
                        )}
                        {plan.is_enterprise && (
                          <Badge variant="secondary">Enterprise</Badge>
                        )}
                        {!plan.is_active && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditPlan(plan)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-4 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Monthly Price</Label>
                    <p className="font-medium">
                      {plan.price_monthly ? `$${plan.price_monthly}` : "Custom"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Yearly Price</Label>
                    <p className="font-medium">
                      {plan.price_yearly ? `$${plan.price_yearly}` : "Custom"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Max Locations</Label>
                    <p className="font-medium">{plan.max_locations || "Unlimited"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Max Users</Label>
                    <p className="font-medium">{plan.max_users || "Unlimited"}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Features</Label>
                    <Button variant="ghost" size="sm" onClick={() => handleNewFeature(plan.id)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Feature
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {features?.filter(f => f.plan_id === plan.id).map((feature) => (
                      <div key={feature.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                        <div className="flex items-center gap-2">
                          <span className={feature.is_included ? "text-foreground" : "text-muted-foreground line-through"}>
                            {feature.feature_name}
                          </span>
                          {feature.feature_value && (
                            <Badge variant="outline" className="text-xs">{feature.feature_value}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditFeature(feature, plan.id)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteFeature(feature.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "New Plan"}</DialogTitle>
            <DialogDescription>Configure your pricing plan details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={planForm.name}
                  onChange={(e) => setPlanForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Professional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={planForm.slug}
                  onChange={(e) => setPlanForm(p => ({ ...p, slug: e.target.value }))}
                  placeholder="professional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={planForm.description}
                onChange={(e) => setPlanForm(p => ({ ...p, description: e.target.value }))}
                placeholder="For growing businesses..."
                rows={2}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Monthly Price ($)</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  step="0.01"
                  value={planForm.price_monthly}
                  onChange={(e) => setPlanForm(p => ({ ...p, price_monthly: e.target.value }))}
                  placeholder="149.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_yearly">Yearly Price ($)</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  step="0.01"
                  value={planForm.price_yearly}
                  onChange={(e) => setPlanForm(p => ({ ...p, price_yearly: e.target.value }))}
                  placeholder="1430.00"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_locations">Max Locations</Label>
                <Input
                  id="max_locations"
                  type="number"
                  value={planForm.max_locations}
                  onChange={(e) => setPlanForm(p => ({ ...p, max_locations: e.target.value }))}
                  placeholder="10 (leave empty for unlimited)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_users">Max Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  value={planForm.max_users}
                  onChange={(e) => setPlanForm(p => ({ ...p, max_users: e.target.value }))}
                  placeholder="15 (leave empty for unlimited)"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={planForm.is_active}
                  onCheckedChange={(v) => setPlanForm(p => ({ ...p, is_active: v }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_popular"
                  checked={planForm.is_popular}
                  onCheckedChange={(v) => setPlanForm(p => ({ ...p, is_popular: v }))}
                />
                <Label htmlFor="is_popular">Popular Badge</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_enterprise"
                  checked={planForm.is_enterprise}
                  onCheckedChange={(v) => setPlanForm(p => ({ ...p, is_enterprise: v }))}
                />
                <Label htmlFor="is_enterprise">Enterprise</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlan} disabled={!planForm.name}>
              {editingPlan ? "Save Changes" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Feature Dialog */}
      <Dialog open={isFeatureOpen} onOpenChange={setIsFeatureOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFeature ? "Edit Feature" : "New Feature"}</DialogTitle>
            <DialogDescription>Configure feature details for this plan.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feature_name">Feature Name *</Label>
              <Input
                id="feature_name"
                value={featureForm.feature_name}
                onChange={(e) => setFeatureForm(f => ({ ...f, feature_name: e.target.value }))}
                placeholder="Work Order Management"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature_value">Value (optional)</Label>
              <Input
                id="feature_value"
                value={featureForm.feature_value}
                onChange={(e) => setFeatureForm(f => ({ ...f, feature_value: e.target.value }))}
                placeholder="e.g., Unlimited, 10, true"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_included"
                checked={featureForm.is_included}
                onCheckedChange={(v) => setFeatureForm(f => ({ ...f, is_included: v }))}
              />
              <Label htmlFor="is_included">Included in plan</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeatureOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFeature} disabled={!featureForm.feature_name}>
              {editingFeature ? "Save Changes" : "Add Feature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
