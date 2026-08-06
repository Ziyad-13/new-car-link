package com.ziyad.carlinkit.ui.screens

import com.ziyad.carlinkit.ui.theme.MesaIcons

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
import androidx.compose.material.icons.rounded.Chat
import androidx.compose.material.icons.rounded.GridView
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.LocalGasStation
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.MusicNote
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.Phone
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.SkipNext
import androidx.compose.material.icons.rounded.SkipPrevious
import androidx.compose.material.icons.rounded.Wifi
import androidx.compose.material.icons.rounded.BusinessCenter
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.material.icons.rounded.OpenInFull
import androidx.compose.material.icons.rounded.CloseFullscreen
import androidx.compose.material.icons.rounded.TurnLeft
import androidx.compose.material.icons.rounded.TurnRight
import androidx.compose.material.icons.rounded.TurnSlightLeft
import androidx.compose.material.icons.rounded.TurnSlightRight
import androidx.compose.material.icons.rounded.UTurnLeft
import androidx.compose.material.icons.rounded.RoundaboutLeft
import androidx.compose.material.icons.rounded.MergeType
import androidx.compose.material.icons.rounded.ForkRight
import androidx.compose.material.icons.rounded.Straight
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material.icons.rounded.History
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import com.ziyad.carlinkit.R
import com.ziyad.carlinkit.SystemBridge
import com.ziyad.carlinkit.ui.theme.MeridianColors
import com.ziyad.carlinkit.ui.theme.MeridianDay
import com.ziyad.carlinkit.ui.theme.MeridianNight
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Meridian cockpit — Compose port of the AI Studio prototype layout:
 * map panel on the left, information column on the right (speed / clock / media).
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MeridianScreen(
    bridge: SystemBridge,
    isNight: Boolean,
    onOpenApps: () -> Unit,
    onOpenMedia: () -> Unit,
    fullscreenMap: Boolean = false,
    onToggleFullscreen: () -> Unit = {}
) {
    val c = if (isNight) MeridianNight else MeridianDay

    val speed by bridge.currentSpeedKmh.collectAsState()
    val wifiSsid by bridge.wifiSsidState.collectAsState()
    val latLon by bridge.latLon.collectAsState()
    val bearing by bridge.bearing.collectAsState()
    val isPlaying by bridge.isPlaying.collectAsState()
    val track by bridge.currentTrack.collectAsState()

    val context = LocalContext.current
    var showSearch by remember { mutableStateOf(false) }
    var query by remember { mutableStateOf("") }
    var recents by remember { mutableStateOf(loadRecents(context)) }
    var homeAddr by remember { mutableStateOf(loadPlace(context, "home")) }
    var workAddr by remember { mutableStateOf(loadPlace(context, "work")) }
    var editingSlot by remember { mutableStateOf<String?>(null) }

    var route by remember { mutableStateOf<com.ziyad.carlinkit.Route?>(null) }
    var routing by remember { mutableStateOf(false) }
    var routeError by remember { mutableStateOf<String?>(null) }
    var guidance by remember {
        mutableStateOf<com.ziyad.carlinkit.NavigationTracker.Guidance?>(null)
    }
    var stepFloor by remember { mutableStateOf(0) }
    var rerouting by remember { mutableStateOf(false) }
    // Consecutive off-route fixes. One stray reading is noise; several in a
    // row means the driver really has left the route.
    var offRouteStreak by remember { mutableStateOf(0) }
    val pushedDestination by bridge.destinationServer.incoming.collectAsState()
    val scope = androidx.compose.runtime.rememberCoroutineScope()

    fun go(destination: String) {
        if (destination.isBlank()) return
        recents = saveRecent(context, destination)
        showSearch = false
        query = ""
        // Draw the route on our own map; only hand off if that fails.
        val ll = latLon
        if (ll == null) {
            routeError = destination
            return
        }
        routing = true
        routeError = null
        scope.launch {
            // A shared maps link resolves to coordinates or a place name first
            val resolved = com.ziyad.carlinkit.RouteService.resolveDestination(destination)
            val r = com.ziyad.carlinkit.RouteService.fetchRoute(
                com.google.android.gms.maps.model.LatLng(ll.first, ll.second),
                resolved
            )
            routing = false
            // Stay inside the launcher on failure; offer the handoff, never force it.
            if (r != null) {
                route = r
                stepFloor = 0
            } else routeError = destination
        }
    }

    // Recompute the current step whenever the car moves.
    LaunchedEffect(latLon, route) {
        val r = route
        val ll = latLon
        if (r == null || ll == null) {
            guidance = null
            return@LaunchedEffect
        }
        val here = com.google.android.gms.maps.model.LatLng(ll.first, ll.second)
        val g = com.ziyad.carlinkit.NavigationTracker.guidanceFor(r, here, stepFloor)
        guidance = g
        if (g != null && g.stepIndex > stepFloor) stepFloor = g.stepIndex

        // Off-route detection and recalculation
        if (g == null || rerouting) return@LaunchedEffect
        val off = g.offRouteMeters >
            com.ziyad.carlinkit.NavigationTracker.OFF_ROUTE_THRESHOLD_METERS
        offRouteStreak = if (off) offRouteStreak + 1 else 0

        if (offRouteStreak >= 3) {
            rerouting = true
            offRouteStreak = 0
            // Recalculate from where we actually are, to the same destination.
            val fresh = com.ziyad.carlinkit.RouteService.fetchRoute(
                here,
                r.destination.latitude.toString() + "," + r.destination.longitude.toString()
            )
            if (fresh != null) {
                route = fresh.copy(destinationName = r.destinationName)
                stepFloor = 0
            }
            rerouting = false
        }
    }

    LaunchedEffect(pushedDestination) {
        pushedDestination?.let {
            go(it)
            bridge.destinationServer.consume()
        }
    }

    // When set, the next voice result fills an editor field instead of navigating
    var voiceTarget by remember { mutableStateOf<((String) -> Unit)?>(null) }

    // Voice input — far easier than typing while driving
    val voiceLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val spoken = result.data
            ?.getStringArrayListExtra(android.speech.RecognizerIntent.EXTRA_RESULTS)
            ?.firstOrNull()
        if (!spoken.isNullOrBlank()) {
            val target = voiceTarget
            if (target != null) {
                target(spoken)
                voiceTarget = null
            } else {
                go(spoken)
            }
        }
    }

    fun startVoiceSearch() {
        try {
            val intent = android.content.Intent(
                android.speech.RecognizerIntent.ACTION_RECOGNIZE_SPEECH
            ).apply {
                putExtra(
                    android.speech.RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                    android.speech.RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
                )
                putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE, "ar-SA")
                putExtra(android.speech.RecognizerIntent.EXTRA_PROMPT, "Where do you want to go?")
            }
            voiceLauncher.launch(intent)
        } catch (_: Throwable) {
        }
    }

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

    if (showSearch) {
        SearchDialog(
            c = c,
            query = query,
            recents = recents,
            onQueryChange = { query = it },
            onSearch = { go(query) },
            onPick = { go(it) },
            onVoice = { startVoiceSearch() },
            onDismiss = { showSearch = false }
        )
    }

    editingSlot?.let { slot ->
        PlaceEditorDialog(
            c = c,
            slot = slot,
            initial = if (slot == "home") homeAddr.orEmpty() else workAddr.orEmpty(),
            onVoice = { onResult ->
                voiceTarget = onResult
                startVoiceSearch()
            },
            onSave = { value ->
                savePlace(context, slot, value)
                if (slot == "home") homeAddr = value else workAddr = value
                editingSlot = null
            },
            onDismiss = { editingSlot = null }
        )
    }

    Row(modifier = Modifier.fillMaxSize().background(c.bg)) {

        // ── Map panel ────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxSize()
                .fillMaxHeight()
                .background(c.map)
        ) {
            if (com.ziyad.carlinkit.BuildConfig.MAPS_KEY.isNotBlank()) {
                GoogleMapPanel(latLon, bearing, isNight, route)
            } else {
                MapBackdrop(c, latLon, isNight)
            }

            // Search pill — stands down while a turn instruction is showing
            if (guidance == null) Row(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(
                        start = if (fullscreenMap) 18.dp else 188.dp,
                        end = 74.dp,
                        top = 18.dp
                    )
                    .fillMaxWidth()
                    .height(48.dp)
                    .clip(CircleShape)
                    .background(c.card)
                    .border(1.dp, c.line, CircleShape)
                    .combinedClickable(
                        onClick = { showSearch = true },
                        onLongClick = { startVoiceSearch() }
                    )
                    .padding(horizontal = 20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(MesaIcons.Search, null, tint = c.sub, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(12.dp))
                Text(stringResource(R.string.nav_search_placeholder), color = c.sub, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            }

            // Expand / collapse the map to the full display
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(14.dp)
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(c.card)
                    .border(1.dp, c.line, CircleShape)
                    .clickable { onToggleFullscreen() },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    if (fullscreenMap) MesaIcons.Expand
                    else MesaIcons.Expand,
                    contentDescription = "Toggle full screen map",
                    tint = c.ink,
                    modifier = Modifier.size(20.dp)
                )
            }

            // Compact speed readout, shown only when the info column is hidden
            if (fullscreenMap) {
                Row(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(14.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(c.card)
                        .border(1.dp, c.line, RoundedCornerShape(12.dp))
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        speed.toString(),
                        color = c.ink,
                        fontSize = 26.sp,
                        fontFamily = FontFamily.Serif
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(stringResource(R.string.nav_speed_unit), color = c.sub, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(14.dp))
                    Text(time, color = c.sub, fontSize = 13.sp)
                }
            }

            // Turn instruction — top of the map, the one thing that must be
            // readable in a single glance while moving.
            guidance?.let { g ->
                Row(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(
                            start = if (fullscreenMap) 18.dp else 188.dp,
                            top = 18.dp,
                            end = 18.dp
                        )
                        .clip(RoundedCornerShape(16.dp))
                        .background(c.accent)
                        .padding(horizontal = 18.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        maneuverIcon(g.maneuver),
                        contentDescription = null,
                        tint = c.card,
                        modifier = Modifier.size(34.dp)
                    )
                    Spacer(Modifier.width(14.dp))
                    Column {
                        Text(
                            if (rerouting) "Recalculating…"
                            else com.ziyad.carlinkit.NavigationTracker
                                .formatDistance(g.distanceToTurnMeters),
                            color = c.card,
                            fontSize = if (rerouting) 16.sp else 22.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            g.instruction,
                            color = c.card.copy(alpha = 0.85f),
                            fontSize = 12.sp,
                            maxLines = 2
                        )
                    }
                }
            }

            // Trip readout — bottom right, sized to be read at a glance
            if (route != null || routing) {
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(end = 18.dp, bottom = 18.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(c.card)
                        .border(1.dp, c.line, RoundedCornerShape(16.dp))
                        .padding(horizontal = 18.dp, vertical = 12.dp),
                    horizontalAlignment = Alignment.End
                ) {
                    if (routing) {
                        Text("Finding route…", color = c.sub, fontSize = 13.sp)
                    } else route?.let { r ->
                        // Minutes dominate: it is the one number that matters
                        // while moving.
                        Row(verticalAlignment = Alignment.Bottom) {
                            Text(
                                r.durationText.filter { it.isDigit() }
                                    .ifBlank { r.durationText },
                                color = c.ink,
                                fontSize = 40.sp,
                                fontFamily = FontFamily.Serif,
                                lineHeight = 40.sp
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                "min",
                                color = c.sub,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(bottom = 6.dp)
                            )
                        }
                        Text(
                            r.distanceText,
                            color = c.accent,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        // Just the first part of the address — the full string
                        // is unreadable while driving.
                        Text(
                            r.destinationName.substringBefore(",").trim(),
                            color = c.sub,
                            fontSize = 11.sp,
                            maxLines = 1,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                        Text(
                            "END",
                            color = c.sub,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier
                                .padding(top = 8.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { route = null }
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        )
                    }
                }
            }

            // Error card + destination chips
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(
                        start = if (fullscreenMap) 18.dp else 188.dp,
                        bottom = 18.dp,
                        end = 18.dp
                    )
            ) {
                routeError?.let { failed ->
                    Column(
                        modifier = Modifier
                            .clip(RoundedCornerShape(13.dp))
                            .background(c.card)
                            .border(1.dp, c.line, RoundedCornerShape(13.dp))
                            .padding(horizontal = 16.dp, vertical = 10.dp)
                    ) {
                        Text(
                            "Couldn't build the route",
                            color = c.ink,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            com.ziyad.carlinkit.RouteService.lastError ?: failed,
                            color = c.sub,
                            fontSize = 10.sp,
                            maxLines = 2,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                        Row(modifier = Modifier.padding(top = 8.dp)) {
                            Text(
                                "OPEN IN MAPS",
                                color = c.accent,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .clickable {
                                        bridge.navigate(failed)
                                        routeError = null
                                    }
                                    .padding(horizontal = 10.dp, vertical = 8.dp)
                            )
                            Text(
                                "DISMISS",
                                color = c.sub,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .clickable { routeError = null }
                                    .padding(horizontal = 10.dp, vertical = 8.dp)
                            )
                        }
                    }
                }

                Spacer(Modifier.height(12.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    DestChip(
                        label = stringResource(R.string.nav_home),
                        icon = MesaIcons.Home,
                        c = c,
                        onClick = {
                            if (homeAddr.isNullOrBlank()) editingSlot = "home"
                            else go(homeAddr!!)
                        },
                        onLongClick = { editingSlot = "home" }
                    )
                    DestChip(
                        label = stringResource(R.string.nav_work),
                        icon = MesaIcons.Work,
                        c = c,
                        onClick = {
                            if (workAddr.isNullOrBlank()) editingSlot = "work"
                            else go(workAddr!!)
                        },
                        onLongClick = { editingSlot = "work" }
                    )
                    DestChip(
                        label = stringResource(R.string.nav_fuel),
                        icon = MesaIcons.Fuel,
                        c = c,
                        onClick = { bridge.navigate("gas station") },
                        onLongClick = { bridge.navigate("gas station") }
                    )
                }
            }
        }

    }
}


@Composable
private fun SearchDialog(
    c: MeridianColors,
    query: String,
    recents: List<String>,
    onQueryChange: (String) -> Unit,
    onSearch: () -> Unit,
    onPick: (String) -> Unit,
    onVoice: () -> Unit,
    onDismiss: () -> Unit
) {
    androidx.compose.ui.window.Dialog(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(c.card)
                .padding(22.dp)
        ) {
            Text(stringResource(R.string.nav_search_placeholder), color = c.ink, fontSize = 19.sp, fontWeight = FontWeight.SemiBold)

            // Big voice button — the primary way to search while driving
            Row(
                modifier = Modifier
                    .padding(top = 16.dp)
                    .fillMaxWidth()
                    .height(64.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(c.accent)
                    .clickable(onClick = onVoice),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(Icons.Rounded.Mic, null, tint = c.card, modifier = Modifier.size(26.dp))
                Spacer(Modifier.width(12.dp))
                Text(
                    stringResource(R.string.nav_speak_destination),
                    color = c.card,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.2.sp
                )
            }

            if (recents.isNotEmpty()) {
                Text(
                    stringResource(R.string.nav_recent),
                    color = c.sub,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.5.sp,
                    modifier = Modifier.padding(top = 18.dp, bottom = 8.dp)
                )
                recents.take(4).forEach { r ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .clickable { onPick(r) }
                            .padding(vertical = 12.dp, horizontal = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Rounded.History, null, tint = c.sub, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(12.dp))
                        Text(r, color = c.ink, fontSize = 15.sp, maxLines = 1)
                    }
                }
            }

            Text(
                stringResource(R.string.nav_or_type),
                color = c.sub,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.5.sp,
                modifier = Modifier.padding(top = 18.dp, bottom = 8.dp)
            )
            androidx.compose.material3.OutlinedTextField(
                value = query,
                onValueChange = onQueryChange,
                singleLine = true,
                placeholder = { Text(stringResource(R.string.nav_place_hint), color = c.sub) },
                colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
                    focusedTextColor = c.ink,
                    unfocusedTextColor = c.ink,
                    focusedBorderColor = c.accent,
                    unfocusedBorderColor = c.line,
                    cursorColor = c.accent
                ),
                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                    imeAction = androidx.compose.ui.text.input.ImeAction.Search
                ),
                keyboardActions = androidx.compose.foundation.text.KeyboardActions(
                    onSearch = { onSearch() }
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
                Text(
                    stringResource(R.string.nav_cancel),
                    color = c.sub,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .clip(CircleShape)
                        .clickable(onClick = onDismiss)
                        .padding(horizontal = 18.dp, vertical = 14.dp)
                )
                Text(
                    stringResource(R.string.nav_go),
                    color = c.accent,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .clip(CircleShape)
                        .clickable(onClick = onSearch)
                        .padding(horizontal = 18.dp, vertical = 14.dp)
                )
            }
        }
    }
}

@Composable
private fun PlaceEditorDialog(
    c: MeridianColors,
    slot: String,
    initial: String,
    onVoice: (((String) -> Unit)) -> Unit,
    onSave: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var value by remember { mutableStateOf(initial) }
    val label = if (slot == "home") "Home" else "Work"

    androidx.compose.ui.window.Dialog(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(c.card)
                .padding(22.dp)
        ) {
            Text("Set $label address", color = c.ink, fontSize = 19.sp, fontWeight = FontWeight.SemiBold)
            Text(
                stringResource(R.string.nav_saved_place_hint),
                color = c.sub,
                fontSize = 12.sp,
                modifier = Modifier.padding(top = 6.dp)
            )

            Row(
                modifier = Modifier
                    .padding(top = 16.dp)
                    .fillMaxWidth()
                    .height(58.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(c.accent)
                    .clickable { onVoice { spoken -> value = spoken } },
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(Icons.Rounded.Mic, null, tint = c.card, modifier = Modifier.size(24.dp))
                Spacer(Modifier.width(10.dp))
                Text(stringResource(R.string.nav_speak_address), color = c.card, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }

            androidx.compose.material3.OutlinedTextField(
                value = value,
                onValueChange = { value = it },
                singleLine = true,
                placeholder = { Text(stringResource(R.string.nav_saved_place_hint), color = c.sub) },
                colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
                    focusedTextColor = c.ink,
                    unfocusedTextColor = c.ink,
                    focusedBorderColor = c.accent,
                    unfocusedBorderColor = c.line,
                    cursorColor = c.accent
                ),
                modifier = Modifier.fillMaxWidth().padding(top = 14.dp)
            )

            Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
                Text(
                    stringResource(R.string.nav_cancel),
                    color = c.sub,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .clip(CircleShape)
                        .clickable(onClick = onDismiss)
                        .padding(horizontal = 18.dp, vertical = 14.dp)
                )
                Text(
                    "SAVE",
                    color = c.accent,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .clip(CircleShape)
                        .clickable { if (value.isNotBlank()) onSave(value) }
                        .padding(horizontal = 18.dp, vertical = 14.dp)
                )
            }
        }
    }
}

private fun loadPlace(context: android.content.Context, slot: String): String? = try {
    context.getSharedPreferences(RECENTS_PREFS, android.content.Context.MODE_PRIVATE)
        .getString("place_$slot", null)
} catch (_: Throwable) {
    null
}

private fun savePlace(context: android.content.Context, slot: String, value: String) {
    try {
        context.getSharedPreferences(RECENTS_PREFS, android.content.Context.MODE_PRIVATE)
            .edit().putString("place_$slot", value).apply()
    } catch (_: Throwable) {
    }
}

private const val RECENTS_PREFS = "carlinkkit_nav"
private const val RECENTS_KEY = "recent_destinations"

private fun loadRecents(context: android.content.Context): List<String> = try {
    context.getSharedPreferences(RECENTS_PREFS, android.content.Context.MODE_PRIVATE)
        .getString(RECENTS_KEY, "")
        ?.split("|")
        ?.filter { it.isNotBlank() }
        ?: emptyList()
} catch (_: Throwable) {
    emptyList()
}

private fun saveRecent(context: android.content.Context, destination: String): List<String> = try {
    val updated = (listOf(destination) + loadRecents(context))
        .distinct()
        .take(8)
    context.getSharedPreferences(RECENTS_PREFS, android.content.Context.MODE_PRIVATE)
        .edit()
        .putString(RECENTS_KEY, updated.joinToString("|"))
        .apply()
    updated
} catch (_: Throwable) {
    loadRecents(context)
}

/**
 * Google Maps panel, used when a Maps SDK for Android key is configured.
 */
@Composable
private fun GoogleMapPanel(
    latLon: Pair<Double, Double>?,
    bearing: Float,
    isNight: Boolean,
    route: com.ziyad.carlinkit.Route?
) {
    val cameraPositionState = com.google.maps.android.compose.rememberCameraPositionState {
        position = com.google.android.gms.maps.model.CameraPosition.fromLatLngZoom(
            com.google.android.gms.maps.model.LatLng(
                latLon?.first ?: 24.7136,
                latLon?.second ?: 46.6753
            ),
            16f
        )
    }

    // Camera following.
    //
    // The GPS emits a fix roughly twice a second. Animating to each fix meant
    // every animation was cancelled mid-flight by the next one, which is what
    // produced the stutter. Instead we drive one continuous animation whose
    // target is updated as fixes arrive, and interpolate between them.
    var target by remember {
        mutableStateOf<com.google.android.gms.maps.model.LatLng?>(null)
    }
    var targetBearing by remember { mutableStateOf(0f) }

    LaunchedEffect(latLon, bearing) {
        val ll = latLon ?: return@LaunchedEffect
        target = com.google.android.gms.maps.model.LatLng(ll.first, ll.second)
        // Ignore bearing jitter when nearly stationary — it spins the map
        // wildly at a standstill.
        if (bearing != 0f) targetBearing = bearing
    }

    // Single long-lived loop: eases toward the latest target every frame
    // instead of restarting an animation per fix.
    LaunchedEffect(Unit) {
        var current: com.google.android.gms.maps.model.LatLng? = null
        var currentBearing = 0f
        while (true) {
            val t = target
            if (t != null) {
                val c = current
                if (c == null) {
                    current = t
                    currentBearing = targetBearing
                    cameraPositionState.position =
                        com.google.android.gms.maps.model.CameraPosition.Builder()
                            .target(t).zoom(17f).bearing(currentBearing).tilt(0f).build()
                } else {
                    // Exponential ease: fast when far, gentle when close.
                    val f = 0.12
                    val lat = c.latitude + (t.latitude - c.latitude) * f
                    val lng = c.longitude + (t.longitude - c.longitude) * f
                    // Shortest angular path, so 350° -> 10° does not spin backwards
                    var diff = targetBearing - currentBearing
                    while (diff > 180f) diff -= 360f
                    while (diff < -180f) diff += 360f
                    currentBearing += diff * 0.10f

                    current = com.google.android.gms.maps.model.LatLng(lat, lng)
                    cameraPositionState.position =
                        com.google.android.gms.maps.model.CameraPosition.Builder()
                            .target(current).zoom(17f).bearing(currentBearing).tilt(0f).build()
                }
            }
            kotlinx.coroutines.delay(16) // ~60fps
        }
    }

    com.google.maps.android.compose.GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraPositionState,
        properties = com.google.maps.android.compose.MapProperties(
            // Blue dot showing where the car actually is
            isMyLocationEnabled = true,
            isBuildingEnabled = false,
            isTrafficEnabled = false,
            isIndoorEnabled = false,
            mapStyleOptions = if (isNight) {
                com.google.android.gms.maps.model.MapStyleOptions(NIGHT_MAP_STYLE)
            } else null
        ),
        uiSettings = com.google.maps.android.compose.MapUiSettings(
            zoomControlsEnabled = false,
            mapToolbarEnabled = false,
            compassEnabled = false,
            myLocationButtonEnabled = false,
            tiltGesturesEnabled = false,
            rotationGesturesEnabled = false
        )
    ) {
        route?.let { r ->
            // Casing beneath the route so it stays legible over any map colour
            com.google.maps.android.compose.Polyline(
                points = r.points,
                color = androidx.compose.ui.graphics.Color(0xFF2B3446),
                width = 26f,
                jointType = com.google.android.gms.maps.model.JointType.ROUND,
                startCap = com.google.android.gms.maps.model.RoundCap(),
                endCap = com.google.android.gms.maps.model.RoundCap()
            )
            com.google.maps.android.compose.Polyline(
                points = r.points,
                color = androidx.compose.ui.graphics.Color(0xFF7C9AD4),
                width = 16f,
                jointType = com.google.android.gms.maps.model.JointType.ROUND,
                startCap = com.google.android.gms.maps.model.RoundCap(),
                endCap = com.google.android.gms.maps.model.RoundCap()
            )
            com.google.maps.android.compose.Marker(
                state = com.google.maps.android.compose.MarkerState(position = r.destination),
                title = r.destinationName
            )
        }
    }
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

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun DestChip(
    label: String,
    icon: ImageVector,
    c: MeridianColors,
    onClick: () -> Unit,
    onLongClick: () -> Unit = onClick
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(13.dp))
            .background(c.card)
            .border(1.dp, c.line, RoundedCornerShape(13.dp))
            .combinedClickable(onClick = onClick, onLongClick = onLongClick)
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

/**
 * Maps a Directions manoeuvre string to a glyph. Google returns a small fixed
 * vocabulary; anything unrecognised falls back to the straight-ahead arrow
 * rather than showing a wrong turn.
 */
private fun maneuverIcon(maneuver: String): ImageVector = when {
    maneuver.contains("left", ignoreCase = true) &&
        maneuver.contains("slight", ignoreCase = true) -> Icons.Rounded.TurnSlightLeft
    maneuver.contains("right", ignoreCase = true) &&
        maneuver.contains("slight", ignoreCase = true) -> Icons.Rounded.TurnSlightRight
    maneuver.contains("uturn", ignoreCase = true) -> Icons.Rounded.UTurnLeft
    maneuver.contains("left", ignoreCase = true) -> Icons.Rounded.TurnLeft
    maneuver.contains("right", ignoreCase = true) -> Icons.Rounded.TurnRight
    maneuver.contains("roundabout", ignoreCase = true) -> Icons.Rounded.RoundaboutLeft
    maneuver.contains("merge", ignoreCase = true) -> Icons.Rounded.MergeType
    maneuver.contains("ramp", ignoreCase = true) -> Icons.Rounded.ForkRight
    else -> Icons.Rounded.Straight
}
