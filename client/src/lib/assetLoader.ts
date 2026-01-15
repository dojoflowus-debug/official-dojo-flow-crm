/**
 * Asset Loader Utility
 * Handles asset loading with comprehensive error logging and diagnostics
 */

export interface AssetLoadResult {
  success: boolean;
  assetId: string;
  assetPath: string;
  error?: string;
  timestamp: number;
}

class AssetLoader {
  private loadedAssets: Map<string, boolean> = new Map();
  private failedAssets: Map<string, string> = new Map();
  private loadResults: AssetLoadResult[] = [];

  /**
   * Log asset load success
   */
  logAssetLoaded(assetId: string, assetPath: string): void {
    this.loadedAssets.set(assetId, true);
    const result: AssetLoadResult = {
      success: true,
      assetId,
      assetPath,
      timestamp: Date.now(),
    };
    this.loadResults.push(result);
    console.log(
      `%c✓ Asset Loaded%c ${assetId}`,
      'color: #22c55e; font-weight: bold;',
      'color: #9ca3af;',
      `Path: ${assetPath}`
    );
  }

  /**
   * Log asset load failure
   */
  logAssetError(assetId: string, assetPath: string, error: string): void {
    this.failedAssets.set(assetId, error);
    const result: AssetLoadResult = {
      success: false,
      assetId,
      assetPath,
      error,
      timestamp: Date.now(),
    };
    this.loadResults.push(result);
    console.error(
      `%c✗ Asset Failed%c ${assetId}`,
      'color: #ef4444; font-weight: bold;',
      'color: #9ca3af;',
      {
        path: assetPath,
        error,
        timestamp: new Date(result.timestamp).toISOString(),
      }
    );
  }

  /**
   * Get asset load status
   */
  getStatus(): {
    totalLoaded: number;
    totalFailed: number;
    failedAssets: Array<{ id: string; error: string }>;
  } {
    return {
      totalLoaded: this.loadedAssets.size,
      totalFailed: this.failedAssets.size,
      failedAssets: Array.from(this.failedAssets.entries()).map(([id, error]) => ({
        id,
        error,
      })),
    };
  }

  /**
   * Print asset loading report to console
   */
  printReport(): void {
    const status = this.getStatus();
    console.group('%c📦 Asset Loading Report', 'color: #3b82f6; font-weight: bold; font-size: 14px;');
    console.log(`✓ Successfully loaded: ${status.totalLoaded}`);
    console.log(`✗ Failed to load: ${status.totalFailed}`);

    if (status.failedAssets.length > 0) {
      console.group('%cFailed Assets', 'color: #ef4444; font-weight: bold;');
      status.failedAssets.forEach(({ id, error }) => {
        console.error(`${id}: ${error}`);
      });
      console.groupEnd();
    }

    console.table(
      this.loadResults.map(r => ({
        Asset: r.assetId,
        Status: r.success ? '✓' : '✗',
        Path: r.assetPath,
        Error: r.error || '-',
      }))
    );
    console.groupEnd();
  }

  /**
   * Check if all assets loaded successfully
   */
  allAssetsLoaded(): boolean {
    return this.failedAssets.size === 0;
  }
}

// Export singleton instance
export const assetLoader = new AssetLoader();

/**
 * Preload image and log result
 */
export async function preloadImage(
  src: string,
  assetId: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      assetLoader.logAssetLoaded(assetId, src);
      resolve({ success: true });
    };
    img.onerror = () => {
      const error = `Failed to load image from ${src}`;
      assetLoader.logAssetError(assetId, src, error);
      resolve({ success: false, error });
    };
    img.src = src;
  });
}
