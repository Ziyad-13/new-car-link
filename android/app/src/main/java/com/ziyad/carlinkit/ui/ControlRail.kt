package com.ziyad.carlinkit.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
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
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ziyad.carlinkit.R
import com.ziyad.carlinkit.SystemBridge
import com.ziyad.carlinkit.ui.theme.MeridianColors
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// Rail surface is always dark, independent of the day/night map theme, so the
// controls read as a distinct instrument panel rather than part of the map.
private val RailBg = Color(0xFF14161A)
private val RailCard = Color(0xFF1F232A)
private val RailLine = Color(0xFF2C313A)
private val RailInk = Color(0xFFECE8DC)
private val RailSub = Color(0xFF8B909B)
private val RailAccent = Color(0xFF7C9AD4)

/**
 * Persistent 140dp control rail, modelled on CarPlay.
 *
 * Nothing here navigates away: speed, clock and transport controls stay on
 * screen whatever else is happening, so changing a track costs one glance
 * and one press instead of a trip through a menu.
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

    val extTitle by bridge.externalMedia.title.collectAsState()
    val extArtist by bridge.externalMedia.artist.collectAsState()
    val albumArt by bridge.externalMedia.albumArt.collectAsState()
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

    Box(
        modifier = Modifier
            .width(140.dp)
            .fillMaxHeight()
            .background(RailBg)
    ) {

        // Album art bleeds through as a dim, blurred backdrop
        albumArt?.let { art ->
            Image(
                bitmap = art.asImageBitmap(),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .blur(28.dp)
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            listOf(
                                RailBg.copy(alpha = 0.94f),
                                RailBg.copy(alpha = 0.82f),
                                RailBg.copy(alpha = 0.94f)
                            )
                        )
                    )
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 8.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {

            // ── Status card ──────────────────────────────────────────
            RailCardSurface {
                Text(time, color = RailInk, fontSize = 20.sp, fontFamily = FontFamily.Serif)
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        speed.toString(),
                        color = RailAccent,
                        fontSize = 30.sp,
                        fontFamily = FontFamily.Serif
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "KM/H",
                        color = RailSub,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 5.dp)
                    )
                }
            }

            // ── Now playing card ─────────────────────────────────────
            RailCardSurface {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(RailLine),
                    contentAlignment = Alignment.Center
                ) {
                    if (albumArt != null) {
                        Image(
                            bitmap = albumArt!!.asImageBitmap(),
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Icon(
                            Icons.Filled.MusicNote,
                            null,
                            tint = RailSub,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                Text(
                    text = title ?: stringResourceSafe(),
                    color = RailInk,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    modifier = Modifier.padding(top = 8.dp)
                )
                Text(
                    text = artist ?: "—",
                    color = RailSub,
                    fontSize = 9.sp,
                    maxLines = 1
                )

                Row(
                    modifier = Modifier.padding(top = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    RailIcon(Icons.Filled.SkipPrevious, RailInk, 34) {
                        if (external) bridge.externalMedia.previous()
                        else bridge.localPlayerManager.previousTrack()
                    }
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.verticalGradient(
                                    listOf(RailAccent, RailAccent.copy(alpha = 0.72f))
                                )
                            )
                            .clickable {
                                if (external) bridge.externalMedia.togglePlayPause()
                                else bridge.localPlayerManager.togglePlay()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            if (playing) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                            contentDescription = "Play or pause",
                            tint = Color(0xFF11141A),
                            modifier = Modifier.size(26.dp)
                        )
                    }
                    RailIcon(Icons.Filled.SkipNext, RailInk, 34) {
                        if (external) bridge.externalMedia.next()
                        else bridge.localPlayerManager.nextTrack()
                    }
                }
            }

            // ── Navigation card ──────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(RailCard)
                    .border(1.dp, RailLine, RoundedCornerShape(14.dp))
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                RailTab(Icons.Filled.Map, !appsSelected, onHome)
                RailTab(Icons.Filled.Apps, appsSelected, onApps)
            }
        }
    }
}

@Composable
private fun stringResourceSafe(): String =
    androidx.compose.ui.res.stringResource(R.string.media_no_track)

@Composable
private fun RailCardSurface(content: @Composable () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(RailCard)
            .border(1.dp, RailLine, RoundedCornerShape(14.dp))
            .padding(vertical = 10.dp, horizontal = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        content()
    }
}

@Composable
private fun RailTab(icon: ImageVector, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(46.dp)
            .clip(RoundedCornerShape(11.dp))
            .then(
                if (selected) Modifier.background(RailAccent.copy(alpha = 0.18f))
                else Modifier
            )
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            icon,
            null,
            tint = if (selected) RailAccent else RailSub,
            modifier = Modifier.size(22.dp)
        )
    }
}

@Composable
private fun RailIcon(icon: ImageVector, tint: Color, size: Int, onClick: () -> Unit) {
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
