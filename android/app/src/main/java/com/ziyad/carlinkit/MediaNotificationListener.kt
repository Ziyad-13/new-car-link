package com.ziyad.carlinkit

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * Two jobs:
 *
 * 1. Its mere existence unlocks MediaSessionManager.getActiveSessions().
 *
 * 2. On head units whose Bluetooth stack streams A2DP without ever publishing
 *    a MediaSession (confirmed on this Tbox: notification access granted,
 *    active sessions = 0), the only public source of track metadata is the
 *    notification the Bluetooth/player app posts. We read it here.
 */
class MediaNotificationListener : NotificationListenerService() {

    companion object {
        private val _btTitle = MutableStateFlow<String?>(null)
        val btTitle: StateFlow<String?> = _btTitle

        private val _btArtist = MutableStateFlow<String?>(null)
        val btArtist: StateFlow<String?> = _btArtist

        private val _btSource = MutableStateFlow<String?>(null)
        val btSource: StateFlow<String?> = _btSource

        /** Packages whose notifications carry Bluetooth / playback metadata. */
        private val INTERESTING = listOf(
            "bluetooth", "btmusic", "avrcp", "music", "media", "player", "a2dp"
        )

        fun clear() {
            _btTitle.value = null
            _btArtist.value = null
            _btSource.value = null
        }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        val n = sbn?.notification ?: return
        try {
            val pkg = sbn.packageName ?: return
            val extras = n.extras ?: return

            val isMediaStyle =
                extras.getString(Notification.EXTRA_TEMPLATE)?.contains("MediaStyle") == true
            val looksRelevant = INTERESTING.any { pkg.contains(it, ignoreCase = true) }
            if (!isMediaStyle && !looksRelevant) return

            val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
            val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()
            if (title.isNullOrBlank()) return

            _btTitle.value = title
            _btArtist.value = text
            _btSource.value = try {
                packageManager.getApplicationLabel(
                    packageManager.getApplicationInfo(pkg, 0)
                ).toString()
            } catch (_: Throwable) {
                pkg
            }
        } catch (_: Throwable) {
            // Never let a malformed notification take down the listener.
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        try {
            val pkg = sbn?.packageName ?: return
            if (INTERESTING.any { pkg.contains(it, ignoreCase = true) }) clear()
        } catch (_: Throwable) {
        }
    }
}
