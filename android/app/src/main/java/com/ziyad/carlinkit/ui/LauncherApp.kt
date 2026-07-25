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
import com.ziyad.carlinkit.ui.screens.HomeScreen
import com.ziyad.carlinkit.ui.screens.MediaScreen
import com.ziyad.carlinkit.ui.theme.*

enum class Tab {
    DASHBOARD, MEDIA, AUDIO, APPS
}

@Composable
fun LauncherApp(bridge: SystemBridge) {
    var isBooting by remember { mutableStateOf(true) }
    var activeTab by remember { mutableStateOf(Tab.DASHBOARD) }

    CarLinkKitTheme {
        Box(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .background(SpaceBlack)
            ) {
                // LEFT SIDEBAR: Ergonomic Dock (always present)
                Column(
                    modifier = Modifier
                        .width(72.dp)
                        .fillMaxHeight()
                        .background(CardDarkBlue)
                        .border(1.dp, BorderSlate)
                        .padding(vertical = 12.dp, horizontal = 4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Top Brand Mark
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                Brush.linearGradient(
                                    colors = listOf(ElectricBlue, Color(0xFF1E3A8A))
                                )
                            )
                            .clickable { activeTab = Tab.DASHBOARD },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "K",
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = androidx.compose.ui.text.font.FontWeight.Black
                        )
                    }

                    // Middle Navigation Actions
                    Column(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        SidebarButton(
                            icon = Icons.Default.Dashboard,
                            label = "Cockpit",
                            isSelected = activeTab == Tab.DASHBOARD,
                            onClick = { activeTab = Tab.DASHBOARD }
                        )
                        SidebarButton(
                            icon = Icons.Default.LibraryMusic,
                            label = "Media",
                            isSelected = activeTab == Tab.MEDIA,
                            onClick = { activeTab = Tab.MEDIA }
                        )
                        SidebarButton(
                            icon = Icons.Default.Equalizer,
                            label = "Audio DSP",
                            isSelected = activeTab == Tab.AUDIO,
                            onClick = { activeTab = Tab.AUDIO }
                        )
                        SidebarButton(
                            icon = Icons.Default.Apps,
                            label = "Apps",
                            isSelected = activeTab == Tab.APPS,
                            onClick = { activeTab = Tab.APPS }
                        )
                    }

                    // Bottom Utilities Shortcuts (System Actions)
                    Column(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // System Settings trigger
                        SidebarUtilityButton(
                            icon = Icons.Default.Settings,
                            onClick = { bridge.openSettings() }
                        )
                        // Wi-Fi system Settings trigger
                        SidebarUtilityButton(
                            icon = Icons.Default.Wifi,
                            onClick = { bridge.openWifi() }
                        )
                    }
                }

                // MAIN INTERFACE FRAME (800x480 optimization)
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f)
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(SpaceBlack, Color(0xFF030509))
                            )
                        )
                ) {
                    when (activeTab) {
                        Tab.DASHBOARD -> HomeScreen(bridge = bridge)
                        Tab.MEDIA -> MediaScreen(bridge = bridge)
                        Tab.AUDIO -> AudioScreen(bridge = bridge)
                        Tab.APPS -> AppsScreen(bridge = bridge)
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
        }
    }
}

@Composable
fun SidebarButton(
    icon: ImageVector,
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val bgModifier = if (isSelected) {
        Modifier
            .size(52.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(ElectricBlue.copy(alpha = 0.15f))
            .border(1.2.dp, ElectricBlue, RoundedCornerShape(14.dp))
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
                tint = if (isSelected) BlueGlow else TextMuted,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = label,
                color = if (isSelected) BlueGlow else TextMuted,
                fontSize = 8.sp,
                fontWeight = androidx.compose.ui.text.font.FontWeight.Medium
            )
        }
    }
}

@Composable
fun SidebarUtilityButton(
    icon: ImageVector,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(40.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(BorderSlate.copy(alpha = 0.3f))
            .border(1.dp, BorderSlate.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = "Utility Link",
            tint = TextMuted,
            modifier = Modifier.size(16.dp)
        )
    }
}
