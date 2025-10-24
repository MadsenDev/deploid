import { PipelineStep } from './pipeline.js';
import { ShipwrightConfig } from './types.js';

export async function loadPlugin(pluginName: string, config: ShipwrightConfig): Promise<PipelineStep> {
  // For now, we'll load plugins from the local packages
  // In the future, this could load from npm or local files
  
  switch (pluginName) {
    case 'assets':
      // Load assets plugin dynamically
      const assetsPath = new URL('../../plugins/assets/dist/index.js', import.meta.url).pathname;
      const { assetsPlugin } = await import(assetsPath);
      return assetsPlugin();
    
    case 'packaging-capacitor':
      // Load Capacitor plugin dynamically
      const capacitorPath = new URL('../../plugins/packaging-capacitor/dist/index.js', import.meta.url).pathname;
      const { packagingCapacitor } = await import(capacitorPath);
      return packagingCapacitor();
    
    case 'packaging-tauri':
      // TODO: Implement Tauri plugin
      return async ({ logger }) => logger.info('Tauri packaging not yet implemented');
    
    case 'packaging-twa':
      // TODO: Implement TWA plugin
      return async ({ logger }) => logger.info('TWA packaging not yet implemented');
    
    case 'build-android':
      // Load Android build plugin
      const buildPath = new URL('../../plugins/build-android/dist/index.js', import.meta.url).pathname;
      const { buildAndroidPlugin } = await import(buildPath);
      return buildAndroidPlugin();
    
    case 'debug-network':
      // Load debug network plugin
      const debugPath = new URL('../../plugins/debug-network/dist/index.js', import.meta.url).pathname;
      const { debugNetwork } = await import(debugPath);
      return async ({ cwd }) => debugNetwork(cwd);
    
    case 'deploy-android':
      // Load deploy Android plugin
      const deployPath = new URL('../../plugins/deploy-android/dist/index.js', import.meta.url).pathname;
      const { deployAndroid } = await import(deployPath);
      return deployAndroid();
    
    case 'prepare-ios':
      // Load prepare iOS plugin
      const iosPath = new URL('../../plugins/prepare-ios/dist/index.js', import.meta.url).pathname;
      const { prepareIos } = await import(iosPath);
      return prepareIos();
    
    default:
      throw new Error(`Unknown plugin: ${pluginName}`);
  }
}

export async function loadPluginsFromConfig(config: ShipwrightConfig): Promise<PipelineStep[]> {
  const steps: PipelineStep[] = [];
  
  // Load plugins based on config
  if (config.assets?.source) {
    steps.push(await loadPlugin('assets', config));
  }
  
  // Load packaging plugin based on android.packaging
  const packagingPlugin = `packaging-${config.android.packaging}`;
  steps.push(await loadPlugin(packagingPlugin, config));
  
  return steps;
}
