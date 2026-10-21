package novaxai.hotelflexi

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.util.Log

class HotelFlexiApplication : Application() {

    companion object {
        const val TAG = "HotelFlexiApp"
        const val CHANNEL_SIREN = "channel_siren_alerts"
        const val CHANNEL_RESERVATIONS = "channel_reservations"
        const val CHANNEL_HOUSEKEEPING = "channel_housekeeping"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        Log.i(TAG, "HotelFlexi Native Android Application initialized.")
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java) ?: return

            // 1. High-Priority Siren Alerts Channel (Sound + Vibrate + Heads-up)
            val sirenUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build()

            val sirenChannel = NotificationChannel(
                CHANNEL_SIREN,
                "Urgent Front Desk Sirens",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Critical front desk alerts, guest sirens, and urgent assistance requests"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 800)
                setSound(sirenUri, audioAttributes)
            }

            // 2. Reservation & Booking Alerts
            val resChannel = NotificationChannel(
                CHANNEL_RESERVATIONS,
                "Reservations & Check-Ins",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "New OTA bookings, direct reservations, check-ins, and cancellations"
                enableVibration(true)
            }

            // 3. Housekeeping Operations
            val hkChannel = NotificationChannel(
                CHANNEL_HOUSEKEEPING,
                "Housekeeping & Rooms",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Room cleaning status updates and maintenance tickets"
            }

            manager.createNotificationChannels(listOf(sirenChannel, resChannel, hkChannel))
        }
    }
}
