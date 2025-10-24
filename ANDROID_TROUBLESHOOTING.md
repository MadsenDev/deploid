# Android Build Troubleshooting Guide

## Common Issues and Solutions

### 1. APK Crashes Immediately
**Cause**: Missing Capacitor plugins for browser APIs
**Solution**: 
- Add `@capacitor/clipboard` for clipboard functionality
- Replace `navigator.clipboard` with `Clipboard.write()`
- Add other Capacitor plugins as needed

### 2. Login/API Connection Issues
**Cause**: Network security configuration or HTTPS issues
**Solution**:
- Check network security config in `android/app/src/main/res/xml/network_security_config.xml`
- Verify API base URL in environment variables
- Test with NetworkDebug component

### 3. Build Failures
**Cause**: Java/Gradle version incompatibility
**Solution**:
- Ensure Java 21 is installed and set in `gradle.properties`
- Use Gradle 8.13 and AGP 8.12.0
- Check `ANDROID_HOME` environment variable

### 4. Performance Issues
**Cause**: Gradle not optimized
**Solution**:
- Enable parallel builds: `org.gradle.parallel=true`
- Enable caching: `org.gradle.caching=true`
- Increase heap size: `org.gradle.jvmargs=-Xmx4g`

## Debugging Steps

1. **Check Network Connectivity**:
   - Use NetworkDebug component in your app
   - Test API endpoints manually
   - Verify SSL certificates

2. **Check Build Logs**:
   - Look for Java version errors
   - Check Gradle daemon issues
   - Verify Android SDK location

3. **Test in Browser First**:
   - Ensure web app works in browser
   - Check for JavaScript errors
   - Verify API calls work

## Environment Setup

### Required Software:
- Java 21 (OpenJDK)
- Android SDK (API 34)
- Gradle 8.13
- Node.js 18+

### Environment Variables:
```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
export ANDROID_HOME=~/Android/Sdk
```

### Gradle Configuration:
```properties
org.gradle.java.home=/usr/lib/jvm/java-21-openjdk
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.daemon=true
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g
```
