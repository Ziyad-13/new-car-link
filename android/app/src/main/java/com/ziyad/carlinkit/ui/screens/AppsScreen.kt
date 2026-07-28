package com.ziyad.carlinkit.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ziyad.carlinkit.SystemBridge
import com.ziyad.carlinkit.ui.theme.M
import com.ziyad.carlinkit.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppsScreen(bridge: SystemBridge) {
    var searchQuery by remember { mutableStateOf("") }
    
    // Fallback predefined apps to display if the android device has no launchers installed,
    // or to populate a premium automotive experience right away.
    val defaultApps = listOf(
        Pair("Google Maps", "com.google.android.apps.maps"),
        Pair("Spotify", "com.spotify.music"),
        Pair("Waze", "com.waze"),
        Pair("YouTube", "com.google.android.youtube"),
        Pair("YouTube Music", "com.google.android.apps.youtube.music"),
        Pair("Google Chrome", "com.android.chrome"),
        Pair("Netflix", "com.netflix.mediaclient"),
        Pair("WhatsApp", "com.whatsapp"),
        Pair("Settings", "com.android.settings")
    )

    // Dynamically query installed user apps or fall back to defaults
    val installedAppsList = remember {
        val apps = bridge.installedApps()
        if (apps.isEmpty()) defaultApps else apps
    }

    // Filter apps based on search query
    val filteredApps = installedAppsList.filter {
        it.first.contains(searchQuery, ignoreCase = true)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        
        // SEARCH & HEADER PANEL
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "APPLICATIONS",
                color = M.ink,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.5.sp
            )

            // Minimalist Search Bar
            Row(
                modifier = Modifier
                    .width(260.dp)
                    .height(38.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(M.card)
                    .border(1.dp, M.line, RoundedCornerShape(8.dp))
                    .padding(horizontal = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "Search icon",
                    tint = M.sub,
                    modifier = Modifier.size(16.dp)
                )
                
                Spacer(modifier = Modifier.width(6.dp))

                TextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { 
                        Text("Search installed...", color = M.sub, fontSize = 10.sp) 
                    },
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent, unfocusedContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        focusedTextColor = M.ink, unfocusedTextColor = M.ink
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // APPS GRID LAYOUT (Highly optimized for quick touch actions, avoiding tiny targets)
        LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 100.dp),
            modifier = Modifier
                .fillMaxSize()
                .weight(1f),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(filteredApps) { app ->
                AppGridCard(
                    appName = app.first,
                    packageName = app.second,
                    onLaunch = { bridge.launch(app.second) }
                )
            }
        }
    }
}

@Composable
fun AppGridCard(
    appName: String,
    packageName: String,
    onLaunch: () -> Unit
) {
    // Generate a beautiful, unique gradient background from package seed
    val hashCode = packageName.hashCode().coerceAtLeast(0)
    val startColor = when (hashCode % 5) {
        0 -> Color(0xFF1E3A8A) // Dark Blue
        1 -> Color(0xFF065F46) // Emerald Green
        2 -> Color(0xFF78350F) // Warm Amber
        3 -> Color(0xFF581C87) // Purple
        else -> Color(0xFF881337) // Crimson
    }

    Box(
        modifier = Modifier
            .height(78.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(M.card)
            .border(1.dp, M.line, RoundedCornerShape(12.dp))
            .clickable(onClick = onLaunch)
            .padding(8.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Icon Placeholder using letters with a stylish procedural background
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(startColor, startColor.copy(alpha = 0.5f))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = appName.take(2).uppercase(),
                    color = M.ink,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black
                )
            }

            // App Label with Driving Safety Legibility
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = appName,
                    color = M.ink,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = packageName.substringAfterLast("."),
                    color = M.sub,
                    fontSize = 8.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}
