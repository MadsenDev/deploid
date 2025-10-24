import fs from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import readline from 'node:readline';

export interface FirebaseOptions {
  projectId?: string;
  autoCreate?: boolean;
}

export async function setupFirebase(options: FirebaseOptions): Promise<void> {
  const cwd = process.cwd();
  
  console.log('🔥 Firebase Setup for Push Notifications');
  console.log('This will configure Firebase for native Android push notifications.\n');
  
  try {
    // Check if Firebase CLI is installed
    try {
      await execa('firebase', ['--version'], { stdio: 'pipe' });
      console.log('✅ Firebase CLI found');
    } catch (error) {
      console.log('📦 Installing Firebase CLI...');
      await execa('npm', ['install', '-g', 'firebase-tools'], { stdio: 'inherit' });
    }
    
    // Login to Firebase
    console.log('🔐 Please login to Firebase...');
    await execa('firebase', ['login'], { stdio: 'inherit' });
    
    let projectId = options.projectId;
    
    // Create or select Firebase project
    if (options.autoCreate || !projectId) {
      if (options.autoCreate) {
        console.log('🚀 Creating new Firebase project...');
        const projectName = path.basename(cwd).replace(/[^a-zA-Z0-9]/g, '-');
        await execa('firebase', ['projects:create', projectName], { stdio: 'inherit' });
        projectId = projectName;
      } else {
        // List existing projects
        console.log('📋 Available Firebase projects:');
        const { stdout } = await execa('firebase', ['projects:list'], { stdio: 'pipe' });
        console.log(stdout);
        
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        projectId = await new Promise<string>((resolve) => {
          rl.question('Enter project ID: ', resolve);
        });
        
        rl.close();
      }
    }
    
    // Initialize Firebase in the project
    console.log('🔧 Initializing Firebase in project...');
    await execa('firebase', ['use', projectId!], { cwd, stdio: 'inherit' });
    
    // Add Android app to Firebase
    console.log('📱 Adding Android app to Firebase...');
    const packageName = await getPackageName(cwd);
    await execa('firebase', ['apps:create', 'android', packageName], { 
      cwd, 
      stdio: 'inherit' 
    });
    
    // Download google-services.json
    console.log('📄 Downloading google-services.json...');
    await execa('firebase', ['apps:sdkconfig', 'android'], { 
      cwd, 
      stdio: 'inherit' 
    });
    
    // Move google-services.json to correct location
    const sourcePath = path.join(cwd, 'google-services.json');
    const targetPath = path.join(cwd, 'android/app/google-services.json');
    
    if (fs.existsSync(sourcePath)) {
      // Ensure android/app directory exists
      const androidAppDir = path.dirname(targetPath);
      if (!fs.existsSync(androidAppDir)) {
        fs.mkdirSync(androidAppDir, { recursive: true });
      }
      
      fs.copyFileSync(sourcePath, targetPath);
      fs.unlinkSync(sourcePath); // Remove from root
      console.log('✅ google-services.json placed in android/app/');
    } else {
      console.log('⚠️  google-services.json not found. Please download it manually from Firebase Console.');
      console.log('Place it in: android/app/google-services.json');
    }
    
    // Update Android build.gradle if needed
    await updateAndroidBuildGradle(cwd);
    
    console.log('\n🎉 Firebase setup complete!');
    console.log('Your app now supports native push notifications.');
    console.log('\nNext steps:');
    console.log('  1. Run: deploid build');
    console.log('  2. Run: deploid deploy');
    console.log('  3. Test push notifications in your app');
    
  } catch (error) {
    console.log('❌ Firebase setup failed:', error);
    console.log('\nManual setup:');
    console.log('  1. Go to https://console.firebase.google.com/');
    console.log('  2. Create a new project');
    console.log('  3. Add Android app with package name:', await getPackageName(cwd));
    console.log('  4. Download google-services.json to android/app/');
  }
}

async function getPackageName(cwd: string): Promise<string> {
  try {
    // Try to read from android/app/build.gradle
    const buildGradlePath = path.join(cwd, 'android/app/build.gradle');
    if (fs.existsSync(buildGradlePath)) {
      const content = fs.readFileSync(buildGradlePath, 'utf8');
      const match = content.match(/applicationId\s+['"]([^'"]+)['"]/);
      if (match) {
        return match[1];
      }
    }
    
    // Try to read from deploid.config.ts
    const configPath = path.join(cwd, 'deploid.config.ts');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const match = content.match(/appId:\s+['"]([^'"]+)['"]/);
      if (match) {
        return match[1];
      }
    }
    
    // Default fallback
    return 'com.example.myapp';
  } catch (error) {
    return 'com.example.myapp';
  }
}

async function updateAndroidBuildGradle(cwd: string): Promise<void> {
  const buildGradlePath = path.join(cwd, 'android/app/build.gradle');
  
  if (!fs.existsSync(buildGradlePath)) {
    console.log('⚠️  android/app/build.gradle not found. Skipping build.gradle updates.');
    return;
  }
  
  let content = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Check if Google Services plugin is already applied
  if (!content.includes('com.google.gms.google-services')) {
    console.log('🔧 Adding Google Services plugin to build.gradle...');
    
    // Add plugin application
    content = content.replace(
      /apply plugin: 'com\.android\.application'/,
      "apply plugin: 'com.android.application'\napply plugin: 'com.google.gms.google-services'"
    );
    
    // Add Firebase dependencies if not present
    if (!content.includes('firebase-messaging')) {
      const dependenciesMatch = content.match(/(dependencies\s*\{[^}]*\})/s);
      if (dependenciesMatch) {
        const dependencies = dependenciesMatch[1];
        const newDependencies = dependencies.replace(
          /(implementation project\(':capacitor-android'\))/,
          '$1\n    \n    // Firebase dependencies\n    implementation \'com.google.firebase:firebase-messaging:23.4.1\'\n    implementation \'com.google.firebase:firebase-analytics:21.5.1\''
        );
        content = content.replace(dependencies, newDependencies);
      }
    }
    
    fs.writeFileSync(buildGradlePath, content);
    console.log('✅ Updated android/app/build.gradle');
  } else {
    console.log('✅ Google Services plugin already configured');
  }
}
