import { useState, useEffect } from 'react';
import { getAvatarName } from '@/../../shared/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Loader2, Plus, Trash2, DollarSign, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Step4ProgramsProps {
  onNext: () => void;
  onBack: () => void;
}

interface ProgramData {
  id?: number;
  name: string;
  type: 'membership' | 'class_pack' | 'drop_in' | 'private';
  ageRange: string;
  billing: 'monthly' | 'weekly' | 'per_session' | 'one_time';
  price: number; // in cents
  contractLength: string;
  maxSize: number;
  isCoreProgram: boolean;
  showOnKiosk: boolean;
  allowAutopilot: boolean;
  description: string;
}

export default function Step4Programs({ onNext, onBack }: Step4ProgramsProps) {
  const [avatarName] = useState(() => getAvatarName());
  const [programs, setPrograms] = useState<ProgramData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramData | null>(null);
  const [usePreset, setUsePreset] = useState(true);

  // Fetch existing data
  const { data: programsData, isLoading, refetch } = trpc.setupWizard.getPrograms.useQuery();
  const { data: industryData } = trpc.setupWizard.getIndustry.useQuery();
  const createProgramMutation = trpc.setupWizard.createProgram.useMutation();
  const updateProgramMutation = trpc.setupWizard.updateProgram.useMutation();
  const deleteProgramMutation = trpc.setupWizard.deleteProgram.useMutation();
  const loadPresetMutation = trpc.setupWizard.loadPresetPrograms.useMutation();

  useEffect(() => {
    if (programsData) {
      setPrograms(programsData as any);
    }
  }, [programsData]);

  const handleLoadPresets = async () => {
    if (!industryData?.industry) {
      alert('Industry not set. Please go back and select an industry.');
      return;
    }

    try {
      await loadPresetMutation.mutateAsync({ industry: industryData.industry as any });
      refetch();
    } catch (error) {
      console.error('Error loading presets:', error);
      alert('Failed to load presets. Please try again.');
    }
  };

  const handleAddProgram = () => {
    setEditingProgram({
      name: '',
      type: 'membership',
      ageRange: 'All ages',
      billing: 'monthly',
      price: 9900, // $99
      contractLength: 'month-to-month',
      maxSize: 20,
      isCoreProgram: false,
      showOnKiosk: true,
      allowAutopilot: false,
      description: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditProgram = (program: ProgramData) => {
    setEditingProgram(program);
    setIsDialogOpen(true);
  };

  const handleSaveProgram = async () => {
    if (!editingProgram || !editingProgram.name) {
      alert('Please enter a program name');
      return;
    }

    try {
      if (editingProgram.id) {
        await updateProgramMutation.mutateAsync({
          id: editingProgram.id,
          name: editingProgram.name,
          type: editingProgram.type,
          ageRange: editingProgram.ageRange,
          billing: editingProgram.billing,
          price: editingProgram.price,
          contractLength: editingProgram.contractLength,
          maxSize: editingProgram.maxSize,
          isCoreProgram: editingProgram.isCoreProgram ? 1 : 0,
          showOnKiosk: editingProgram.showOnKiosk ? 1 : 0,
          allowAutopilot: editingProgram.allowAutopilot ? 1 : 0,
          description: editingProgram.description,
        });
      } else {
        await createProgramMutation.mutateAsync({
          name: editingProgram.name,
          type: editingProgram.type,
          ageRange: editingProgram.ageRange,
          billing: editingProgram.billing,
          price: editingProgram.price,
          contractLength: editingProgram.contractLength,
          maxSize: editingProgram.maxSize,
          isCoreProgram: editingProgram.isCoreProgram ? 1 : 0,
          showOnKiosk: editingProgram.showOnKiosk ? 1 : 0,
          allowAutopilot: editingProgram.allowAutopilot ? 1 : 0,
          description: editingProgram.description,
        });
      }
      refetch();
      setIsDialogOpen(false);
      setEditingProgram(null);
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Failed to save program. Please try again.');
    }
  };

  const handleDeleteProgram = async (id: number) => {
    if (!confirm('Are you sure you want to delete this program?')) return;

    try {
      await deleteProgramMutation.mutateAsync({ id });
      refetch();
    } catch (error) {
      console.error('Error deleting program:', error);
      alert('Failed to delete program. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kai Bubble */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
            K
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{avatarName} says:</span> "These are the offers I can recommend, sell, and protect for you. You can tweak names, prices, and rules anytime—this just gives me a strong starting point."
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Programs & Services</h2>
            <p className="text-sm text-muted-foreground">
              Define what you sell: memberships, class packs, drop-ins, or private sessions
            </p>
          </div>
          <div className="flex gap-2">
            {programs.length === 0 && industryData?.industry && (
              <Button
                variant="outline"
                onClick={handleLoadPresets}
                disabled={loadPresetMutation.isPending}
                className="gap-2"
              >
                {loadPresetMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Load {industryData.industry.replace('_', ' ')} Presets
              </Button>
            )}
            <Button onClick={handleAddProgram} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Program
            </Button>
          </div>
        </div>

        {/* Programs List */}
        {programs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                No programs added yet. Load presets or create your own.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((program) => (
              <Card key={program.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {program.name}
                      {program.isCoreProgram && (
                        <Badge variant="default">Core</Badge>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProgram(program.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-semibold">
                      ${(program.price / 100).toFixed(2)}/{program.billing}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Age Range:</span>
                    <span>{program.ageRange}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Max Size:</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {program.maxSize}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {program.showOnKiosk && (
                      <Badge variant="outline" className="text-xs">
                        Kiosk
                      </Badge>
                    )}
                    {program.allowAutopilot && (
                      <Badge variant="outline" className="text-xs">
                        Autopilot
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleEditProgram(program)}
                  >
                    Edit Program
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Program Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProgram?.id ? 'Edit Program' : 'Add Program'}
            </DialogTitle>
          </DialogHeader>
          {editingProgram && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="programName">
                  Program Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="programName"
                  placeholder="e.g., Kids Karate, All-Access Membership"
                  value={editingProgram.name}
                  onChange={(e) =>
                    setEditingProgram({ ...editingProgram, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={editingProgram.type}
                    onValueChange={(value: any) =>
                      setEditingProgram({ ...editingProgram, type: value })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="membership">Membership</SelectItem>
                      <SelectItem value="class_pack">Class Pack</SelectItem>
                      <SelectItem value="drop_in">Drop-In</SelectItem>
                      <SelectItem value="private">Private Session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing">Billing</Label>
                  <Select
                    value={editingProgram.billing}
                    onValueChange={(value: any) =>
                      setEditingProgram({ ...editingProgram, billing: value })
                    }
                  >
                    <SelectTrigger id="billing">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="per_session">Per Session</SelectItem>
                      <SelectItem value="one_time">One Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={(editingProgram.price / 100).toFixed(2)}
                    onChange={(e) =>
                      setEditingProgram({
                        ...editingProgram,
                        price: Math.round(parseFloat(e.target.value) * 100),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxSize">Max Class Size</Label>
                  <Input
                    id="maxSize"
                    type="number"
                    value={editingProgram.maxSize}
                    onChange={(e) =>
                      setEditingProgram({
                        ...editingProgram,
                        maxSize: parseInt(e.target.value) || 20,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageRange">Age Range</Label>
                <Input
                  id="ageRange"
                  placeholder="e.g., 6-12 years, All ages, 18+"
                  value={editingProgram.ageRange}
                  onChange={(e) =>
                    setEditingProgram({ ...editingProgram, ageRange: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractLength">Contract Length</Label>
                <Input
                  id="contractLength"
                  placeholder="e.g., month-to-month, 6 months, 12 months"
                  value={editingProgram.contractLength}
                  onChange={(e) =>
                    setEditingProgram({
                      ...editingProgram,
                      contractLength: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isCoreProgram">This is my core program</Label>
                  <Switch
                    id="isCoreProgram"
                    checked={editingProgram.isCoreProgram}
                    onCheckedChange={(checked) =>
                      setEditingProgram({ ...editingProgram, isCoreProgram: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showOnKiosk">Show on kiosk & website</Label>
                  <Switch
                    id="showOnKiosk"
                    checked={editingProgram.showOnKiosk}
                    onCheckedChange={(checked) =>
                      setEditingProgram({ ...editingProgram, showOnKiosk: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allowAutopilot">Allow {avatarName} to sell on autopilot</Label>
                  <Switch
                    id="allowAutopilot"
                    checked={editingProgram.allowAutopilot}
                    onCheckedChange={(checked) =>
                      setEditingProgram({ ...editingProgram, allowAutopilot: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProgram}
                  disabled={
                    !editingProgram.name ||
                    createProgramMutation.isPending ||
                    updateProgramMutation.isPending
                  }
                >
                  {(createProgramMutation.isPending || updateProgramMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Save Program
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={programs.length === 0}>
          Continue to Financials
        </Button>
      </div>
    </div>
  );
}
