import { PipelineStep } from '../../../core/dist/index.js';
import { execa } from 'execa';
import fs from 'node:fs';
import path from 'node:path';

export const buildAndroidPlugin = (): PipelineStep => async ({ logger, config, cwd }: any) => {
  logger.info(`build-android: building APK/AAB for ${config.appName}`);
  
  try {
    const androidPath = path.join(cwd, 'android');
    
    if (!fs.existsSync(androidPath)) {
      throw new Error('Android project not found. Run "shipwright package" first.');
    }
    
    // Build debug APK
    logger.info('Building debug APK...');
    
    // Force Java 21 for Gradle commands (ChatGPT's recommendation for Capacitor 7)
    const javaHome = '/usr/lib/jvm/java-21-openjdk';
    process.env.JAVA_HOME = javaHome;
    
    // Use direct Gradle command for better control (ChatGPT recommendation)
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
    if (fs.existsSync(apkPath)) {
      logger.info(`✅ Debug APK generated: ${apkPath}`);
    } else {
      logger.warn('Debug APK not found in expected location');
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
