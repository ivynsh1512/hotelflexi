package `in`.novaxai.hotelflexi.service

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import `in`.novaxai.hotelflexi.HotelFlexiApplication
import `in`.novaxai.hotelflexi.MainActivity
import `in`.novaxai.hotelflexi.R
import `in`.novaxai.hotelflexi.data.repository.HotelRepository
import `in`.novaxai.hotelflexi.data.repository.SessionManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class HotelFlexiFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "HotelFlexiFCM"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM Device Registration Token: $token")

        val repository = HotelRepository(applicationContext)
        CoroutineScope(Dispatchers.IO).launch {
            repository.registerFcmToken(token)
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "Inbound FCM Message From: ${remoteMessage.from}, data: ${remoteMessage.data}")

        val data = remoteMessage.data
        val notificationType = data["type"] ?: "general"
        val title = remoteMessage.notification?.title ?: data["title"] ?: "HotelFlexi Notification"
        val body = remoteMessage.notification?.body ?: data["message"] ?: data["body"] ?: "New update available"

        val roomNumber = data["room_number"]
        val reservationId = data["reservation_id"]

        showNativeNotification(notificationType, title, body, roomNumber, reservationId)
    }

    private fun showNativeNotification(
        type: String,
        title: String,
        body: String,
        roomNumber: String?,
        reservationId: String?
    ) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("notification_type", type)
            putExtra("room_number", roomNumber)
            putExtra("reservation_id", reservationId)
        }

        val requestCode = (System.currentTimeMillis() % 10000).toInt()
        val pendingIntent = PendingIntent.getActivity(
            this,
            requestCode,
            intent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT else PendingIntent.FLAG_UPDATE_CURRENT
        )

        val channelId = when (type) {
            "siren_alert", "urgent", "guest_complaint", "self_checkin" -> HotelFlexiApplication.CHANNEL_SIREN
            "reservation", "booking", "checkin", "checkout" -> HotelFlexiApplication.CHANNEL_RESERVATIONS
            else -> HotelFlexiApplication.CHANNEL_HOUSEKEEPING
        }

        val isSiren = channelId == HotelFlexiApplication.CHANNEL_SIREN

        val alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val builder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(if (isSiren) NotificationCompat.PRIORITY_MAX else NotificationCompat.PRIORITY_DEFAULT)

        if (isSiren) {
            builder.setCategory(NotificationCompat.CATEGORY_ALARM)
                .setSound(alarmSound)
                .setVibrate(longArrayOf(0, 500, 200, 500, 200, 800))
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        }

        notificationManager.notify(requestCode, builder.build())
    }
}
