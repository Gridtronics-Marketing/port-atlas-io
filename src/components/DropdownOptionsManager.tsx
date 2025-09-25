import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { DropdownOptionForm } from './DropdownOptionForm';

export const DropdownOptionsManager = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { options, loading, deleteOption, getCategories } = useDropdownOptions(selectedCategory);

  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await getCategories();
      setCategories(cats);
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0]);
      }
    };
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this option?')) {
      await deleteOption(id);
    }
  };

  const handleEdit = (option: any) => {
    setSelectedOption(option);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedOption(null);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedOption(null);
  };

  if (loading) {
    return <div className="text-center">Loading dropdown options...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Dropdown Options</h3>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedOption ? 'Edit Option' : 'Add Option'}
              </DialogTitle>
            </DialogHeader>
            <DropdownOptionForm 
              option={selectedOption} 
              defaultCategory={selectedCategory}
              onClose={handleClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {selectedCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">
              {selectedCategory.replace(/_/g, ' ')} Options
            </CardTitle>
            <CardDescription>
              Manage dropdown options for {selectedCategory.replace(/_/g, ' ')} category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{option.display_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {option.option_key}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Order: {option.sort_order}
                      </Badge>
                    </div>
                    <p className="text-sm font-mono bg-background px-2 py-1 rounded">
                      {option.option_value}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(option)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(option.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {options.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No options found for this category. Add your first option to get started.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};