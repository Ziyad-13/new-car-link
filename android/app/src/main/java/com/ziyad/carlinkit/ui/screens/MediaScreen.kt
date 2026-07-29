package com.ziyad.carlinkit.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FastForward
import androidx.compose.material.icons.filled.FastRewind
import androidx.compose.material.icons.filled.LibraryMusic
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material3.Icon
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ziyad.carlinkit.LocalTrack
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import com.ziyad.carlinkit.SystemBridge
import com.ziyad.carlinkit.ui.theme.M
import com.ziyad.carlinkit.ui.theme.*

@Composable
fun MediaScreen(bridge: SystemBridge) {
    val currentTrack by bridge.localPlayerManager.currentTrack.collectAsState()
    val isPlaying by bridge.localPlayerManager.isPlaying.collectAsState()
    val progress by bridge.localPlayerManager.progress.collectAsState()
    val currentPosMs by bridge.localPlayerManager.currentPositionMs.collectAsState()
    val durationMs by bridge.localPlayerManager.durationMs.collectAsState()
    val tracks by bridge.localPlayerManager.tracks.collectAsState()

    // External players (Spotify, Bluetooth, YouTube Music …)
    val ctx = androidx.compose.ui.platform.LocalContext.current
    val extTitle by bridge.externalMedia.title.collectAsState()
    val extArtist by bridge.externalMedia.artist.collectAsState()
    val extPlaying by bridge.externalMedia.isPlaying.collectAsState()
    val extSource by bridge.externalMedia.sourceApp.collectAsState()
    var showDiag by remember { mutableStateOf(false) }
    var diagText by remember { mutableStateOf("") }
    var hasNotifAccess by remember {
        mutableStateOf(bridge.externalMedia.notificationAccessGranted())
    }
    androidx.compose.runtime.LaunchedEffect(Unit) {
        // Re-check after returning from the settings screen
        while (true) {
            kotlinx.coroutines.delay(1500)
            val now = bridge.externalMedia.notificationAccessGranted()
            if (now != hasNotifAccess) {
                hasNotifAccess = now
                if (now) bridge.externalMedia.start()
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (showDiag) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(M.card)
                    .border(1.dp, M.line, RoundedCornerShape(10.dp))
                    .padding(14.dp)
            ) {
                Text(
                    "MEDIA SESSION DIAGNOSTICS",
                    color = M.sub,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.2.sp
                )
                Text(
                    diagText,
                    color = M.ink,
                    fontSize = 11.sp,
                    modifier = Modifier.padding(top = 8.dp)
                )
                Row(modifier = Modifier.padding(top = 10.dp)) {
                    Text(
                        "REFRESH",
                        color = M.accent,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable {
                                bridge.externalMedia.refresh()
                                diagText = bridge.externalMedia.diagnostics()
                            }
                            .padding(horizontal = 14.dp, vertical = 10.dp)
                    )
                }
            }
        }

        if (!hasNotifAccess) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(M.accent.copy(alpha = 0.10f))
                    .border(1.dp, M.accent, RoundedCornerShape(14.dp))
                    .padding(16.dp)
            ) {
                Text(
                    "Enable media control",
                    color = M.ink,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    "Android requires notification access before this launcher can control Spotify, Bluetooth or other players.",
                    color = M.sub,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 4.dp)
                )
                Box(
                    modifier = Modifier
                        .padding(top = 12.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(M.accent)
                        .clickable {
                            try {
                                ctx.startActivity(
                                    android.content.Intent(
                                        android.provider.Settings
                                            .ACTION_NOTIFICATION_LISTENER_SETTINGS
                                    ).addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                                )
                            } catch (_: Throwable) {
                            }
                        }
                        .padding(horizontal = 20.dp, vertical = 12.dp)
                ) {
                    Text("OPEN SETTINGS", color = M.card, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        } else if (extTitle != null) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(M.card)
                    .border(1.dp, M.line, RoundedCornerShape(14.dp))
                    .padding(16.dp)
            ) {
                Text(
                    extSource ?: "External player",
                    color = M.sub,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.5.sp
                )
                Text(
                    extTitle ?: "",
                    color = M.ink,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    modifier = Modifier.padding(top = 6.dp)
                )
                Text(extArtist ?: "", color = M.sub, fontSize = 13.sp, maxLines = 1)
                Row(
                    modifier = Modifier.padding(top = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    Icon(
                        Icons.Default.SkipPrevious, "Previous", tint = M.ink,
                        modifier = Modifier.size(34.dp)
                            .clip(CircleShape)
                            .clickable { bridge.externalMedia.previous() }
                    )
                    Icon(
                        if (extPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        "Play/Pause", tint = M.accent,
                        modifier = Modifier.size(34.dp)
                            .clip(CircleShape)
                            .clickable { bridge.externalMedia.togglePlayPause() }
                    )
                    Icon(
                        Icons.Default.SkipNext, "Next", tint = M.ink,
                        modifier = Modifier.size(34.dp)
                            .clip(CircleShape)
                            .clickable { bridge.externalMedia.next() }
                    )
                }
            }
        }

        // Header — Meridian spec: 17sp bold title, source chips on the right
        com.ziyad.carlinkit.ui.theme.ScreenHeader(title = "Media") {
            com.ziyad.carlinkit.ui.theme.MChip(
                label = if (showDiag) "Hide info" else "Diagnose",
                selected = showDiag
            ) {
                diagText = bridge.externalMedia.diagnostics()
                showDiag = !showDiag
            }
            com.ziyad.carlinkit.ui.theme.MChip(
                label = extSource ?: "External",
                selected = extTitle != null
            ) {}
            com.ziyad.carlinkit.ui.theme.MChip(
                label = "Library",
                selected = extTitle == null
            ) {}
        }

        Row(
            modifier = Modifier.fillMaxSize(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Left: Now Playing Card
            Box(
                modifier = Modifier
                    .weight(0.6f)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(24.dp))
                    .background(M.card)
                    .border(1.dp, M.line, RoundedCornerShape(24.dp))
                    .padding(24.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Album Art & Info
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(130.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(
                                    Brush.linearGradient(
                                        colors = listOf(M.accent, Color(0xFF6B21A8))
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.LibraryMusic,
                                contentDescription = "Album Art",
                                tint = M.ink.copy(alpha = 0.6f),
                                modifier = Modifier.size(48.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(20.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = currentTrack?.title ?: "Select a Track",
                                color = M.ink,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = currentTrack?.artist ?: "Local Media Player",
                                color = M.accent,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = currentTrack?.album ?: "Built-in DSP Engine Active",
                                color = M.sub,
                                fontSize = 13.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    // Progress Bar
                    Column(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = formatMs(currentPosMs), color = M.sub, fontSize = 12.sp)
                            Text(text = formatMs(durationMs), color = M.sub, fontSize = 12.sp)
                        }
                        Spacer(modifier = Modifier.height(4.dp))

                        Slider(
                            value = progress,
                            onValueChange = { bridge.localPlayerManager.seekTo(it) },
                            colors = SliderDefaults.colors(
                                thumbColor = M.accent,
                                activeTrackColor = M.accent,
                                inactiveTrackColor = M.line
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    // Playback Controls
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.FastRewind,
                            contentDescription = "Rewind",
                            tint = M.sub,
                            modifier = Modifier
                                .size(32.dp)
                                .clickable { bridge.localPlayerManager.seekTo((progress - 0.1f).coerceAtLeast(0f)) }
                        )
                        Icon(
                            imageVector = Icons.Default.SkipPrevious,
                            contentDescription = "Previous",
                            tint = M.ink,
                            modifier = Modifier
                                .size(38.dp)
                                .clickable { bridge.localPlayerManager.previousTrack() }
                        )
                        // Play/Pause Button
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .background(M.accent)
                                .clickable { bridge.localPlayerManager.togglePlay() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                contentDescription = if (isPlaying) "Pause" else "Play",
                                tint = M.ink,
                                modifier = Modifier.size(32.dp)
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.SkipNext,
                            contentDescription = "Next",
                            tint = M.ink,
                            modifier = Modifier
                                .size(38.dp)
                                .clickable { bridge.localPlayerManager.nextTrack() }
                        )
                        Icon(
                            imageVector = Icons.Default.FastForward,
                            contentDescription = "Forward",
                            tint = M.sub,
                            modifier = Modifier
                                .size(32.dp)
                                .clickable { bridge.localPlayerManager.seekTo((progress + 0.1f).coerceAtMost(1f)) }
                        )
                    }
                }
            }

            // Right: Local Track List / Media Store
            Column(
                modifier = Modifier
                    .weight(0.4f)
                    .fillMaxHeight(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "LOCAL MEDIA TRACKS (${tracks.size})",
                    color = M.sub,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(start = 4.dp, bottom = 2.dp)
                )

                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(tracks) { track ->
                        val isSelected = currentTrack?.id == track.id
                        TrackListItem(
                            track = track,
                            isSelected = isSelected,
                            onClick = { bridge.localPlayerManager.playTrack(track) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TrackListItem(track: LocalTrack, isSelected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(if (isSelected) M.accent.copy(alpha = 0.18f) else M.card)
            .border(1.dp, if (isSelected) M.accent else M.line, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(12.dp)
    ) {
        Column {
            Text(
                text = track.title,
                color = if (isSelected) M.accent else M.ink,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "${track.artist} • ${formatMs(track.durationMs)}",
                color = M.sub,
                fontSize = 11.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

fun formatMs(ms: Long): String {
    val totalSeconds = (ms / 1000).coerceAtLeast(0)
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return String.format("%d:%02d", minutes, seconds)
}
