package com.ziyad.carlinkit

import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class LocalTrack(
    val id: Long,
    val title: String,
    val artist: String,
    val album: String,
    val durationMs: Long,
    val contentUri: Uri
)

class LocalPlayerManager(
    private val context: Context,
    private val audioEngine: AudioEngine
) {
    private val scope = CoroutineScope(Dispatchers.Main + Job())

    private var exoPlayer: ExoPlayer? = null

    private val _tracks = MutableStateFlow<List<LocalTrack>>(emptyList())
    val tracks: StateFlow<List<LocalTrack>> = _tracks

    private val _currentTrack = MutableStateFlow<LocalTrack?>(null)
    val currentTrack: StateFlow<LocalTrack?> = _currentTrack

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying

    private val _progress = MutableStateFlow(0f)
    val progress: StateFlow<Float> = _progress

    private val _currentPositionMs = MutableStateFlow(0L)
    val currentPositionMs: StateFlow<Long> = _currentPositionMs

    private val _durationMs = MutableStateFlow(0L)
    val durationMs: StateFlow<Long> = _durationMs

    private val _audioSessionId = MutableStateFlow(0)
    val audioSessionId: StateFlow<Int> = _audioSessionId

    private var progressJob: Job? = null

    init {
        try {
            initExoPlayer()
        } catch (t: Throwable) {
            CrashLog.record(context, "initExoPlayer", t)
        }
        try {
            scanLocalAudio()
        } catch (t: Throwable) {
            CrashLog.record(context, "scanLocalAudio", t)
        }
    }

    private fun initExoPlayer() {
        val player = ExoPlayer.Builder(context).build()
        exoPlayer = player

        player.addListener(object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) {
                onIsPlayingChangedState(isPlaying)
            }

            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState == Player.STATE_READY) {
                    _durationMs.value = player.duration.coerceAtLeast(0L)
                    val sessionId = player.audioSessionId
                    if (sessionId > 0) {
                        _audioSessionId.value = sessionId
                        audioEngine.attachToSession(sessionId)
                    }
                } else if (playbackState == Player.STATE_ENDED) {
                    nextTrack()
                }
            }
        })

        val initialSessionId = player.audioSessionId
        if (initialSessionId > 0) {
            _audioSessionId.value = initialSessionId
            audioEngine.attachToSession(initialSessionId)
        }
    }

    private fun onIsPlayingChangedState(playing: Boolean) {
        _isPlaying.value = playing
        if (playing) {
            startProgressTracker()
        } else {
            progressJob?.cancel()
        }
    }

    private fun startProgressTracker() {
        progressJob?.cancel()
        progressJob = scope.launch {
            while (_isPlaying.value) {
                exoPlayer?.let { p ->
                    val pos = p.currentPosition.coerceAtLeast(0L)
                    val dur = p.duration.coerceAtLeast(1L)
                    _currentPositionMs.value = pos
                    _durationMs.value = dur
                    _progress.value = (pos.toFloat() / dur.toFloat()).coerceIn(0f, 1f)
                }
                delay(500L)
            }
        }
    }

    fun scanLocalAudio() {
        scope.launch(Dispatchers.IO) {
            val audioList = mutableListOf<LocalTrack>()
            val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
            } else {
                MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
            }

            val projection = arrayOf(
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.ALBUM,
                MediaStore.Audio.Media.DURATION
            )

            try {
                context.contentResolver.query(
                    collection,
                    projection,
                    "${MediaStore.Audio.Media.IS_MUSIC} != 0",
                    null,
                    "${MediaStore.Audio.Media.TITLE} ASC"
                )?.use { cursor ->
                    val idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                    val titleCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
                    val artistCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
                    val albumCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
                    val durCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)

                    while (cursor.moveToNext()) {
                        val id = cursor.getLong(idCol)
                        val title = cursor.getString(titleCol) ?: "Unknown Track"
                        val artist = cursor.getString(artistCol) ?: "Unknown Artist"
                        val album = cursor.getString(albumCol) ?: "Unknown Album"
                        val duration = cursor.getLong(durCol)
                        val contentUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id)

                        audioList.add(
                            LocalTrack(
                                id = id,
                                title = title,
                                artist = if (artist == "<unknown>") "Local Media" else artist,
                                album = album,
                                durationMs = duration,
                                contentUri = contentUri
                            )
                        )
                    }
                }
            } catch (_: Exception) {}

            // Fallback streams if no local tracks found on device/emulator
            if (audioList.isEmpty()) {
                audioList.addAll(
                    listOf(
                        LocalTrack(
                            id = 101L,
                            title = "Lofi Coding Session",
                            artist = "Chillhop Music",
                            album = "CarLink DSP Demo",
                            durationMs = 230000L,
                            contentUri = Uri.parse("https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3")
                        ),
                        LocalTrack(
                            id = 102L,
                            title = "Synthwave Cruise",
                            artist = "Nightdrive Audio",
                            album = "CarLink High Quality",
                            durationMs = 195000L,
                            contentUri = Uri.parse("https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a7321d.mp3?filename=synthwave-80s-110045.mp3")
                        ),
                        LocalTrack(
                            id = 103L,
                            title = "Ambient Highway",
                            artist = "Electronic Drift",
                            album = "CarLink Master",
                            durationMs = 210000L,
                            contentUri = Uri.parse("https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=ambient-relax-10444.mp3")
                        )
                    )
                )
            }

            _tracks.value = audioList
            if (_currentTrack.value == null && audioList.isNotEmpty()) {
                _currentTrack.value = audioList.first()
            }
        }
    }

    fun playTrack(track: LocalTrack) {
        _currentTrack.value = track
        exoPlayer?.let { p ->
            p.setMediaItem(MediaItem.fromUri(track.contentUri))
            p.prepare()
            p.play()
        }
    }

    fun play() {
        if (exoPlayer?.playbackState == Player.STATE_IDLE || exoPlayer?.mediaItemCount == 0) {
            _currentTrack.value?.let { playTrack(it) }
        } else {
            exoPlayer?.play()
        }
    }

    fun pause() {
        exoPlayer?.pause()
    }

    fun togglePlay() {
        if (_isPlaying.value) {
            pause()
        } else {
            play()
        }
    }

    fun nextTrack() {
        val list = _tracks.value
        if (list.isEmpty()) return
        val currIndex = list.indexOfFirst { it.id == _currentTrack.value?.id }
        val nextIndex = if (currIndex >= 0 && currIndex < list.size - 1) currIndex + 1 else 0
        playTrack(list[nextIndex])
    }

    fun previousTrack() {
        val list = _tracks.value
        if (list.isEmpty()) return
        val currIndex = list.indexOfFirst { it.id == _currentTrack.value?.id }
        val prevIndex = if (currIndex > 0) currIndex - 1 else list.size - 1
        playTrack(list[prevIndex])
    }

    fun seekTo(progressFraction: Float) {
        val dur = _durationMs.value
        if (dur > 0) {
            val targetMs = (dur * progressFraction.coerceIn(0f, 1f)).toLong()
            exoPlayer?.seekTo(targetMs)
            _currentPositionMs.value = targetMs
            _progress.value = progressFraction
        }
    }

    fun release() {
        progressJob?.cancel()
        try {
            exoPlayer?.stop()
            exoPlayer?.release()
        } catch (_: Exception) {}
        exoPlayer = null
    }
}
