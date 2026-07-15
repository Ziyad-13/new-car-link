package com.ziyad.carlinkit.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ziyad.carlinkit.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun BootScreen(onBootComplete: () -> Unit) {
    val progressAnim = remember { Animatable(0f) }
    var statusIndex by remember { mutableIntStateOf(0) }
    
    // Scale animation for the logo
    val logoScale by animateFloatAsState(
        targetValue = if (progressAnim.value > 0.1f) 1f else 0.8f,
        animationSpec = tween(800, easing = FastOutSlowInEasing),
        label = "logoScale"
    )

    val logoAlpha by animateFloatAsState(
        targetValue = if (progressAnim.value > 0.05f) 1f else 0f,
        animationSpec = tween(800),
        label = "logoAlpha"
    )

    val statuses = listOf(
        "Initializing Toyota Entune & TSS...",
        "Connecting to Camry CAN-BUS...",
        "Configuring wireless link channels...",
        "Validating safe driving handshake...",
        "CarPlay link established."
    )

    LaunchedEffect(Unit) {
        launch {
            progressAnim.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 2600, easing = FastOutSlowInEasing)
            )
            delay(400)
            onBootComplete()
        }

        launch {
            val stepTime = 2600L / statuses.size
            for (i in statuses.indices) {
                statusIndex = i
                delay(stepTime)
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF090D16)),
        contentAlignment = Alignment.Center
    ) {
        // Skip Button
        TextButton(
            onClick = onBootComplete,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
        ) {
            Text(
                text = "SKIP INTRO",
                color = TextMuted,
                fontSize = 10.sp,
                letterSpacing = 1.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.width(340.dp)
        ) {
            // Logo
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .scale(logoScale)
                    .alpha(logoAlpha)
                    .clip(RoundedCornerShape(18.dp))
                    .background(CardDarkBlue)
                    .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(18.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.ElectricBolt,
                    contentDescription = null,
                    tint = BlueGlow,
                    modifier = Modifier.size(28.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Title
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.alpha(logoAlpha)
            ) {
                Text(
                    text = "CARLINKKIT",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 4.sp
                )
                Spacer(modifier = Modifier.width(8.dp))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(100))
                        .background(ElectricBlue.copy(alpha = 0.15f))
                        .border(1.dp, ElectricBlue.copy(alpha = 0.3f), RoundedCornerShape(100))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "CAMRY_2023",
                        color = BlueGlow,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Progress Bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp)
                    .clip(RoundedCornerShape(100))
                    .background(Color.White.copy(alpha = 0.05f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(progressAnim.value)
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(ElectricBlue, BlueGlow)
                            )
                        )
                        .clip(RoundedCornerShape(100))
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Status Text
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = statuses[statusIndex],
                    color = TextMuted,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "${(progressAnim.value * 100).toInt()}%",
                    color = BlueGlow,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Footer
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 24.dp)
                .alpha(0.6f),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("TOYOTA OBD BRIDGE", color = TextMuted, fontSize = 9.sp, letterSpacing = 1.sp)
            Text("•", color = BorderSlate, fontSize = 9.sp)
            Text("TSS 2.5 ACTIVE", color = TextMuted, fontSize = 9.sp, letterSpacing = 1.sp)
        }
    }
}
