export const ANDROID_MINIMUM_JAVA_MAJOR = 17;
export const ANDROID_PREFERRED_JAVA_MAJOR = 21;

export interface AndroidBuildRequirements {
  minimumJavaMajor: number;
  preferredJavaMajor: number;
}

export const ANDROID_BUILD_REQUIREMENTS: AndroidBuildRequirements = {
  minimumJavaMajor: ANDROID_MINIMUM_JAVA_MAJOR,
  preferredJavaMajor: ANDROID_PREFERRED_JAVA_MAJOR
};
