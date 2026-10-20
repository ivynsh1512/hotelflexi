package in.novaxai.hotelflexi;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

public class HotelFlexiSirenEngine {
    private static final String TAG = "HotelFlexiSiren";
    public static final String CHANNEL_SIREN = "channel_urgent_siren";
    public static final String CHANNEL_NOTIFICATIONS = "channel_notifications";

    private final Context context;
    private final Vibrator vibrator;
    private AudioTrack audioTrack;
    private Thread audioThread;
    private volatile boolean isPlaying = false;
    private final Handler mainHandler;

    public HotelFlexiSirenEngine(Context context) {
        this.context = context.getApplicationContext();
        this.vibrator = (Vibrator) this.context.getSystemService(Context.VIBRATOR_SERVICE);
        this.mainHandler = new Handler(Looper.getMainLooper());
        createNotificationChannels();
    }

    public void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            // 1. High-Priority Siren Alert Channel
            NotificationChannel sirenChan = new NotificationChannel(
                    CHANNEL_SIREN,
                    "Urgent Housekeeping & Siren Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            sirenChan.setDescription("Loud acoustic alarm and hardware vibration for urgent room turnaround");
            sirenChan.enableLights(true);
            sirenChan.enableVibration(true);
            sirenChan.setVibrationPattern(new long[]{0, 800, 200, 800, 200, 800, 400});
            sirenChan.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(sirenChan);

            // 2. Standard Notifications Channel
            NotificationChannel notifChan = new NotificationChannel(
                    CHANNEL_NOTIFICATIONS,
                    "General Operational Notifications",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            notifChan.setDescription("Reservation arrivals, booking vouchers, and folios");
            nm.createNotificationChannel(notifChan);
        }
    }

    public synchronized void startSiren() {
        if (isPlaying) return;
        isPlaying = true;

        // 1. Hardware vibration pulse
        if (vibrator != null && vibrator.hasVibrator()) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    VibrationEffect effect = VibrationEffect.createWaveform(
                            new long[]{0, 800, 200, 800, 200, 800, 400},
                            0 // repeat from index 0
                    );
                    vibrator.vibrate(effect);
                } else {
                    vibrator.vibrate(new long[]{0, 800, 200, 800, 200, 800, 400}, 0);
                }
            } catch (Exception e) {
                Log.w(TAG, "Vibrator error: " + e.getMessage());
            }
        }

        // 2. Synthesize dual-tone European Siren (880Hz / 660Hz) PCM audio
        audioThread = new Thread(() -> {
            try {
                int sampleRate = 44100;
                int bufferSize = AudioTrack.getMinBufferSize(
                        sampleRate,
                        AudioFormat.CHANNEL_OUT_MONO,
                        AudioFormat.ENCODING_PCM_16BIT
                );

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    audioTrack = new AudioTrack.Builder()
                            .setAudioAttributes(new AudioAttributes.Builder()
                                    .setUsage(AudioAttributes.USAGE_ALARM)
                                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                    .build())
                            .setAudioFormat(new AudioFormat.Builder()
                                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                                    .setSampleRate(sampleRate)
                                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                                    .build())
                            .setBufferSizeInBytes(bufferSize)
                            .setTransferMode(AudioTrack.MODE_STREAM)
                            .build();
                } else {
                    audioTrack = new AudioTrack(
                            AudioManager.STREAM_ALARM,
                            sampleRate,
                            AudioFormat.CHANNEL_OUT_MONO,
                            AudioFormat.ENCODING_PCM_16BIT,
                            bufferSize,
                            AudioTrack.MODE_STREAM
                    );
                }

                audioTrack.play();

                short[] buffer = new short[bufferSize];
                double phase = 0.0;
                long cycleCounter = 0;
                int currentFreq = 880;

                while (isPlaying) {
                    // Switch frequency every ~420ms
                    if ((cycleCounter % (sampleRate * 420L / 1000L)) < bufferSize) {
                        currentFreq = (currentFreq == 880) ? 660 : 880;
                    }

                    for (int i = 0; i < buffer.length; i++) {
                        phase += 2.0 * Math.PI * currentFreq / sampleRate;
                        if (phase > 2.0 * Math.PI) {
                            phase -= 2.0 * Math.PI;
                        }
                        // Triangle wave generation
                        double sample = (2.0 / Math.PI) * Math.asin(Math.sin(phase));
                        buffer[i] = (short) (sample * 24000); // 75% max amplitude to prevent distortion
                        cycleCounter++;
                    }

                    audioTrack.write(buffer, 0, buffer.length);
                }

                if (audioTrack != null) {
                    audioTrack.stop();
                    audioTrack.release();
                    audioTrack = null;
                }
            } catch (Exception e) {
                Log.e(TAG, "AudioTrack error: " + e.getMessage());
            }
        });

        audioThread.setPriority(Thread.MAX_PRIORITY);
        audioThread.start();
    }

    public synchronized void stopSiren() {
        isPlaying = false;
        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {}
        }
        if (audioThread != null) {
            audioThread.interrupt();
            audioThread = null;
        }
        if (audioTrack != null) {
            try {
                audioTrack.stop();
                audioTrack.release();
            } catch (Exception ignored) {}
            audioTrack = null;
        }
    }

    public boolean isPlaying() {
        return isPlaying;
    }

    public void testSiren(int durationMs, Runnable onComplete) {
        startSiren();
        mainHandler.postDelayed(() -> {
            stopSiren();
            if (onComplete != null) {
                onComplete.run();
            }
        }, durationMs);
    }
}
