import { PipelineStep } from './pipeline.js';
import { ShipwrightConfig } from './types.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadPlugin(pluginName: string, config: ShipwrightConfig): Promise<PipelineStep> {
  try {
    // First try to load from project's node_modules
    const projectPluginPath = join(process.cwd(), 'node_modules', `deploid-plugin-${pluginName}`, 'dist', 'index.js');
    if (fs.existsSync(projectPluginPath)) {
      const plugin = await import(projectPluginPath);
      if (plugin.default) {
        // Call the plugin function to get the PipelineStep
        return plugin.default();
      }
      const pluginFunction = plugin[pluginName.replace(/-/g, '')];
      if (pluginFunction) {
        return pluginFunction();
      }
    }
    
    // Fallback to bundled plugins in CLI package
    const bundledPluginPath = join(__dirname, '..', '..', 'plugins', pluginName, 'index.js');
    const plugin = await import(bundledPluginPath);
    
    if (plugin.default) {
      // Call the plugin function to get the PipelineStep
      return plugin.default();
    }
    
    // If no default export, look for a function with the plugin name
    const pluginFunction = plugin[pluginName.replace(/-/g, '')];
    if (pluginFunction) {
      return pluginFunction();
    }
    
    throw new Error(`Plugin ${pluginName} not found or has no default export`);
  } catch (error) {
    throw new Error(`Failed to load plugin ${pluginName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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