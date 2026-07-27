package com.ziyad.carlinkit.ui.screens

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
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocalGasStation
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.Work
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.ziyad.carlinkit.SystemBridge
import com.ziyad.carlinkit.ui.theme.MeridianColors
import com.ziyad.carlinkit.ui.theme.MeridianDay
import com.ziyad.carlinkit.ui.theme.MeridianNight
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Meridian cockpit — Compose port of the AI Studio prototype layout:
 * map panel on the left, information column on the right (speed / clock / media).
 */
@Composable
fun MeridianScreen(
    bridge: SystemBridge,
    isNight: Boolean,
    onOpenApps: () -> Unit,
    onOpenMedia: () -> Unit
) {
    val c = if (isNight) MeridianNight else MeridianDay

    val speed by bridge.currentSpeedKmh.collectAsState()
    val wifiSsid by bridge.wifiSsidState.collectAsState()
    val latLon by bridge.latLon.collectAsState()
    val isPlaying by bridge.isPlaying.collectAsState()
    val track by bridge.currentTrack.collectAsState()

    var time by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("") }
    var eta by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        while (true) {
            val now = Date()
            time = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(now)
            date = SimpleDateFormat("EEE, MMM d", Locale.getDefault()).format(now).uppercase()
            val cal = Calendar.getInstance().apply { add(Calendar.MINUTE, 14) }
            eta = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(cal.time)
            delay(1000)
        }
    }

    Row(modifier = Modifier.fillMaxSize().background(c.bg)) {

        // ── Map panel ────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .weight(1.6f)
                .fillMaxHeight()
                .background(c.map)
        ) {
            if (com.ziyad.carlinkit.BuildConfig.MAPS_KEY.isNotBlank()) {
                GoogleMapPanel(latLon, isNight)
            } else {
                MapBackdrop(c, latLon, isNight)
            }

            // Search pill
            Row(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(24.dp)
                    .fillMaxWidth()
                    .height(48.dp)
                    .clip(CircleShape)
                    .background(c.card)
                    .border(1.dp, c.line, CircleShape)
                    .clickable { bridge.navigate("") }
                    .padding(horizontal = 20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Filled.Search, null, tint = c.sub, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(12.dp))
                Text("Where to?", color = c.sub, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            }

            // ETA card + destination chips
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(24.dp)
            ) {
                Column(
                    modifier = Modifier
                        .clip(RoundedCornerShape(13.dp))
                        .background(c.card)
                        .border(1.dp, c.line, RoundedCornerShape(13.dp))
                        .padding(horizontal = 16.dp, vertical = 10.dp)
                ) {
                    Row {
                        Text(eta, color = c.accent, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        Text(" arrival", color = c.sub, fontSize = 13.sp)
                    }
                    Text("Home · 14 min", color = c.ink, fontSize = 14.sp,
                        fontWeight = FontWeight.Medium, modifier = Modifier.padding(top = 2.dp))
                }

                Spacer(Modifier.height(12.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    DestChip("Home", Icons.Filled.Home, c) { bridge.navigate("home") }
                    DestChip("Work", Icons.Filled.Work, c) { bridge.navigate("work") }
                    DestChip("Fuel", Icons.Filled.LocalGasStation, c) { bridge.navigate("gas station") }
                }
            }
        }

        // ── Information column ───────────────────────────────────────
        Column(
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight()
                .background(c.bg)
        ) {
            // Major block: speed + clock
            Column(
                modifier = Modifier
                    .weight(1.6f)
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "CARLINKKIT",
                        color = c.sub,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.2.sp
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Filled.LocationOn, null, tint = c.sub, modifier = Modifier.size(16.dp))
                        Icon(Icons.Filled.Wifi, null, tint = c.sub, modifier = Modifier.size(16.dp))
                    }
                }

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = speed.toString(),
                        color = c.ink,
                        fontSize = 84.sp,
                        fontFamily = FontFamily.Serif,
                        lineHeight = 84.sp
                    )
                    Text(
                        "KM/H",
                        color = c.sub,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 2.sp,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }

                Column(modifier = Modifier.fillMaxWidth()) {
                    Column {
                        Text(time, color = c.ink, fontSize = 26.sp, fontFamily = FontFamily.Serif)
                        Text(
                            date,
                            color = c.sub,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            letterSpacing = 0.8.sp,
                            modifier = Modifier.padding(top = 6.dp)
                        )
                    }
                    Text(
                        "${bridge.deviceModel()} · $wifiSsid",
                        color = c.sub,
                        fontSize = 9.sp,
                        maxLines = 1,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }

            Box(Modifier.fillMaxWidth().height(1.dp).background(c.line))

            // Minor block: media + quick actions
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(c.line),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.MusicNote, null, tint = c.sub, modifier = Modifier.size(22.dp))
                    }
                    Spacer(Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            track?.title ?: "Nothing playing",
                            color = c.ink,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1
                        )
                        Text(
                            track?.artist ?: "—",
                            color = c.sub,
                            fontSize = 12.sp,
                            maxLines = 1,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        TapIcon(Icons.Filled.SkipPrevious, c.ink) {
                            bridge.localPlayerManager.previousTrack()
                        }
                        TapIcon(
                            if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                            c.ink
                        ) { bridge.localPlayerManager.togglePlay() }
                        TapIcon(Icons.Filled.SkipNext, c.ink) {
                            bridge.localPlayerManager.nextTrack()
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .border(1.dp, c.line, CircleShape)
                            .clickable { onOpenMedia() }
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text(
                            "LIBRARY",
                            color = c.accent,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.5.sp
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(18.dp)) {
                        TapIcon(Icons.Filled.Phone, c.ink) { bridge.launch("com.android.dialer") }
                        TapIcon(Icons.Filled.Chat, c.ink) { bridge.launch("com.android.messaging") }
                        TapIcon(Icons.Filled.GridView, c.accent) { onOpenApps() }
                    }
                }
            }
        }
    }
}

/**
 * Google Maps panel, used when a Maps SDK for Android key is configured.
 */
@Composable
private fun GoogleMapPanel(latLon: Pair<Double, Double>?, isNight: Boolean) {
    val target = com.google.android.gms.maps.model.LatLng(
        latLon?.first ?: 24.7136,
        latLon?.second ?: 46.6753
    )
    val cameraPositionState = com.google.maps.android.compose.rememberCameraPositionState {
        position = com.google.android.gms.maps.model.CameraPosition.fromLatLngZoom(target, 16f)
    }

    LaunchedEffect(latLon) {
        latLon?.let { (lat, lon) ->
            cameraPositionState.position =
                com.google.android.gms.maps.model.CameraPosition.fromLatLngZoom(
                    com.google.android.gms.maps.model.LatLng(lat, lon), 16f
                )
        }
    }

    com.google.maps.android.compose.GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraPositionState,
        properties = com.google.maps.android.compose.MapProperties(
            isMyLocationEnabled = false,
            mapStyleOptions = if (isNight) {
                com.google.android.gms.maps.model.MapStyleOptions(NIGHT_MAP_STYLE)
            } else null
        ),
        uiSettings = com.google.maps.android.compose.MapUiSettings(
            zoomControlsEnabled = false,
            mapToolbarEnabled = false,
            compassEnabled = false
        )
    )
}

private const val NIGHT_MAP_STYLE = """[
  {"elementType":"geometry","stylers":[{"color":"#242f3e"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#242f3e"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#746855"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#38414e"}]},
  {"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#212a37"}]},
  {"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#746855"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#17263c"}]},
  {"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]}
]"""

/**
 * Live OpenStreetMap view — fallback when no Maps key is configured. Requires no API key, unlike the Google Maps SDK.
 * Follows the GPS position reported by SystemBridge.
 */
@Composable
private fun MapBackdrop(c: MeridianColors, latLon: Pair<Double, Double>?, isNight: Boolean) {
    val context = LocalContext.current

    val mapView = remember {
        org.osmdroid.config.Configuration.getInstance().apply {
            userAgentValue = context.packageName
            osmdroidBasePath = context.filesDir
            osmdroidTileCache = java.io.File(context.filesDir, "osm_tiles")
        }
        org.osmdroid.views.MapView(context).apply {
            setTileSource(org.osmdroid.tileprovider.tilesource.TileSourceFactory.MAPNIK)
            setMultiTouchControls(true)
            zoomController.setVisibility(
                org.osmdroid.views.CustomZoomButtonsController.Visibility.NEVER
            )
            controller.setZoom(16.0)
            // Riyadh as the initial view until the first GPS fix arrives
            controller.setCenter(org.osmdroid.util.GeoPoint(24.7136, 46.6753))
            if (isNight) {
                overlayManager.tilesOverlay.setColorFilter(
                    android.graphics.ColorMatrixColorFilter(
                        floatArrayOf(
                            -1f, 0f, 0f, 0f, 255f,
                            0f, -1f, 0f, 0f, 255f,
                            0f, 0f, -1f, 0f, 255f,
                            0f, 0f, 0f, 1f, 0f
                        )
                    )
                )
            }
        }
    }

    // Recentre whenever a new fix arrives
    LaunchedEffect(latLon) {
        latLon?.let { (lat, lon) ->
            mapView.controller.animateTo(org.osmdroid.util.GeoPoint(lat, lon))
        }
    }

    AndroidView(
        factory = { mapView },
        modifier = Modifier.fillMaxSize()
    )
}

@Composable
private fun DestChip(label: String, icon: ImageVector, c: MeridianColors, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(13.dp))
            .background(c.card)
            .border(1.dp, c.line, RoundedCornerShape(13.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = c.accent, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(8.dp))
        Text(label, color = c.ink, fontSize = 13.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun TapIcon(icon: ImageVector, tint: androidx.compose.ui.graphics.Color, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(48.dp)
            .clip(CircleShape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, null, tint = tint, modifier = Modifier.size(22.dp))
    }
}
