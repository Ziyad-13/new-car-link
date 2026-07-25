# Keep the SystemBridge (uses PackageManager reflection-style queries)
-keep class com.ziyad.carlinkit.SystemBridge { *; }

# Compose runtime is handled by default AGP rules; nothing extra needed.
-dontwarn org.jetbrains.annotations.**
