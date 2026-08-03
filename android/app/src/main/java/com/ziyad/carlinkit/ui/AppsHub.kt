package com.ziyad.carlinkit.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.BrightnessAuto
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Equalizer
import androidx.compose.material.icons.filled.LibraryMusic
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.runtime.collectAsState
import com.ziyad.carlinkit.SystemBridge
import com.ziyad.carlinkit.ui.screens.AppsScreen
import com.ziyad.carlinkit.ui.screens.AudioScreen
import com.ziyad.carlinkit.ui.screens.MediaScreen
import com.ziyad.carlinkit.ui.theme.M
import com.ziyad.carlinkit.ui.theme.MeridianColors
import com.ziyad.carlinkit.ui.theme.ThemeMode

private enum class HubPage { APPS, LIBRARY, DSP }

/**
 * Everything that is not a driving task lives behind this single door:
 * app launcher, media library, DSP and system settings.
 *
 * Deliberately one level removed from the map — these are parked tasks,
 * and they should not compete for attention while moving.
 */
@Composable
fun AppsHub(
    bridge: SystemBridge,
    m: MeridianColors,
    onBack: () -> Unit
) {
    var page by remember { mutableStateOf(HubPage.APPS) }
    val ctx = LocalContext.current

    Column(modifier = Modifier.fillMaxSize().background(m.bg)) {

        // Page switcher + system shortcuts
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(CircleShape)
                        .background(m.accent)
                        .clickable(onClick = onBack),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Filled.Map,
                        contentDescription = "Back to map",
                        tint = m.card,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Spacer(Modifier.width(4.dp))
                HubTab("Apps", Icons.Filled.Apps, page == HubPage.APPS, m) { page = HubPage.APPS }
                HubTab("Library", Icons.Filled.LibraryMusic, page == HubPage.LIBRARY, m) {
                    page = HubPage.LIBRARY
                }
                HubTab("Audio", Icons.Filled.Equalizer, page == HubPage.DSP, m) {
                    page = HubPage.DSP
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                HubIcon(
                    when (M.mode) {
                        ThemeMode.DAY -> Icons.Filled.LightMode
                        ThemeMode.NIGHT -> Icons.Filled.DarkMode
                        ThemeMode.AUTO -> Icons.Filled.BrightnessAuto
                    },
                    m
                ) { M.cycle(ctx) }
                HubIcon(Icons.Filled.Wifi, m) { bridge.openWifi() }
                HubIcon(Icons.Filled.Settings, m) { bridge.openSettings() }
            }
        }

        // Phone pairing details — parked task, so it lives here
        val serverAddress by bridge.destinationServer.address.collectAsState()
        val serverPin by bridge.destinationServer.pin.collectAsState()
        if (serverAddress != null) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(m.card)
                    .border(1.dp, m.line, RoundedCornerShape(10.dp))
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Filled.PhoneAndroid,
                    null,
                    tint = m.sub,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(Modifier.width(10.dp))
                Text(
                    "Send a destination from your phone: $serverAddress",
                    color = m.ink,
                    fontSize = 11.sp
                )
                Spacer(Modifier.width(10.dp))
                Text(
                    "PIN $serverPin",
                    color = m.accent,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Box(modifier = Modifier.fillMaxSize()) {
            when (page) {
                HubPage.APPS -> AppsScreen(bridge = bridge)
                HubPage.LIBRARY -> MediaScreen(bridge = bridge)
                HubPage.DSP -> AudioScreen(bridge = bridge)
            }
        }
    }
}

@Composable
private fun HubTab(
    label: String,
    icon: ImageVector,
    selected: Boolean,
    m: MeridianColors,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .then(
                if (selected) Modifier.background(m.accent)
                else Modifier.border(1.dp, m.line, RoundedCornerShape(999.dp))
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            icon,
            null,
            tint = if (selected) m.card else m.sub,
            modifier = Modifier.size(16.dp)
        )
        Spacer(Modifier.width(6.dp))
        Text(
            label,
            color = if (selected) m.card else m.sub,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun HubIcon(icon: ImageVector, m: MeridianColors, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(44.dp)
            .clip(CircleShape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, null, tint = m.sub, modifier = Modifier.size(20.dp))
    }
}
