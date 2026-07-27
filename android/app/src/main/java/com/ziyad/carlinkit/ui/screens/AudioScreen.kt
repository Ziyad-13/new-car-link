package com.ziyad.carlinkit.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Equalizer
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ziyad.carlinkit.SystemBridge
import com.ziyad.carlinkit.ui.theme.M
import com.ziyad.carlinkit.ui.theme.*

@Composable
fun AudioScreen(bridge: SystemBridge) {
    val globalAvailable by bridge.globalDspAvailable.collectAsState()
    val bands by bridge.audioEngine.bands.collectAsState()
    val presets by bridge.audioEngine.presets.collectAsState()
    val selectedPresetIndex by bridge.audioEngine.selectedPresetIndex.collectAsState()
    val bassBoost by bridge.audioEngine.bassBoostStrength.collectAsState()
    val loudnessGain by bridge.audioEngine.loudnessGain.collectAsState()
    val limiterEnabled by bridge.audioEngine.limiterEnabled.collectAsState()

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Equalizer,
                    contentDescription = "Audio Equalizer",
                    tint = M.accent,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "معالج الصوت DSP (AUDIO DSP ENGINE)",
                    color = TextWhite,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }

            // Engine Active Status Badge
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (globalAvailable) EmeraldGreen.copy(alpha = 0.15f) else SafetyAmber.copy(alpha = 0.15f))
                    .border(1.dp, if (globalAvailable) EmeraldGreen else SafetyAmber, RoundedCornerShape(12.dp))
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(if (globalAvailable) EmeraldGreen else SafetyAmber)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (globalAvailable) "Engine: Global (all apps)" else "Engine: Built-in player only",
                        color = if (globalAvailable) EmeraldGreen else SafetyAmber,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Global DSP unavailable message if blocked
        if (!globalAvailable) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(M.card)
                    .border(1.dp, M.line, RoundedCornerShape(12.dp))
                    .padding(14.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = "DSP Info",
                        tint = SafetyAmber,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "System-wide effects are blocked on this device. Use the built-in player for full audio processing.",
                        color = TextWhite,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // Equalizer Section
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(M.card)
                .border(1.dp, M.line, RoundedCornerShape(20.dp))
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "GRAPHIC EQUALIZER (${bands.size}-BANDS)",
                    color = M.accent,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )

                // Presets row
                if (presets.isNotEmpty()) {
                    Text(
                        text = "PRESETS",
                        color = M.sub,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        itemsIndexed(presets) { index, name ->
                            val isSelected = selectedPresetIndex == index
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isSelected) M.accent else M.line.copy(alpha = 0.3f))
                                    .border(1.dp, if (isSelected) M.accent else M.line, RoundedCornerShape(8.dp))
                                    .clickable { bridge.audioEngine.applyPreset(index.toShort()) }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = name,
                                    color = if (isSelected) M.ink else TextWhite,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Dynamic Graphic EQ Sliders (from Equalizer.getNumberOfBands())
                if (bands.isEmpty()) {
                    Text(
                        text = "Initializing Equalizer hardware...",
                        color = M.sub,
                        fontSize = 12.sp
                    )
                } else {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        bands.forEach { band ->
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                            ) {
                                // dB Value
                                val dbVal = band.currentLevelMb / 100f
                                Text(
                                    text = String.format("%+.1f", dbVal),
                                    color = if (dbVal > 0) M.accent else M.sub,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )

                                // Vertical Slider representation
                                Slider(
                                    value = band.currentLevelMb.toFloat(),
                                    onValueChange = { newLevel ->
                                        bridge.audioEngine.setBandLevel(band.index, newLevel.toInt().toShort())
                                    },
                                    valueRange = band.minLevelMb.toFloat()..band.maxLevelMb.toFloat(),
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(vertical = 4.dp),
                                    colors = SliderDefaults.colors(
                                        thumbColor = M.accent,
                                        activeTrackColor = M.accent,
                                        inactiveTrackColor = M.line
                                    )
                                )

                                // Frequency Label
                                Text(
                                    text = band.formattedFreq,
                                    color = TextWhite,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                    lineHeight = 12.sp
                                )
                            }
                        }
                    }
                }
            }
        }

        // Bass Boost & Gain / Headroom Section
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Bass Boost Card
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(20.dp))
                    .background(M.card)
                    .border(1.dp, M.line, RoundedCornerShape(20.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.GraphicEq,
                                contentDescription = "Bass Boost",
                                tint = M.accent,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "BASS BOOST",
                                color = TextWhite,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Text(
                            text = "${bassBoost / 10}%",
                            color = M.accent,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Slider(
                        value = bassBoost.toFloat(),
                        onValueChange = { bridge.audioEngine.setBassBoost(it.toInt()) },
                        valueRange = 0f..1000f,
                        colors = SliderDefaults.colors(
                            thumbColor = M.accent,
                            activeTrackColor = M.accent,
                            inactiveTrackColor = M.line
                        )
                    )
                }
            }

            // Loudness Enhancer Card
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(20.dp))
                    .background(M.card)
                    .border(1.dp, M.line, RoundedCornerShape(20.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.VolumeUp,
                                contentDescription = "Loudness",
                                tint = SafetyAmber,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "LOUDNESS GAIN",
                                color = TextWhite,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Text(
                            text = "+${loudnessGain / 100f} dB",
                            color = SafetyAmber,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Slider(
                        value = loudnessGain.toFloat(),
                        onValueChange = { bridge.audioEngine.setLoudnessGain(it.toInt()) },
                        valueRange = 0f..1000f,
                        colors = SliderDefaults.colors(
                            thumbColor = SafetyAmber,
                            activeTrackColor = SafetyAmber,
                            inactiveTrackColor = M.line
                        )
                    )
                }
            }
        }

        // Warning banner above 500 mB gain
        if (loudnessGain > 500) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(SafetyAmber.copy(alpha = 0.15f))
                    .border(1.dp, SafetyAmber, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = "Clipping Warning",
                        tint = SafetyAmber,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Warning: Raising gain above +5.0 dB reduces headroom and can cause digital clipping/distortion. Enable Limiter below to prevent overload.",
                        color = TextWhite,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // Limiter / DynamicsProcessing Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(M.card)
                .border(1.dp, M.line, RoundedCornerShape(20.dp))
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(EmeraldGreen.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Security,
                            contentDescription = "Peak Limiter",
                            tint = EmeraldGreen,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "DYNAMICS LIMITER",
                            color = TextWhite,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Automatic peak protection via DynamicsProcessing",
                            color = M.sub,
                            fontSize = 11.sp
                        )
                    }
                }

                Switch(
                    checked = limiterEnabled,
                    onCheckedChange = { bridge.audioEngine.setLimiterEnabled(it) },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = EmeraldGreen,
                        checkedTrackColor = EmeraldGreen.copy(alpha = 0.3f),
                        uncheckedThumbColor = M.sub,
                        uncheckedTrackColor = M.line
                    )
                )
            }
        }
    }
}
