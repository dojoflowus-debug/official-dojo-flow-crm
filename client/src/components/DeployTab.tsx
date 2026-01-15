import React, { useState, useEffect } from 'react';
import { getVersionHistory, saveVersion, deployVersion, rollbackToVersion, deleteVersion, getCurrentDeployedVersion, KioskVersion } from '@/lib/kioskVersionManager';

interface DeployTabProps {
  locationId: string;
  deviceType: string;
  currentConfig: any;
  onVersionDeployed?: (version: KioskVersion) => void;
}

export const DeployTab: React.FC<DeployTabProps> = ({
  locationId,
  deviceType,
  currentConfig,
  onVersionDeployed,
}) => {
  const [versions, setVersions] = useState<KioskVersion[]>([]);
  const [currentDeployed, setCurrentDeployed] = useState<KioskVersion | null>(null);
  const [versionName, setVersionName] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // Load versions on mount
  useEffect(() => {
    loadVersions();
  }, [locationId, deviceType]);

  const loadVersions = () => {
    const history = getVersionHistory(locationId, deviceType);
    setVersions(history.versions);
    const deployed = getCurrentDeployedVersion(locationId, deviceType);
    setCurrentDeployed(deployed);
  };

  const handleSaveVersion = () => {
    if (!versionName.trim()) {
      alert('Please enter a version name');
      return;
    }

    setLoading(true);
    try {
      const newVersion = saveVersion(
        locationId,
        deviceType,
        currentConfig,
        versionName,
        versionDescription
      );
      
      setVersions([...versions, newVersion]);
      setVersionName('');
      setVersionDescription('');
      
      alert(`Version "${newVersion.name}" saved successfully!`);
    } catch (error) {
      alert('Failed to save version');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeployVersion = (versionId: string) => {
    setLoading(true);
    try {
      const deployed = deployVersion(locationId, deviceType, versionId);
      if (deployed) {
        setCurrentDeployed(deployed);
        loadVersions();
        onVersionDeployed?.(deployed);
        alert(`Version "${deployed.name}" deployed successfully!`);
      }
    } catch (error) {
      alert('Failed to deploy version');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = (versionId: string) => {
    if (confirm('Are you sure? This will create a new version based on the selected version.')) {
      setLoading(true);
      try {
        const newVersion = rollbackToVersion(locationId, deviceType, versionId);
        if (newVersion) {
          setCurrentDeployed(newVersion);
          loadVersions();
          onVersionDeployed?.(newVersion);
          alert('Rolled back successfully!');
        }
      } catch (error) {
        alert('Failed to rollback');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteVersion = (versionId: string) => {
    if (confirm('Are you sure you want to delete this version?')) {
      setLoading(true);
      try {
        deleteVersion(locationId, deviceType, versionId);
        loadVersions();
        alert('Version deleted successfully!');
      } catch (error) {
        alert('Failed to delete version');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Save New Version Section */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-white text-lg font-bold mb-4">Save New Version</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Version Name
            </label>
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g., Summer Campaign v1"
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              value={versionDescription}
              onChange={(e) => setVersionDescription(e.target.value)}
              placeholder="Describe what changed in this version..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSaveVersion}
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all"
          >
            {loading ? 'Saving...' : 'Save Version'}
          </button>
        </div>
      </div>

      {/* Current Deployment Status */}
      {currentDeployed && (
        <div className="bg-green-900 bg-opacity-30 rounded-lg p-6 border border-green-700">
          <h3 className="text-green-300 text-lg font-bold mb-2">Currently Deployed</h3>
          <div className="text-gray-300 space-y-1">
            <p><strong>Version:</strong> {currentDeployed.name}</p>
            <p><strong>Number:</strong> v{currentDeployed.versionNumber}</p>
            <p><strong>Deployed:</strong> {new Date(currentDeployed.deployedAt!).toLocaleString()}</p>
            {currentDeployed.description && (
              <p><strong>Description:</strong> {currentDeployed.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Version History */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-white text-lg font-bold mb-4">Version History</h3>
        
        {versions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No versions saved yet. Save your first version above.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {[...versions].reverse().map((version) => (
              <div
                key={version.id}
                className={`p-4 rounded-lg border ${
                  version.isDeployed
                    ? 'bg-green-900 bg-opacity-20 border-green-600'
                    : 'bg-gray-700 border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-bold">{version.name}</h4>
                      {version.isDeployed && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                          DEPLOYED
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      v{version.versionNumber} • {new Date(version.createdAt).toLocaleString()}
                    </p>
                    {version.description && (
                      <p className="text-gray-300 text-sm mt-1">{version.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {!version.isDeployed && (
                    <button
                      onClick={() => handleDeployVersion(version.id)}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs font-bold py-2 px-3 rounded transition-all"
                    >
                      Deploy
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleRollback(version.id)}
                    disabled={loading}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white text-xs font-bold py-2 px-3 rounded transition-all"
                  >
                    Rollback
                  </button>

                  <button
                    onClick={() => handleDeleteVersion(version.id)}
                    disabled={loading || version.isDeployed}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs font-bold py-2 px-3 rounded transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deployment Info */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-white text-lg font-bold mb-4">Deployment Info</h3>
        <div className="text-gray-300 space-y-2 text-sm">
          <p><strong>Location:</strong> {locationId}</p>
          <p><strong>Device Type:</strong> {deviceType}</p>
          <p><strong>Total Versions:</strong> {versions.length}</p>
          {currentDeployed && (
            <p><strong>Last Deployed:</strong> {new Date(currentDeployed.deployedAt!).toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  );
};
