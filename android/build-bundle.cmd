@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo HotelFlexi Android Play Store Bundle Builder (v1.0.8 / Code 11)
echo Pure Native App Container - ZERO Web View URL Bar
echo Package: in.novaxai.hotelflexi
echo ========================================================

set "JAVA_HOME=C:\Users\divya\.bubblewrap\jdk\jdk-17.0.11+9"
set "ANDROID_HOME=C:\Users\divya\.bubblewrap\android_sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "GRADLE_OPTS=-Xmx768m -XX:MaxMetaspaceSize=384m"

cd /d "%~dp0"

echo [1/4] Environment check...
"%JAVA_HOME%\bin\java.exe" -version
if errorlevel 1 (
    echo [ERROR] Java 17 not found at %JAVA_HOME%
    exit /b 1
)

echo [2/4] Checking Android Platform 36...
if not exist "%ANDROID_HOME%\platforms\android-36" (
    echo Downloading and installing Android SDK Platform 36...
    echo y | "%ANDROID_HOME%\tools\bin\sdkmanager.bat" --sdk_root="%ANDROID_HOME%" platforms;android-36
)

echo [3/4] Compiling signed Play Store App Bundle (.aab) with VersionCode 11...
call gradlew.bat bundleRelease -Dorg.gradle.jvmargs="-Xmx768m -XX:MaxMetaspaceSize=384m" --no-daemon --stacktrace

if errorlevel 1 (
    echo [ERROR] Gradle bundle build failed.
    exit /b 1
)

echo [4/4] Generating Universal APK (.apk) and distributing files...
copy /y "app\build\outputs\bundle\release\app-release.aab" "HotelFlexi-v1.0.8-release.aab" >nul
copy /y "app\build\outputs\bundle\release\app-release.aab" "C:\Users\divya\OneDrive\Desktop\HotelFlexi-v1.0.8-release.aab" >nul
copy /y "app\build\outputs\bundle\release\app-release.aab" "C:\Users\divya\OneDrive\Desktop\HotelFlexi-release.aab" >nul
copy /y "app\build\outputs\bundle\release\app-release.aab" "C:\Users\divya\Downloads\HotelFlexi-v1.0.8-release.aab" >nul

if exist "bundletool.jar" (
    if exist "HotelFlexi-v1.0.8.apks" del /f /q "HotelFlexi-v1.0.8.apks"
    "%JAVA_HOME%\bin\java.exe" -jar bundletool.jar build-apks --bundle="HotelFlexi-v1.0.8-release.aab" --output="HotelFlexi-v1.0.8.apks" --mode=universal --ks="signing.keystore" --ks-pass=pass:dKbvBlLmwBhL --ks-key-alias=my-key-alias --key-pass=pass:dKbvBlLmwBhL
    tar.exe -xf "HotelFlexi-v1.0.8.apks" universal.apk
    if exist "universal.apk" (
        move /y "universal.apk" "HotelFlexi-v1.0.8-universal.apk" >nul
        copy /y "HotelFlexi-v1.0.8-universal.apk" "C:\Users\divya\OneDrive\Desktop\HotelFlexi-v1.0.8-universal.apk" >nul
        copy /y "HotelFlexi-v1.0.8-universal.apk" "C:\Users\divya\OneDrive\Desktop\HotelFlexi-universal.apk" >nul
        copy /y "HotelFlexi-v1.0.8-universal.apk" "C:\Users\divya\Downloads\HotelFlexi-v1.0.8-universal.apk" >nul
        copy /y "HotelFlexi-v1.0.8-universal.apk" "..\apps\web\public\hotelflexi-app.apk" >nul
    )
    if exist "HotelFlexi-v1.0.8.apks" del /f /q "HotelFlexi-v1.0.8.apks"
)

echo ========================================================
echo PLAY STORE BUNDLE (VersionCode 11) READY!
echo ========================================================
echo AAB: C:\Users\divya\OneDrive\Desktop\HotelFlexi-v1.0.8-release.aab
echo APK: C:\Users\divya\OneDrive\Desktop\HotelFlexi-v1.0.8-universal.apk
