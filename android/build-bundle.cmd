@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo HotelFlexi Android Play Store Bundle Builder (Method B)
echo Package: in.novaxai.hotelflexi
echo ========================================================

set "JAVA_HOME=C:\Users\divya\.bubblewrap\jdk\jdk-17.0.11+9"
set "ANDROID_HOME=C:\Users\divya\.bubblewrap\android_sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "GRADLE_OPTS=-Xmx768m -XX:MaxMetaspaceSize=384m"

cd /d "%~dp0"

echo [1/3] Environment check...
"%JAVA_HOME%\bin\java.exe" -version
if errorlevel 1 (
    echo [ERROR] Java 17 not found at %JAVA_HOME%
    exit /b 1
)

echo [2/3] Checking Android Platform 36...
if not exist "%ANDROID_HOME%\platforms\android-36" (
    echo Downloading and installing Android SDK Platform 36...
    echo y | "%ANDROID_HOME%\tools\bin\sdkmanager.bat" --sdk_root="%ANDROID_HOME%" platforms;android-36
)

echo [3/3] Compiling signed Play Store App Bundle (.aab)...
call gradlew.bat bundleRelease -Dorg.gradle.jvmargs="-Xmx768m -XX:MaxMetaspaceSize=384m" --no-daemon --stacktrace

if errorlevel 1 (
    echo [ERROR] Gradle bundle build failed.
    exit /b 1
)

echo ========================================================
echo PLAY STORE BUNDLE BUILD SUCCESSFUL!
echo ========================================================
dir /s /b app\build\outputs\bundle\release\*.aab
