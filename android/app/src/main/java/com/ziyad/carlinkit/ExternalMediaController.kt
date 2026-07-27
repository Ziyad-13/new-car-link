package com.ziyad.carlinkit

import android.content.ComponentName
import android.content.Context
import android.graphics.Bitmap
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.provider.Settings
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
        val c = controller ?: return
        if (_isPlaying.value) c.transportControls.pause() else c.transportControls.play()
    }

    fun next() = controller?.transportControls?.skipToNext()
    fun previous() = controller?.transportControls?.skipToPrevious()

    fun hasSession(): Boolean = controller != null

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
