package com.ziyad.carlinkit

import android.content.ComponentName
import android.content.Context
import android.graphics.Bitmap
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.provider.Settings
import android.service.notification.NotificationListenerService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * Controls whatever app is currently playing audio (Spotify, YouTube Music,
 * Bluetooth A2DP, …) through the system MediaSession API.
 *
 * Requires notification access, which the user grants once in Settings.
 */
class ExternalMediaController(private val context: Context) {

    private val _hasAccess = MutableStateFlow(false)
    val hasAccess: StateFlow<Boolean> = _hasAccess

    private val _title = MutableStateFlow<String?>(null)
    val title: StateFlow<String?> = _title

    private val _artist = MutableStateFlow<String?>(null)
    val artist: StateFlow<String?> = _artist

    private val _albumArt = MutableStateFlow<Bitmap?>(null)
    val albumArt: StateFlow<Bitmap?> = _albumArt

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying

    private val _sourceApp = MutableStateFlow<String?>(null)
    val sourceApp: StateFlow<String?> = _sourceApp

    private var manager: MediaSessionManager? = null
    private var controller: MediaController? = null

    private val callback = object : MediaController.Callback() {
        override fun onMetadataChanged(metadata: MediaMetadata?) = publishMetadata(metadata)
        override fun onPlaybackStateChanged(state: PlaybackState?) {
            _isPlaying.value = state?.state == PlaybackState.STATE_PLAYING
        }
        override fun onSessionDestroyed() = attachToActiveSession()
    }

    private val sessionsChanged =
        MediaSessionManager.OnActiveSessionsChangedListener { attachToActiveSession() }

    fun start() {
        _hasAccess.value = notificationAccessGranted()
        if (!_hasAccess.value) return
        // Android may leave the listener unbound if access was granted after
        // the app started; this forces it to connect.
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                NotificationListenerService.requestRebind(
                    ComponentName(context, MediaNotificationListener::class.java)
                )
            }
        } catch (_: Throwable) {
        }
        try {
            manager = context.getSystemService(Context.MEDIA_SESSION_SERVICE) as MediaSessionManager
            val component = ComponentName(context, MediaNotificationListener::class.java)
            manager?.addOnActiveSessionsChangedListener(sessionsChanged, component)
            attachToActiveSession()
        } catch (t: Throwable) {
            CrashLog.record(context, "ExternalMediaController.start", t)
        }
    }

    private fun attachToActiveSession() {
        try {
            controller?.unregisterCallback(callback)
            val component = ComponentName(context, MediaNotificationListener::class.java)
            val sessions = manager?.getActiveSessions(component).orEmpty()

            // Prefer a session that is actually playing
            val active = sessions.firstOrNull {
                it.playbackState?.state == PlaybackState.STATE_PLAYING
            } ?: sessions.firstOrNull()

            controller = active
            if (active == null) {
                clear()
                return
            }
            active.registerCallback(callback)
            _sourceApp.value = appLabel(active.packageName)
            publishMetadata(active.metadata)
            _isPlaying.value = active.playbackState?.state == PlaybackState.STATE_PLAYING
        } catch (t: Throwable) {
            CrashLog.record(context, "attachToActiveSession", t)
            clear()
        }
    }

    private fun appLabel(pkg: String?): String? {
        if (pkg == null) return null
        return try {
            val pm = context.packageManager
            pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
        } catch (_: Throwable) {
            pkg
        }
    }

    private fun publishMetadata(metadata: MediaMetadata?) {
        _title.value = metadata?.getString(MediaMetadata.METADATA_KEY_TITLE)
        _artist.value = metadata?.getString(MediaMetadata.METADATA_KEY_ARTIST)
            ?: metadata?.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST)
        _albumArt.value = metadata?.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
            ?: metadata?.getBitmap(MediaMetadata.METADATA_KEY_ART)
    }

    private fun clear() {
        _title.value = null
        _artist.value = null
        _albumArt.value = null
        _sourceApp.value = null
        _isPlaying.value = false
    }

    fun togglePlayPause() {
        val c = controller
        if (c != null) {
            if (_isPlaying.value) c.transportControls.pause() else c.transportControls.play()
        } else {
            sendMediaKey(android.view.KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE)
            _isPlaying.value = !_isPlaying.value
        }
    }

    fun next() {
        val c = controller
        if (c != null) c.transportControls.skipToNext()
        else sendMediaKey(android.view.KeyEvent.KEYCODE_MEDIA_NEXT)
    }

    fun previous() {
        val c = controller
        if (c != null) c.transportControls.skipToPrevious()
        else sendMediaKey(android.view.KeyEvent.KEYCODE_MEDIA_PREVIOUS)
    }

    /**
     * Fallback control path. With no MediaSession to talk to, a media key event
     * still reaches whatever owns audio focus — on this box, the Bluetooth
     * AVRCP layer, which forwards it to the phone.
     */
    private fun sendMediaKey(keyCode: Int) {
        try {
            val am = context.getSystemService(Context.AUDIO_SERVICE) as android.media.AudioManager
            val now = android.os.SystemClock.uptimeMillis()
            am.dispatchMediaKeyEvent(
                android.view.KeyEvent(now, now, android.view.KeyEvent.ACTION_DOWN, keyCode, 0)
            )
            am.dispatchMediaKeyEvent(
                android.view.KeyEvent(now, now, android.view.KeyEvent.ACTION_UP, keyCode, 0)
            )
        } catch (t: Throwable) {
            CrashLog.record(context, "sendMediaKey", t)
        }
    }

    fun hasSession(): Boolean = controller != null

    /**
     * Human-readable dump of every active media session, for on-device
     * diagnosis — the head unit has no practical access to logcat.
     */
    fun diagnostics(): String = buildString {
        append("Notification access: ")
        append(if (notificationAccessGranted()) "GRANTED" else "DENIED")
        append('\n')
        if (!notificationAccessGranted()) {
            append("Grant it first - sessions are invisible without it.")
            return@buildString
        }
        try {
            val mgr = manager ?: (context.getSystemService(Context.MEDIA_SESSION_SERVICE)
                as? MediaSessionManager)
            if (mgr == null) {
                append("MediaSessionManager unavailable")
                return@buildString
            }
            val component = ComponentName(context, MediaNotificationListener::class.java)
            val sessions = mgr.getActiveSessions(component)
            append("Active sessions: ").append(sessions.size).append('\n')
            if (sessions.isEmpty()) {
                append("\nNo app publishes a media session.\n")
                append("If Bluetooth audio is playing now, this box\n")
                append("routes it without a session.")
            }
            sessions.forEachIndexed { i, c ->
                append('\n').append(i + 1).append(". ").append(c.packageName).append('\n')
                append("   state=").append(c.playbackState?.state?.toString() ?: "null")
                append("  title=")
                append(c.metadata?.getString(MediaMetadata.METADATA_KEY_TITLE) ?: "-")
                append('\n')
            }
            append("\nAttached to: ").append(controller?.packageName ?: "none")
        } catch (t: Throwable) {
            append("ERROR: ").append(t.javaClass.simpleName).append(" ").append(t.message)
        }
    }

    /** Re-scan for sessions on demand. */
    fun refresh() {
        val granted = notificationAccessGranted()
        _hasAccess.value = granted
        if (!granted) return
        if (manager == null) start() else attachToActiveSession()
    }

    fun notificationAccessGranted(): Boolean = try {
        val enabled = Settings.Secure.getString(
            context.contentResolver, "enabled_notification_listeners"
        ) ?: ""
        enabled.contains(context.packageName)
    } catch (_: Throwable) {
        false
    }

    fun release() {
        try {
            controller?.unregisterCallback(callback)
            manager?.removeOnActiveSessionsChangedListener(sessionsChanged)
        } catch (_: Throwable) {
        }
    }
}
