import { PipelineStep } from '../../../core/dist/index.js';
import { execa } from 'execa';
import fs from 'node:fs';
import path from 'node:path';

export const packagingCapacitor = (): PipelineStep => async ({ logger, config, cwd }: any) => {
  logger.info(`packaging-capacitor: wrapping ${config.appName} for Android`);
  
  try {
    // Check if Capacitor is installed
    await checkCapacitorInstalled(logger);
    
    // Initialize Capacitor if needed
    await initializeCapacitor(cwd, config, logger);
    
    // Sync web assets
    await syncWebAssets(cwd, config, logger);
    
    // Add Android platform if not exists
    await addAndroidPlatform(cwd, logger);
    
    // Update Android configuration
    await updateAndroidConfig(cwd, config, logger);
    
    // Copy generated icons to Android project
    await copyAndroidIcons(cwd, config, logger);
    
    // Add deployment scripts to package.json
    await addDeploymentScripts(cwd, logger);
    
    // Add push notifications plugin
    await addPushNotificationsPlugin(cwd, logger);
    
    logger.info('✅ Capacitor packaging complete');
  } catch (error) {
    logger.error(`Capacitor packaging failed: ${error}`);
    throw error;
  }
};

async function checkCapacitorInstalled(logger: any): Promise<void> {
  try {
    await execa('npx', ['@capacitor/cli', '--version'], { stdio: 'pipe' });
    logger.debug('Capacitor CLI found');
  } catch (error) {
    logger.warn('Capacitor CLI not found, installing...');
    await execa('npm', ['install', '-g', '@capacitor/cli'], { stdio: 'inherit' });
  }
}

async function initializeCapacitor(cwd: string, config: any, logger: any): Promise<void> {
  const capacitorConfigPath = path.join(cwd, 'capacitor.config.json');
  
  if (!fs.existsSync(capacitorConfigPath)) {
    logger.info('Initializing Capacitor...');
    await execa('npx', ['@capacitor/cli', 'init', config.appName, config.appId], { 
      cwd, 
      stdio: 'inherit' 
    });
  } else {
    logger.debug('Capacitor already initialized');
  }
}

async function syncWebAssets(cwd: string, config: any, logger: any): Promise<void> {
  logger.info('Syncing web assets...');
  
  // First build the web app
  logger.info(`Building web app: ${config.web.buildCommand}`);
  await execa('npm', ['run', 'build'], { cwd, stdio: 'inherit' });
  
  // Then sync with Capacitor
  await execa('npx', ['@capacitor/cli', 'sync'], { cwd, stdio: 'inherit' });
}

async function addAndroidPlatform(cwd: string, logger: any): Promise<void> {
  const androidPath = path.join(cwd, 'android');
  
  if (!fs.existsSync(androidPath)) {
    logger.info('Adding Android platform...');
    await execa('npx', ['@capacitor/cli', 'add', 'android'], { cwd, stdio: 'inherit' });
  } else {
    logger.debug('Android platform already exists');
  }
}

async function updateAndroidConfig(cwd: string, config: any, logger: any): Promise<void> {
  const androidManifestPath = path.join(cwd, 'android/app/src/main/AndroidManifest.xml');
  
  if (fs.existsSync(androidManifestPath)) {
    logger.info('Updating Android configuration...');
    
    // Update target SDK
    if (config.android.targetSdk) {
      const buildGradlePath = path.join(cwd, 'android/app/build.gradle');
      if (fs.existsSync(buildGradlePath)) {
        let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
        buildGradle = buildGradle.replace(
          /compileSdkVersion \d+/,
          `compileSdkVersion ${config.android.targetSdk}`
        );
        buildGradle = buildGradle.replace(
          /targetSdkVersion \d+/,
          `targetSdkVersion ${config.android.targetSdk}`
        );
        fs.writeFileSync(buildGradlePath, buildGradle);
        logger.debug(`Updated target SDK to ${config.android.targetSdk}`);
      }
    }
    
    // Update version info
    if (config.android.version) {
      const buildGradlePath = path.join(cwd, 'android/app/build.gradle');
      if (fs.existsSync(buildGradlePath)) {
        let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
        buildGradle = buildGradle.replace(
          /versionCode \d+/,
          `versionCode ${config.android.version.code}`
        );
        buildGradle = buildGradle.replace(
          /versionName "[^"]*"/,
          `versionName "${config.android.version.name}"`
        );
        fs.writeFileSync(buildGradlePath, buildGradle);
        logger.debug(`Updated version to ${config.android.version.name} (${config.android.version.code})`);
      }
    }
    
    // Update Java version to 17 for compatibility in all build.gradle files
    const androidDir = path.join(cwd, 'android');
    if (fs.existsSync(androidDir)) {
      // Create gradle.properties to set Java version and AndroidX globally
      const gradlePropertiesPath = path.join(androidDir, 'gradle.properties');
      const gradleProperties = `# Java version configuration
org.gradle.java.home=/usr/lib/jvm/java-21-openjdk

# AndroidX configuration
android.useAndroidX=true
android.enableJetifier=true

# Gradle performance optimizations (ChatGPT recommendations)
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.caching=true
org.gradle.daemon=true
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8
`;
      fs.writeFileSync(gradlePropertiesPath, gradleProperties);
      logger.debug('Created gradle.properties with Java 21 and AndroidX configuration');
      
      // Create network security configuration for HTTPS/HTTP requests
      const networkSecurityConfigPath = path.join(androidDir, 'app/src/main/res/xml/network_security_config.xml');
      const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext traffic for localhost and development -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
        <domain includeSubdomains="true">192.168.1.1</domain>
        <domain includeSubdomains="true">192.168.0.1</domain>
    </domain-config>
    
    <!-- Allow external HTTPS domains for testing -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">httpbin.org</domain>
        <domain includeSubdomains="true">google.com</domain>
        <domain includeSubdomains="true">www.google.com</domain>
    </domain-config>
    
    <!-- Base configuration - allow all other domains -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
</network-security-config>`;
      
      // Ensure xml directory exists
      const xmlDir = path.dirname(networkSecurityConfigPath);
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }
      fs.writeFileSync(networkSecurityConfigPath, networkSecurityConfig);
      logger.debug('Created network security configuration');
      
      // Update AndroidManifest.xml with network security config and additional permissions
      const manifestPath = path.join(androidDir, 'app/src/main/AndroidManifest.xml');
      if (fs.existsSync(manifestPath)) {
        let manifestContent = fs.readFileSync(manifestPath, 'utf8');
        
        // Add network security config to application tag (only if not already present)
        if (!manifestContent.includes('android:networkSecurityConfig')) {
          manifestContent = manifestContent.replace(
            /<application([^>]*)>/,
            '<application$1\n        android:networkSecurityConfig="@xml/network_security_config"\n        android:usesCleartextTraffic="true">'
          );
        }
        
        // Add additional permissions before closing manifest tag (only if not already present)
        if (!manifestContent.includes('ACCESS_NETWORK_STATE')) {
          const additionalPermissions = `
    <!-- Additional permissions for network and device access -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.VIBRATE" />`;
          
          manifestContent = manifestContent.replace(
            /<\/manifest>/,
            `${additionalPermissions}\n<\/manifest>`
          );
        }
        
        fs.writeFileSync(manifestPath, manifestContent);
        logger.debug('Updated AndroidManifest.xml with network security config and permissions');
      }
      
      const buildGradleFiles = [
        path.join(androidDir, 'app/build.gradle'),
        path.join(androidDir, 'capacitor-cordova-android-plugins/build.gradle'),
        path.join(androidDir, 'app/capacitor.build.gradle')
      ];
      
      for (const buildGradlePath of buildGradleFiles) {
        if (fs.existsSync(buildGradlePath)) {
          let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
          
          // Add Java 17 configuration if not present
          if (!buildGradle.includes('sourceCompatibility')) {
            const javaConfig = `
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_21
        targetCompatibility JavaVersion.VERSION_21
    }`;
            
            // Insert before the closing brace of android block
            buildGradle = buildGradle.replace(
              /(\s+)(}\s*$)/m,
              `$1${javaConfig}$1$2`
            );
          } else {
            // Update existing Java version to 21
            buildGradle = buildGradle.replace(
              /sourceCompatibility JavaVersion\.VERSION_\d+/,
              'sourceCompatibility JavaVersion.VERSION_21'
            );
            buildGradle = buildGradle.replace(
              /targetCompatibility JavaVersion\.VERSION_\d+/,
              'targetCompatibility JavaVersion.VERSION_21'
            );
          }
          
          fs.writeFileSync(buildGradlePath, buildGradle);
          logger.debug(`Updated Java version to 21 in ${path.basename(buildGradlePath)}`);
        }
      }
      
      // Update Gradle version to support Java 25
      const rootBuildGradlePath = path.join(androidDir, 'build.gradle');
      if (fs.existsSync(rootBuildGradlePath)) {
        let rootBuildGradle = fs.readFileSync(rootBuildGradlePath, 'utf8');
        
        // Update Gradle version to 8.12.0 which works with Java 21
        rootBuildGradle = rootBuildGradle.replace(
          /classpath 'com\.android\.tools\.build:gradle:\d+\.\d+\.\d+'/,
          "classpath 'com.android.tools.build:gradle:8.12.0'"
        );
        
        fs.writeFileSync(rootBuildGradlePath, rootBuildGradle);
        logger.debug('Updated Gradle version to 8.12.0 for Java 21 support');
      }
      
      // Update Gradle wrapper to support Java 25
      const gradleWrapperPropertiesPath = path.join(androidDir, 'gradle/wrapper/gradle-wrapper.properties');
      if (fs.existsSync(gradleWrapperPropertiesPath)) {
        let gradleWrapperProperties = fs.readFileSync(gradleWrapperPropertiesPath, 'utf8');
        
        // Update Gradle wrapper to 8.13 which works with Java 21
        gradleWrapperProperties = gradleWrapperProperties.replace(
          /distributionUrl=.*gradle-[\d\.]+-all\.zip/,
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.13-all.zip'
        );
        
        fs.writeFileSync(gradleWrapperPropertiesPath, gradleWrapperProperties);
        logger.debug('Updated Gradle wrapper to 8.13 for Java 21 support');
      }
    }
  }
}

async function copyAndroidIcons(cwd: string, config: any, logger: any): Promise<void> {
  const assetsGenPath = path.join(cwd, config.assets?.output || 'assets-gen');
  const androidIconsPath = path.join(assetsGenPath, 'android');
  const androidResPath = path.join(cwd, 'android/app/src/main/res');
  
  if (!fs.existsSync(androidIconsPath)) {
    logger.debug('No generated Android icons found, skipping icon copy');
    return;
  }
  
  if (!fs.existsSync(androidResPath)) {
    logger.debug('Android project not found, skipping icon copy');
    return;
  }
  
  logger.info('Copying generated icons to Android project...');
  
  try {
    // Copy icons from assets-gen/android to android/app/src/main/res
    const iconDirs = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
    
    for (const dir of iconDirs) {
      const sourceDir = path.join(androidIconsPath, dir);
      const targetDir = path.join(androidResPath, dir);
      
      if (fs.existsSync(sourceDir)) {
        // Ensure target directory exists
        fs.mkdirSync(targetDir, { recursive: true });
        
        // Copy ic_launcher.png
        const sourceIcon = path.join(sourceDir, 'ic_launcher.png');
        const targetIcon = path.join(targetDir, 'ic_launcher.png');
        
        if (fs.existsSync(sourceIcon)) {
          fs.copyFileSync(sourceIcon, targetIcon);
          logger.debug(`Copied icon: ${dir}/ic_launcher.png`);
        }
        
        // Also copy as ic_launcher_foreground.png for adaptive icons
        const targetForegroundIcon = path.join(targetDir, 'ic_launcher_foreground.png');
        if (fs.existsSync(sourceIcon)) {
          fs.copyFileSync(sourceIcon, targetForegroundIcon);
          logger.debug(`Copied foreground icon: ${dir}/ic_launcher_foreground.png`);
        }
      }
    }
    
    logger.info('✅ Android icons copied successfully');
  } catch (error) {
    logger.warn(`Failed to copy Android icons: ${error}`);
  }
}

async function addPushNotificationsPlugin(cwd: string, logger: any): Promise<void> {
  logger.info('Adding push notifications plugin...');
  
  try {
    // Install the push notifications plugin
    await execa('npm', ['install', '@capacitor/push-notifications'], { cwd, stdio: 'inherit' });
    logger.debug('Installed @capacitor/push-notifications');
    
    // Capacitor will automatically detect and register the plugin
    logger.debug('Capacitor will auto-register the plugin on next sync');
    
    logger.info('✅ Push notifications plugin added');
  } catch (error) {
    logger.warn(`Failed to add push notifications plugin: ${error}`);
    logger.info('You can manually add it later with: npm install @capacitor/push-notifications');
  }
}

async function addDeploymentScripts(cwd: string, logger: any): Promise<void> {
  const packageJsonPath = path.join(cwd, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Add deployment scripts if they don't exist
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      const deploymentScripts = {
        'deploy:phone': 'adb install -r android/app/build/outputs/apk/debug/app-debug.apk',
        'deploy:phone-force': 'adb install -r -d android/app/build/outputs/apk/debug/app-debug.apk',
        'deploy:uninstall': 'adb uninstall com.example.myapp',
        'deploy:list': 'adb devices',
        'deploy:logcat': 'adb logcat | grep -i "MyApp"',
        'deploy:clean': 'adb shell pm clear com.example.myapp'
      };
      
      // Only add scripts that don't already exist
      for (const [scriptName, scriptCommand] of Object.entries(deploymentScripts)) {
        if (!packageJson.scripts[scriptName]) {
          packageJson.scripts[scriptName] = scriptCommand;
        }
      }
      
      // Write updated package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      logger.debug('Added deployment scripts to package.json');
      
    } catch (error) {
      logger.warn(`Could not add deployment scripts: ${error}`);
    }
  }
}


