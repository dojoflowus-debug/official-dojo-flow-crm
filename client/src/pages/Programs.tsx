import { useState } from 'react';
import BottomNavLayout from '@/components/BottomNavLayout';
import { useTheme } from '@/contexts/ThemeContext';
import Breadcrumb from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Users, DollarSign, Calendar, BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

// Dark mode hook wrapper
const useDarkMode = () => {
  const { theme } = useTheme();
  return theme === 'dark' || theme === 'cinematic';
};

// Format price from cents to dollars
const formatPrice = (cents: number | null | undefined) => {
  if (!cents) return '$0';
  return `$${(cents / 100).toFixed(0)}`;
};

// Program type badge colors
const typeColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  membership: { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400' },
  class_pack: { bg: 'bg-purple-100', text: 'text-purple-700', darkBg: 'bg-purple-900/30', darkText: 'text-purple-400' },
  drop_in: { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'bg-green-900/30', darkText: 'text-green-400' },
  private: { bg: 'bg-amber-100', text: 'text-amber-700', darkBg: 'bg-amber-900/30', darkText: 'text-amber-400' },
};

// Type labels
const typeLabels: Record<string, string> = {
  membership: 'Membership',
  class_pack: 'Class Pack',
  drop_in: 'Drop-In',
  private: 'Private Lessons',
};

// Billing labels
const billingLabels: Record<string, string> = {
  monthly: 'Monthly',
  weekly: 'Weekly',
  per_session: 'Per Session',
  one_time: 'One Time',
};

interface ProgramFormData {
  name: string;
  type: 'membership' | 'class_pack' | 'drop_in' | 'private';
  ageRange: string;
  billing: 'monthly' | 'weekly' | 'per_session' | 'one_time';
  price: string;
  contractLength: string;
  maxSize: string;
  description: string;
  isCoreProgram: boolean;
  showOnKiosk: boolean;
  allowAutopilot: boolean;
}

const defaultFormData: ProgramFormData = {
  name: '',
  type: 'membership',
  ageRange: '',
  billing: 'monthly',
  price: '',
  contractLength: 'month-to-month',
  maxSize: '20',
  description: '',
  isCoreProgram: false,
  showOnKiosk: true,
  allowAutopilot: false,
};

export default function Programs() {
  const isDark = useDarkMode();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [formData, setFormData] = useState<ProgramFormData>(defaultFormData);

  // Fetch programs
  const { data: programs, isLoading, refetch } = trpc.programs.list.useQuery();

  // Mutations
  const createMutation = trpc.programs.create.useMutation({
    onSuccess: () => {
      toast.success('Program created successfully');
      setIsAddOpen(false);
      setFormData(defaultFormData);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create program: ${error.message}`);
    },
  });

  const updateMutation = trpc.programs.update.useMutation({
    onSuccess: () => {
      toast.success('Program updated successfully');
      setIsEditOpen(false);
      setSelectedProgram(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update program: ${error.message}`);
    },
  });

  const deleteMutation = trpc.programs.delete.useMutation({
    onSuccess: () => {
      toast.success('Program deleted successfully');
      setIsDeleteOpen(false);
      setSelectedProgram(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete program: ${error.message}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Program name is required');
      return;
    }
    createMutation.mutate({
      name: formData.name,
      type: formData.type,
      ageRange: formData.ageRange || undefined,
      billing: formData.billing,
      price: formData.price ? Math.round(parseFloat(formData.price) * 100) : undefined,
      contractLength: formData.contractLength || undefined,
      maxSize: formData.maxSize ? parseInt(formData.maxSize) : undefined,
      description: formData.description || undefined,
      isCoreProgram: formData.isCoreProgram,
      showOnKiosk: formData.showOnKiosk,
      allowAutopilot: formData.allowAutopilot,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;
    updateMutation.mutate({
      id: selectedProgram.id,
      name: formData.name,
      type: formData.type,
      ageRange: formData.ageRange || undefined,
      billing: formData.billing,
      price: formData.price ? Math.round(parseFloat(formData.price) * 100) : undefined,
      contractLength: formData.contractLength || undefined,
      maxSize: formData.maxSize ? parseInt(formData.maxSize) : undefined,
      description: formData.description || undefined,
      isCoreProgram: formData.isCoreProgram,
      showOnKiosk: formData.showOnKiosk,
      allowAutopilot: formData.allowAutopilot,
    });
  };

  const handleDelete = () => {
    if (!selectedProgram) return;
    deleteMutation.mutate({ id: selectedProgram.id });
  };

  const openEditModal = (program: any) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      type: program.type,
      ageRange: program.ageRange || '',
      billing: program.billing || 'monthly',
      price: program.price ? (program.price / 100).toString() : '',
      contractLength: program.contractLength || 'month-to-month',
      maxSize: program.maxSize?.toString() || '20',
      description: program.description || '',
      isCoreProgram: program.isCoreProgram === 1,
      showOnKiosk: program.showOnKiosk === 1,
      allowAutopilot: program.allowAutopilot === 1,
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (program: any) => {
    setSelectedProgram(program);
    setIsDeleteOpen(true);
  };

  const ProgramForm = ({ onSubmit, submitText }: { onSubmit: (e: React.FormEvent) => void; submitText: string }) => (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Program Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Kids Martial Arts"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Program Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="membership">Membership</SelectItem>
                <SelectItem value="class_pack">Class Pack</SelectItem>
                <SelectItem value="drop_in">Drop-In</SelectItem>
                <SelectItem value="private">Private Lessons</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="ageRange">Age Range</Label>
            <Input
              id="ageRange"
              name="ageRange"
              value={formData.ageRange}
              onChange={handleInputChange}
              placeholder="e.g., 6-12 years"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className={`p-4 rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-primary" />
          <span className={`text-sm font-semibold ${isDark ? 'text-white/80' : 'text-gray-700'}`}>Pricing</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="99.00"
            />
          </div>

          <div>
            <Label htmlFor="billing">Billing Cycle</Label>
            <Select value={formData.billing} onValueChange={(value) => handleSelectChange('billing', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select billing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="per_session">Per Session</SelectItem>
                <SelectItem value="one_time">One Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contractLength">Contract</Label>
            <Select value={formData.contractLength} onValueChange={(value) => handleSelectChange('contractLength', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select contract" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month-to-month">Month-to-Month</SelectItem>
                <SelectItem value="3 months">3 Months</SelectItem>
                <SelectItem value="6 months">6 Months</SelectItem>
                <SelectItem value="12 months">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Capacity & Description */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="maxSize">Max Class Size</Label>
          <Input
            id="maxSize"
            name="maxSize"
            type="number"
            value={formData.maxSize}
            onChange={handleInputChange}
            placeholder="20"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Brief description of this program..."
            rows={3}
          />
        </div>
      </div>

      {/* Options */}
      <div className={`p-4 rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className={`text-sm font-semibold ${isDark ? 'text-white/80' : 'text-gray-700'}`}>Options</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Core Program</Label>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                Featured prominently in enrollment
              </p>
            </div>
            <Switch
              checked={formData.isCoreProgram}
              onCheckedChange={(checked) => handleSwitchChange('isCoreProgram', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show on Kiosk</Label>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                Visible on self-service kiosk
              </p>
            </div>
            <Switch
              checked={formData.showOnKiosk}
              onCheckedChange={(checked) => handleSwitchChange('showOnKiosk', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Autopilot</Label>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                Enable automated billing
              </p>
            </div>
            <Switch
              checked={formData.allowAutopilot}
              onCheckedChange={(checked) => handleSwitchChange('allowAutopilot', checked)}
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {createMutation.isPending || updateMutation.isPending ? 'Saving...' : submitText}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <BottomNavLayout>
      <div className={`min-h-screen ${isDark ? 'bg-[#0F1115]' : 'bg-gray-50'}`}>
        {/* Breadcrumb */}
        <div className={`sticky top-[72px] z-10 backdrop-blur-sm border-b ${isDark ? 'bg-[#0F1115]/80 border-white/10' : 'bg-white/80 border-gray-200'}`}>
          <div className="px-6 py-2">
            <Breadcrumb items={[{ label: 'Kai Command', href: '/' }, { label: 'Programs' }]} />
          </div>
        </div>

        {/* Header */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Programs</h1>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                Manage your martial arts programs and pricing
              </p>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setFormData(defaultFormData)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Program
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Program</DialogTitle>
                </DialogHeader>
                <ProgramForm onSubmit={handleCreate} submitText="Create Program" />
              </DialogContent>
            </Dialog>
          </div>

          {/* Programs Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : programs && programs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((program) => {
                const colors = typeColors[program.type] || typeColors.membership;
                return (
                  <div
                    key={program.id}
                    className={`p-5 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                      isDark
                        ? 'bg-[#18181A] border-white/10 hover:border-white/20'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {program.name}
                          </h3>
                          {program.isCoreProgram === 1 && (
                            <Sparkles className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            isDark ? colors.darkBg + ' ' + colors.darkText : colors.bg + ' ' + colors.text
                          }`}
                        >
                          {typeLabels[program.type]}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditModal(program)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => openDeleteModal(program)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2">
                      {program.price && (
                        <div className="flex items-center gap-2">
                          <DollarSign className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                          <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            {formatPrice(program.price)}/{billingLabels[program.billing || 'monthly']?.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {program.ageRange && (
                        <div className="flex items-center gap-2">
                          <Users className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                          <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            {program.ageRange}
                          </span>
                        </div>
                      )}
                      {program.contractLength && (
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                          <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            {program.contractLength}
                          </span>
                        </div>
                      )}
                      {program.maxSize && (
                        <div className="flex items-center gap-2">
                          <BookOpen className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                          <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            Max {program.maxSize} students
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {program.description && (
                      <p className={`mt-3 text-sm line-clamp-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                        {program.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-12 rounded-xl border ${isDark ? 'bg-[#18181A] border-white/10' : 'bg-white border-gray-200'}`}>
              <BookOpen className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-white/20' : 'text-gray-300'}`} />
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                No programs yet
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                Create your first program to get started
              </p>
              <Button onClick={() => { setFormData(defaultFormData); setIsAddOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Program
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
          </DialogHeader>
          <ProgramForm onSubmit={handleUpdate} submitText="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Delete Program
            </DialogTitle>
          </DialogHeader>
          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            Are you sure you want to delete <strong>{selectedProgram?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BottomNavLayout>
  );
}
