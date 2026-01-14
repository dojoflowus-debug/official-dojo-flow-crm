import { useState, useEffect } from 'react';
import { getAvatarName } from '@/../../shared/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/lib/trpc';
import { Loader2, Plus, Trash2, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Step3LocationsProps {
  onNext: () => void;
  onBack: () => void;
}

interface LocationData {
  id?: number;
  name: string;
  address: string;
  insideFacility: boolean;
  facilityName: string;
  operatingHours: string; // JSON string
  timeBlocks: string; // JSON string
}

export default function Step3Locations({ onNext, onBack }: Step3LocationsProps) {
  const [avatarName] = useState(() => getAvatarName());
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationData | null>(null);

  // Fetch existing locations
  const { data: locationsData, isLoading, refetch } = trpc.setupWizard.getLocations.useQuery();
  const createLocationMutation = trpc.setupWizard.createLocation.useMutation();
  const updateLocationMutation = trpc.setupWizard.updateLocation.useMutation();
  const deleteLocationMutation = trpc.setupWizard.deleteLocation.useMutation();

  useEffect(() => {
    if (locationsData) {
      setLocations(locationsData as any);
    }
  }, [locationsData]);

  const handleAddLocation = () => {
    setEditingLocation({
      name: '',
      address: '',
      insideFacility: false,
      facilityName: '',
      operatingHours: JSON.stringify({
        monday: { open: '09:00', close: '21:00' },
        tuesday: { open: '09:00', close: '21:00' },
        wednesday: { open: '09:00', close: '21:00' },
        thursday: { open: '09:00', close: '21:00' },
        friday: { open: '09:00', close: '21:00' },
        saturday: { open: '09:00', close: '17:00' },
        sunday: { open: 'closed', close: 'closed' },
      }),
      timeBlocks: '[]',
    });
    setIsDialogOpen(true);
  };

  const handleEditLocation = (location: LocationData) => {
    setEditingLocation(location);
    setIsDialogOpen(true);
  };

  const handleSaveLocation = async () => {
    if (!editingLocation || !editingLocation.name) {
      alert('Please enter a location name');
      return;
    }

    try {
      if (editingLocation.id) {
        // Update existing
        await updateLocationMutation.mutateAsync({
          id: editingLocation.id,
          name: editingLocation.name,
          address: editingLocation.address,
          insideFacility: editingLocation.insideFacility ? 1 : 0,
          facilityName: editingLocation.facilityName,
          operatingHours: editingLocation.operatingHours,
          timeBlocks: editingLocation.timeBlocks,
        });
      } else {
        // Create new
        await createLocationMutation.mutateAsync({
          name: editingLocation.name,
          address: editingLocation.address,
          insideFacility: editingLocation.insideFacility ? 1 : 0,
          facilityName: editingLocation.facilityName,
          operatingHours: editingLocation.operatingHours,
          timeBlocks: editingLocation.timeBlocks,
        });
      }
      refetch();
      setIsDialogOpen(false);
      setEditingLocation(null);
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Failed to save location. Please try again.');
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      await deleteLocationMutation.mutateAsync({ id });
      refetch();
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location. Please try again.');
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
              <span className="font-semibold">{avatarName} says:</span> "When I know when and where you train, I can keep attendance clean, track capacity, and warn you when classes get too full."
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Locations & Schedule</h2>
            <p className="text-sm text-muted-foreground">
              Add your training locations and operating hours
            </p>
          </div>
          <Button onClick={handleAddLocation} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        </div>

        {/* Locations List */}
        {locations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                No locations added yet. Click "Add Location" to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((location) => (
              <Card key={location.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-red-500" />
                      {location.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLocation(location.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                  {location.insideFacility && location.facilityName && (
                    <p className="text-xs text-muted-foreground">
                      Inside: {location.facilityName}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleEditLocation(location)}
                  >
                    Edit Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Location Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLocation?.id ? 'Edit Location' : 'Add Location'}
            </DialogTitle>
          </DialogHeader>
          {editingLocation && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="locationName">
                  Location Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="locationName"
                  placeholder="e.g., Main Dojo, Downtown Studio"
                  value={editingLocation.name}
                  onChange={(e) =>
                    setEditingLocation({ ...editingLocation, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, City, State 12345"
                  value={editingLocation.address}
                  onChange={(e) =>
                    setEditingLocation({ ...editingLocation, address: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="insideFacility">Inside another facility?</Label>
                  <p className="text-xs text-muted-foreground">
                    e.g., Inside LA Fitness, YMCA, etc.
                  </p>
                </div>
                <Switch
                  id="insideFacility"
                  checked={editingLocation.insideFacility}
                  onCheckedChange={(checked) =>
                    setEditingLocation({ ...editingLocation, insideFacility: checked })
                  }
                />
              </div>

              {editingLocation.insideFacility && (
                <div className="space-y-2">
                  <Label htmlFor="facilityName">Facility Name</Label>
                  <Input
                    id="facilityName"
                    placeholder="e.g., LA Fitness - Plano"
                    value={editingLocation.facilityName}
                    onChange={(e) =>
                      setEditingLocation({
                        ...editingLocation,
                        facilityName: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Operating Hours</Label>
                <p className="text-xs text-muted-foreground">
                  Detailed schedule editor coming soon. Default: Mon-Fri 9am-9pm, Sat 9am-5pm
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveLocation}
                  disabled={
                    !editingLocation.name ||
                    createLocationMutation.isPending ||
                    updateLocationMutation.isPending
                  }
                >
                  {(createLocationMutation.isPending || updateLocationMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Save Location
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
        <Button onClick={onNext} disabled={locations.length === 0}>
          Continue to Programs
        </Button>
      </div>
    </div>
  );
}
