package com.ziyad.carlinkit.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ziyad.carlinkit.SystemBridge
import com.ziyad.carlinkit.ui.theme.MeridianColors
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Persistent 140dp control rail, modelled on CarPlay.
 *
 * The point is that nothing here ever navigates away: speed, clock and full
 * transport controls stay on screen whatever the driver is doing, so changing
 * a track costs one glance and one press instead of a trip through a menu.
 */
@Composable
fun ControlRail(
    bridge: SystemBridge,
    m: MeridianColors,
    onHome: () -> Unit,
    onApps: () -> Unit,
    appsSelected: Boolean
) {
    val speed by bridge.currentSpeedKmh.collectAsState()

    // Prefer a real media session, fall back to Bluetooth notification metadata
    val extTitle by bridge.externalMedia.title.collectAsState()
    val extArtist by bridge.externalMedia.artist.collectAsState()
    val btTitle by bridge.btTitle.collectAsState()
    val btArtist by bridge.btArtist.collectAsState()
    val extPlaying by bridge.externalMedia.isPlaying.collectAsState()
    val localTrack by bridge.localPlayerManager.currentTrack.collectAsState()
    val localPlaying by bridge.localPlayerManager.isPlaying.collectAsState()

    val title = extTitle ?: btTitle ?: localTrack?.title
    val artist = extArtist ?: btArtist ?: localTrack?.artist
    val playing = if (extTitle != null || btTitle != null) extPlaying else localPlaying
    val external = extTitle != null || btTitle != null

    var time by remember { mutableStateOf("") }
    LaunchedEffect(Unit) {
        while (true) {
            time = SimpleDateFormat("h:mm", Locale.getDefault()).format(Date())
            delay(10_000)
        }
    }

    Column(
        modifier = Modifier
            .width(140.dp)
            .fillMaxHeight()
            .background(m.card)
            .border(1.dp, m.line)
            .padding(vertical = 10.dp, horizontal = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {

        // ── Glanceable status ────────────────────────────────────────
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(time, color = m.ink, fontSize = 22.sp, fontFamily = FontFamily.Serif)
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    speed.toString(),
                    color = m.ink,
                    fontSize = 30.sp,
                    fontFamily = FontFamily.Serif
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    "KM/H",
                    color = m.sub,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 5.dp)
                )
            }
        }

        // ── Now playing + transport (never navigates away) ───────────
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(9.dp))
                    .background(m.line),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.MusicNote, null, tint = m.sub, modifier = Modifier.size(20.dp))
            }

            Text(
                text = title ?: "No media",
                color = m.ink,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                modifier = Modifier.padding(top = 6.dp)
            )
            Text(
                text = artist ?: "—",
                color = m.sub,
                fontSize = 9.sp,
                maxLines = 1
            )

            // Large centre target, flanked by skip controls
            Row(
                modifier = Modifier.padding(top = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                RailIcon(Icons.Filled.SkipPrevious, m.ink, 34) {
                    if (external) bridge.externalMedia.previous()
                    else bridge.localPlayerManager.previousTrack()
                }
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(CircleShape)
                        .background(m.accent)
                        .clickable {
                            if (external) bridge.externalMedia.togglePlayPause()
                            else bridge.localPlayerManager.togglePlay()
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        if (playing) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                        contentDescription = "Play or pause",
                        tint = m.card,
                        modifier = Modifier.size(26.dp)
                    )
                }
                RailIcon(Icons.Filled.SkipNext, m.ink, 34) {
                    if (external) bridge.externalMedia.next()
                    else bridge.localPlayerManager.nextTrack()
                }
            }
        }

        // ── Destinations for non-driving tasks ───────────────────────
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            RailIcon(Icons.Filled.Map, if (!appsSelected) m.accent else m.sub, 44, onClick = onHome)
            RailIcon(Icons.Filled.Apps, if (appsSelected) m.accent else m.sub, 44, onClick = onApps)
        }
    }
}

@Composable
private fun RailIcon(
    icon: ImageVector,
    tint: androidx.compose.ui.graphics.Color,
    size: Int,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(size.dp)
            .clip(CircleShape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, null, tint = tint, modifier = Modifier.size((size * 0.55).dp))
    }
}
