package com.freelas.app.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.freelas.app.MainActivity
import com.freelas.app.R
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class FirebaseMessagingService : FirebaseMessagingService() {
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        // Handle FCM messages here
        remoteMessage.notification?.let { notification ->
            sendNotification(
                title = notification.title ?: "FreelasApp",
                body = notification.body ?: "Nova notificação"
            )
        }
    }
    
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        
        // Send the token to your server
        sendTokenToServer(token)
    }
    
    private fun sendNotification(title: String, body: String) {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val channelId = "freelas_notifications"
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
        
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Since Android Oreo, notification channels are required
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "FreelasApp Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notificações do FreelasApp"
            }
            notificationManager.createNotificationChannel(channel)
        }
        
        notificationManager.notify(0, notificationBuilder.build())
    }
    
    private fun sendTokenToServer(token: String) {
        // Implement token sending to your server
        // This should be done through your API service
    }
}



