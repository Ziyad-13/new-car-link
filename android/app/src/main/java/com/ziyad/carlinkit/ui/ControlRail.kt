package com.ziyad.carlinkit.ui

import com.ziyad.carlinkit.ui.theme.MesaIcons

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
import androidx.compose.material.icons.rounded.GridView
import androidx.compose.material.icons.rounded.Explore
import androidx.compose.material.icons.rounded.Album
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.SkipNext
import androidx.compose.material.icons.rounded.SkipPrevious
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
import androidx.compose.ui.res.stringResource
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

// Translucent dark glass: the map shows through, but text stays legible.
private val GlassTop = Color(0xEB14161A)
private val GlassBottom = Color(0xEB1B1F26)
private val GlassEdge = Color(0x24FFFFFF)
private val PanelFill = Color(0x1AFFFFFF)
private val PanelEdge = Color(0x1FFFFFFF)
private val RailInk = Color(0xFFF2EFE7)
private val RailSub = Color(0xFF9AA0AC)
private val RailAccent = Color(0xFF8FADE0)

/**
 * Floating glass control rail.
 *
 * Sits above the map rather than beside it, so the map keeps the full width
 * while speed, clock and transport controls remain permanently reachable.
 * Three stacked panels: status, now playing, navigation.
 */
@Composable
fun ControlRail(
    bridge: SystemBridge,
    m: MeridianColors,
    onHome: () -> Unit,
    onApps: () -> Unit,
    appsSelected: Boolean,
    modifier: Modifier = Modifier
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
        modifier = modifier
            .padding(start = 10.dp, top = 10.dp, bottom = 10.dp)
            .width(168.dp)
            .fillMaxHeight()
            .clip(RoundedCornerShape(22.dp))
            .background(Brush.verticalGradient(listOf(GlassTop, GlassBottom)))
            .border(1.dp, GlassEdge, RoundedCornerShape(22.dp))
    ) {

        // Album art tints the glass from behind
        albumArt?.let { art ->
            Image(
                bitmap = art.asImageBitmap(),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize().blur(34.dp)
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Brush.verticalGradient(listOf(GlassTop, GlassBottom)))
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {

            // ── 1. Status ────────────────────────────────────────────
            GlassPanel {
                Text(time, color = RailInk.copy(alpha = 0.60f), fontSize = 21.sp, fontFamily = FontFamily.Serif)
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        speed.toString(),
                        color = RailInk,
                        fontSize = 34.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif
                    )
                    Spacer(Modifier.width(5.dp))
                    Text(
                        stringResource(R.string.nav_speed_unit),
                        color = RailSub,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                }
            }

            // ── 2. Now playing ───────────────────────────────────────
            GlassPanel(modifier = Modifier.weight(1f)) {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(PanelFill),
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
                            MesaIcons.Album,
                            null,
                            tint = RailSub,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }

                Text(
                    text = title ?: stringResource(R.string.media_no_track),
                    color = RailInk,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    modifier = Modifier.padding(top = 8.dp)
                )
                Text(text = artist ?: "—", color = RailInk.copy(alpha = 0.55f), fontSize = 11.sp, maxLines = 1)

                Spacer(Modifier.height(10.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    RailIcon(MesaIcons.SkipPrevious, RailInk, 44) {
                        if (external) bridge.externalMedia.previous()
                        else bridge.localPlayerManager.previousTrack()
                    }
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.verticalGradient(
                                    listOf(RailAccent, RailAccent.copy(alpha = 0.7f))
                                )
                            )
                            .clickable {
                                if (external) bridge.externalMedia.togglePlayPause()
                                else bridge.localPlayerManager.togglePlay()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            if (playing) MesaIcons.Pause else MesaIcons.Play,
                            contentDescription = "Play or pause",
                            tint = Color(0xFF11141A),
                            modifier = Modifier.size(30.dp)
                        )
                    }
                    RailIcon(MesaIcons.SkipNext, RailInk, 44) {
                        if (external) bridge.externalMedia.next()
                        else bridge.localPlayerManager.nextTrack()
                    }
                }
            }

            // ── 3. Navigation ────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(PanelFill)
                    .border(1.dp, PanelEdge, RoundedCornerShape(16.dp))
                    .padding(vertical = 5.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                RailTab(MesaIcons.Navigate, !appsSelected, onHome)
                RailTab(MesaIcons.Apps, appsSelected, onApps)
            }
        }
    }
}

@Composable
private fun GlassPanel(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(PanelFill)
            .border(1.dp, PanelEdge, RoundedCornerShape(16.dp))
            .padding(vertical = 10.dp, horizontal = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        content()
    }
}

@Composable
private fun RailTab(icon: ImageVector, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(54.dp)
            .clip(RoundedCornerShape(14.dp))
            .then(
                if (selected) Modifier.background(RailAccent.copy(alpha = 0.22f))
                else Modifier
            )
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            icon,
            null,
            tint = if (selected) RailAccent else RailSub,
            modifier = Modifier.size(26.dp)
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
        Icon(icon, null, tint = tint, modifier = Modifier.size((size * 0.62).dp))
    }
}
