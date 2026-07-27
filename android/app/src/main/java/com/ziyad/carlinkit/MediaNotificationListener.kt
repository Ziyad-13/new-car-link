package com.ziyad.carlinkit

import android.service.notification.NotificationListenerService

/**
 * Stub listener. Android only grants MediaSessionManager.getActiveSessions()
 * to apps that own an enabled NotificationListenerService, so this class exists
 * purely to unlock media control of other apps (Spotify, Bluetooth, YouTube …).
 */
class MediaNotificationListener : NotificationListenerService()
