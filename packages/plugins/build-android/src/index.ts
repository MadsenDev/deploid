// PipelineStep type definition
interface PipelineStep {
  (context: { logger: any; config: any; cwd: string }): Promise<void>;
}
import { execa } from 'execa';
import fs from 'node:fs';
import path from 'node:path';

const buildAndroidPlugin = (): PipelineStep => async ({ logger, config, cwd, debug }: any) => {
  logger.info(`build-android: building APK/AAB for ${config.appName}`);
  
  if (debug) {
    logger.debugEnv();
    logger.debugStep('Initializing Android build process');
  }
  
  try {
    const androidPath = path.join(cwd, 'android');
    
    if (debug) {
      logger.debugFile('Checking Android project', androidPath, fs.existsSync(androidPath));
    }
    
    if (!fs.existsSync(androidPath)) {
      throw new Error('Android project not found. Run "shipwright package" first.');
    }
    
    // Build debug APK
    logger.info('Building debug APK...');
    
    // Force Java 21 for Gradle commands (ChatGPT's recommendation for Capacitor 7)
    const javaHome = '/usr/lib/jvm/java-21-openjdk';
    process.env.JAVA_HOME = javaHome;
    
    if (debug) {
      logger.debug(`Java Home: ${javaHome}`);
      logger.debug(`Android Home: ${process.env.ANDROID_HOME || process.env.HOME + '/Android/Sdk'}`);
      logger.debug(`Working Directory: ${androidPath}`);
    }
    
    // Use direct Gradle command for better control (ChatGPT recommendation)
    if (debug) {
      logger.debugCommand('./gradlew', ['assembleDebug'], androidPath);
    }
    
    await execa('./gradlew', ['assembleDebug'], { 
      cwd: androidPath,
      stdio: 'inherit',
      env: {
        ...process.env,
        JAVA_HOME: javaHome,
        ANDROID_HOME: process.env.ANDROID_HOME || process.env.HOME + '/Android/Sdk'
      }
    });
    
    // Check if APK was generated
    const apkPath = path.join(androidPath, 'app/build/outputs/apk/debug/app-debug.apk');
    if (debug) {
      logger.debugFile('Checking for generated APK', apkPath, fs.existsSync(apkPath));
    }
    
    if (fs.existsSync(apkPath)) {
      logger.info(`✅ Debug APK generated: ${apkPath}`);
      if (debug) {
        const stats = fs.statSync(apkPath);
        logger.debug(`APK size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      }
    } else {
      logger.warn('Debug APK not found in expected location');
      if (debug) {
        logger.debug('Checking alternative APK locations...');
        const altPaths = [
          path.join(androidPath, 'app/build/outputs/apk/debug'),
          path.join(androidPath, 'app/build/outputs')
        ];
        altPaths.forEach(altPath => {
          if (fs.existsSync(altPath)) {
            logger.debug(`Found directory: ${altPath}`);
            const files = fs.readdirSync(altPath, { recursive: true });
            logger.debug(`Contents: ${JSON.stringify(files, null, 2)}`);
          }
        });
      }
    }
    
    // Build release AAB if signing is configured
    if (config.android.signing?.keystorePath) {
      logger.info('Building release AAB...');
      await execa('./gradlew', ['bundleRelease'], { 
        cwd: androidPath,
        stdio: 'inherit',
        env: {
          ...process.env,
          JAVA_HOME: javaHome,
          ANDROID_HOME: process.env.ANDROID_HOME || process.env.HOME + '/Android/Sdk'
        }
      });
      
      const aabPath = path.join(androidPath, 'app/build/outputs/bundle/release/app-release.aab');
      if (fs.existsSync(aabPath)) {
        logger.info(`✅ Release AAB generated: ${aabPath}`);
      } else {
        logger.warn('Release AAB not found in expected location');
      }
    } else {
      logger.info('No signing configured, skipping release build');
    }
    
    logger.info('✅ Android build complete');
  } catch (error) {
    logger.error(`Android build failed: ${error}`);
    throw error;
  }
};

export default buildAndroidPlugin;
export { buildAndroidPlugin };
