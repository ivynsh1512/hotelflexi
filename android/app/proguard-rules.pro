# HotelFlexi Proguard Rules for Android
-keep class com.google.androidbrowserhelper.** { *; }
-dontwarn com.google.androidbrowserhelper.**

-keep class in.novaxai.hotelflexi.** { *; }
-dontwarn in.novaxai.hotelflexi.**

-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepclassmembers class in.novaxai.hotelflexi.MainActivity$HotelFlexiNativeBridge {
    public *;
}
