package com.ziyad.carlinkit.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ziyad.carlinkit.SystemBridge
import com.ziyad.carlinkit.ui.theme.*
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*
import android.annotation.SuppressLint

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(bridge: SystemBridge) {
    val speed by bridge.currentSpeedKmh.collectAsState()
    val gpsStatus by bridge.gpsStatus.collectAsState()
    val currentTrack by bridge.currentTrack.collectAsState()
    val isPlaying by bridge.isPlaying.collectAsState()
    
    var currentTime by remember { mutableStateOf("") }
    var currentDate by remember { mutableStateOf("") }
    var navDestinationQuery by remember { mutableStateOf("") }

    // Tick the clock smoothly
    LaunchedEffect(Unit) {
        val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
        val dateFormat = SimpleDateFormat("EEEE, d MMMM yyyy", Locale.getDefault())
        while (true) {
            val now = Calendar.getInstance().time
            currentTime = timeFormat.format(now)
            currentDate = dateFormat.format(now)
            delay(1000L)
        }
    }

    Row(
        modifier = Modifier
            .fillMaxSize()
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        
        // COLUMN 1: Dynamic Telemetry & Clock (Left Side - occupies 45% of width)
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .weight(0.45f),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Clock & Date Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(0.4f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(CardDarkBlue)
                    .border(1.dp, BorderSlate, RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = currentTime,
                        color = Color.White,
                        fontSize = 42.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-1).sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = currentDate,
                        color = TextMuted,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Speedometer HUD Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(0.6f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(CardDarkBlue, Color(0xFF070B14))
                        )
                    )
                    .border(1.dp, BorderSlate, RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxSize(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "SPEED",
                            color = TextMuted,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 2.sp
                        )
                        Row(
                            verticalAlignment = Alignment.Bottom
                        ) {
                            Text(
                                text = String.format("%03d", speed),
                                color = if (speed > 120) CrimsonRed else ElectricBlue,
                                fontSize = 54.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = (-2).sp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "km/h",
                                color = TextMuted,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(bottom = 10.dp)
                            )
                        }
                    }

                    // Circle Gauge Track Representation
                    Box(
                        modifier = Modifier
                            .size(70.dp)
                            .border(6.dp, BorderSlate, RoundedCornerShape(100))
                            .padding(6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.DirectionsCar,
                                contentDescription = "Camry Speed status",
                                tint = if (speed > 0) BlueGlow else TextDark,
                                modifier = Modifier.size(24.dp)
                            )
                            Text(
                                text = "Camry 23",
                                fontSize = 8.sp,
                                color = TextMuted,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            }

            // Cockpit Now Playing Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(CardDarkBlue)
                    .border(1.dp, BorderSlate, RoundedCornerShape(16.dp))
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(ElectricBlue.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.MusicNote,
                                contentDescription = "Music",
                                tint = BlueGlow,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = currentTrack?.title ?: "CarLink Player",
                                color = TextWhite,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1
                            )
                            Text(
                                text = currentTrack?.artist ?: "Local DSP Active",
                                color = TextMuted,
                                fontSize = 10.sp,
                                maxLines = 1
                            )
                        }
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = { bridge.localPlayerManager.previousTrack() }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.SkipPrevious, contentDescription = "Prev", tint = TextWhite, modifier = Modifier.size(18.dp))
                        }
                        IconButton(onClick = { bridge.localPlayerManager.togglePlay() }, modifier = Modifier.size(32.dp)) {
                            Icon(
                                imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                contentDescription = "Play/Pause",
                                tint = BlueGlow,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                        IconButton(onClick = { bridge.localPlayerManager.nextTrack() }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.SkipNext, contentDescription = "Next", tint = TextWhite, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }

        // COLUMN 2: Navigation & Quick Launch Dock (Right Side - occupies 55% of width)
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .weight(0.55f),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            
            // Search / Google Navigation Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(CardDarkBlue)
                    .border(1.dp, BorderSlate, RoundedCornerShape(12.dp))
                    .padding(horizontal = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Navigation,
                    contentDescription = "Nav Icon",
                    tint = ElectricBlue,
                    modifier = Modifier.size(20.dp)
                )
                
                Spacer(modifier = Modifier.width(10.dp))
                
                TextField(
                    value = navDestinationQuery,
                    onValueChange = { navDestinationQuery = it },
                    placeholder = { 
                        Text("Search destination query...", color = TextMuted, fontSize = 12.sp) 
                    },
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent, unfocusedContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        focusedTextColor = Color.White, unfocusedTextColor = Color.White
                    ),
                    modifier = Modifier.weight(1f)
                )

                IconButton(
                    onClick = { 
                        if (navDestinationQuery.isNotBlank()) {
                            bridge.navigate(navDestinationQuery)
                        }
                    }
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = "Search",
                        tint = BlueGlow
                    )
                }
            }

            // Quick Driving Destination Targets
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                QuickDestinationButton(
                    label = "Home",
                    icon = Icons.Default.Home,
                    modifier = Modifier.weight(1f),
                    onClick = { bridge.navigate("Home") }
                )
                QuickDestinationButton(
                    label = "Office",
                    icon = Icons.Default.Work,
                    modifier = Modifier.weight(1f),
                    onClick = { bridge.navigate("Work") }
                )
                QuickDestinationButton(
                    label = "Gas Station",
                    icon = Icons.Default.LocalGasStation,
                    modifier = Modifier.weight(1f),
                    onClick = { bridge.navigate("Gas Station") }
                )
            }

            // System Diagnostics Quick Info HUD
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(CardDarkBlue)
                    .border(1.dp, BorderSlate, RoundedCornerShape(16.dp))
                    .padding(14.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "CAR SYSTEM STATUS",
                        color = TextMuted,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            InfoRow(
                                label = "WLAN SSID", 
                                value = bridge.wifiSsid(), 
                                icon = Icons.Default.Wifi,
                                iconColor = BlueGlow
                            )
                            InfoRow(
                                label = "DEVICE", 
                                value = bridge.deviceModel(), 
                                icon = Icons.Default.DeveloperMode,
                                iconColor = EmeraldGreen
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            InfoRow(
                                label = "GPS SENSOR", 
                                value = gpsStatus, 
                                icon = Icons.Default.GpsFixed,
                                iconColor = if (gpsStatus == "ACTIVE") EmeraldGreen else SafetyAmber
                            )
                            InfoRow(
                                label = "BATTERY", 
                                value = "${bridge.batteryPercentage()}%", 
                                icon = Icons.Default.BatteryChargingFull,
                                iconColor = SafetyAmber
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun QuickDestinationButton(
    label: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .height(52.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(CardDarkBlue)
            .border(1.dp, BorderSlate, RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = BlueGlow,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = label,
                color = TextWhite,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun InfoRow(
    label: String,
    value: String,
    icon: ImageVector,
    iconColor: Color
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.width(170.dp)
    ) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(BorderSlate.copy(alpha = 0.4f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(14.dp)
            )
        }
        Spacer(modifier = Modifier.width(8.dp))
        Column {
            Text(
                text = label,
                color = TextMuted,
                fontSize = 8.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = value,
                color = TextWhite,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1
            )
        }
    }
}
