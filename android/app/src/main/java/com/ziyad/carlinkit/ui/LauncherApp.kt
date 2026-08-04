package com.ziyad.carlinkit.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Equalizer
import androidx.compose.material.icons.filled.LibraryMusic
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.BrightnessAuto
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ziyad.carlinkit.SystemBridge
import com.ziyad.carlinkit.ui.screens.AppsScreen
import com.ziyad.carlinkit.ui.screens.AudioScreen
import com.ziyad.carlinkit.ui.screens.BootScreen
import com.ziyad.carlinkit.ui.screens.MeridianScreen
import com.ziyad.carlinkit.ui.theme.MeridianDay
import com.ziyad.carlinkit.ui.theme.MeridianNight
import com.ziyad.carlinkit.ui.screens.MediaScreen
import com.ziyad.carlinkit.ui.theme.*

enum class Tab {
    DASHBOARD, APPS
}

@Composable
fun LauncherApp(bridge: SystemBridge) {
    var isBooting by remember { mutableStateOf(true) }
    var activeTab by remember { mutableStateOf(Tab.DASHBOARD) }
    var fullscreenMap by remember { mutableStateOf(false) }
    val ctx = androidx.compose.ui.platform.LocalContext.current
    androidx.compose.runtime.LaunchedEffect(Unit) {
        com.ziyad.carlinkit.ui.theme.M.load(ctx)
        // Re-evaluate AUTO mode every minute without needing a restart
        while (true) {
            kotlinx.coroutines.delay(60_000)
            com.ziyad.carlinkit.ui.theme.M.clockTick++
        }
    }
    val isNightMode = com.ziyad.carlinkit.ui.theme.M.isNight
    val m = if (isNightMode) MeridianNight else MeridianDay

    CarLinkKitTheme {
        Box(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .background(m.bg)
            ) {
                // MAIN INTERFACE FRAME — map runs edge to edge beneath the rail
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f)
                        .background(m.bg)
                ) {
                    when (activeTab) {
                        Tab.DASHBOARD -> MeridianScreen(
                            bridge = bridge,
                            isNight = isNightMode,
                            onOpenApps = { activeTab = Tab.APPS },
                            onOpenMedia = { activeTab = Tab.APPS },
                            fullscreenMap = fullscreenMap,
                            onToggleFullscreen = { fullscreenMap = !fullscreenMap }
                        )
                        // Parked-only hub: apps, media library, DSP, settings
                        Tab.APPS -> AppsHub(
                            bridge = bridge,
                            m = m,
                            onBack = { activeTab = Tab.DASHBOARD }
                        )
                    }
                }
            }

            AnimatedVisibility(
                visible = isBooting,
                enter = fadeIn(animationSpec = tween(400)),
                exit = fadeOut(animationSpec = tween(600))
            ) {
                BootScreen(onBootComplete = { isBooting = false })
            }

            // FLOATING GLASS RAIL — above the map, but never over the boot screen
            if (!fullscreenMap && !isBooting && activeTab == Tab.DASHBOARD) {
                Box(modifier = Modifier.fillMaxSize()) {
                    ControlRail(
                        bridge = bridge,
                        m = m,
                        onHome = { activeTab = Tab.DASHBOARD },
                        onApps = { activeTab = Tab.APPS },
                        appsSelected = activeTab == Tab.APPS,
                        modifier = Modifier.align(Alignment.CenterStart)
                    )
                }
            }
        }
    }
}

@Composable
fun SidebarButton(
    icon: ImageVector,
    label: String,
    isSelected: Boolean,
    m: com.ziyad.carlinkit.ui.theme.MeridianColors,
    onClick: () -> Unit
) {
    val bgModifier = if (isSelected) {
        Modifier
            .size(52.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(m.accent.copy(alpha = 0.12f))
            .border(1.2.dp, m.accent, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
    } else {
        Modifier
            .size(52.dp)
            .clip(RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
    }

    Box(
        modifier = bgModifier,
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = if (isSelected) m.accent else m.sub,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = label,
                color = if (isSelected) m.accent else m.sub,
                fontSize = 8.sp,
                fontWeight = androidx.compose.ui.text.font.FontWeight.Medium
            )
        }
    }
}

@Composable
fun SidebarUtilityButton(
    icon: ImageVector,
    m: com.ziyad.carlinkit.ui.theme.MeridianColors,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(40.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(m.line.copy(alpha = 0.35f))
            .border(1.dp, m.line, RoundedCornerShape(10.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = "Utility Link",
            tint = m.sub,
            modifier = Modifier.size(16.dp)
        )
    }
}
