import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Monitor, Plus, Settings, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function KioskDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all locations with kiosk configurations
  const { data: locations, isLoading, error } = trpc.kiosk.listLocations.useQuery();

  const filteredLocations = locations?.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.slug.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleOpenKiosk = (slug: string) => {
    navigate(`/kiosk/${slug}`);
  };

  const handleManageSettings = (locationId: number) => {
    // Navigate to kiosk settings page
    navigate('/settings/kiosk');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kiosk Manager</h1>
          <p className="text-muted-foreground mt-1">
            Manage and access your front-desk check-in kiosks
          </p>
        </div>
        <Button
          onClick={() => navigate('/settings/kiosk')}
          variant="outline"
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Configure Kiosks
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Monitor className="h-4 w-4" />
        <AlertDescription>
          Kiosks are optimized for iPad and large touch screens. They can also be accessed on desktop for testing.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by location name or slug..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="inline-block animate-spin">
              <Monitor className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Loading kiosks...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load kiosks. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredLocations.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Kiosks Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? 'No kiosks match your search. Try a different term.'
                : 'Get started by configuring your first kiosk location.'}
            </p>
            <Button onClick={() => navigate('/settings/kiosk')} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Kiosk
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Kiosk Grid */}
      {!isLoading && !error && filteredLocations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => (
            <Card key={location.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{location.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {location.slug}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {location.status || 'Active'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Location Details */}
                <div className="space-y-2 text-sm">
                  {location.address && (
                    <div>
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium">{location.address}</p>
                    </div>
                  )}
                  {location.timezone && (
                    <div>
                      <p className="text-muted-foreground">Timezone</p>
                      <p className="font-medium">{location.timezone}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleOpenKiosk(location.slug)}
                    className="flex-1 gap-2"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Kiosk
                  </Button>
                  <Button
                    onClick={() => handleManageSettings(location.id)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
