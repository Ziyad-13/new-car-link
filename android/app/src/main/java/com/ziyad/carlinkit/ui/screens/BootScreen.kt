package com.ziyad.carlinkit.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ElectricBolt
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
import com.ziyad.carlinkit.R
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ziyad.carlinkit.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import android.webkit.WebView
import android.webkit.WebViewClient
import android.annotation.SuppressLint
import androidx.compose.ui.viewinterop.AndroidView

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
        stringResource(R.string.boot_status_system),
        stringResource(R.string.boot_status_display),
        stringResource(R.string.boot_status_location),
        stringResource(R.string.boot_status_media),
        stringResource(R.string.boot_status_launcher),
        stringResource(R.string.boot_status_ready)
    )

    LaunchedEffect(Unit) {
        launch {
            progressAnim.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 4200, easing = FastOutSlowInEasing)
            )
            delay(400)
            onBootComplete()
        }

        launch {
            val stepTime = 4200L / statuses.size
            for (i in statuses.indices) {
                statusIndex = i
                delay(stepTime)
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
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
                text = stringResource(R.string.boot_skip),
                color = TextMuted,
                fontSize = 10.sp,
                letterSpacing = 1.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.width(420.dp)
        ) {
            
            // Toyota emblem + CAMRY wordmark
            CamryMark(
                modifier = Modifier
                    .alpha(logoAlpha)
                    .scale(logoScale),
                color = Color.White,
                emblemSize = 74.dp
            )

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
            Text(stringResource(R.string.boot_status_ready), color = TextMuted, fontSize = 9.sp, letterSpacing = 1.sp)
        }
    }
}

