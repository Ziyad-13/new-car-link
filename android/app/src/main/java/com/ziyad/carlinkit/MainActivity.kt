package com.ziyad.carlinkit

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ziyad.carlinkit.ui.LauncherApp

class MainActivity : ComponentActivity() {
    private val systemBridge: SystemBridge by viewModels()
    
    private val locationPermissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            systemBridge.startLocationUpdates()
        }
    }

    private val audioPermissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { _ ->
        systemBridge.localPlayerManager.scanLocalAudio()
    }

    private fun ensureLocationPermission() {
        locationPermissionRequest.launch(android.Manifest.permission.ACCESS_FINE_LOCATION)
    }

    private fun ensureAudioPermission() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            audioPermissionRequest.launch(arrayOf(android.Manifest.permission.READ_MEDIA_AUDIO))
        } else {
            audioPermissionRequest.launch(arrayOf(android.Manifest.permission.READ_EXTERNAL_STORAGE))
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Capture any uncaught exception so it can be shown instead of dying silently.
        CrashLog.install(this)
        
        // Enable true Edge-To-Edge rendering for immersive full-screen aesthetics
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        // Hide Android standard navigation and status bars completely
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }

        val pendingCrash = CrashLog.read(this)

        setContent {
            if (pendingCrash != null) {
                CrashReportScreen(pendingCrash) {
                    CrashLog.clear(this)
                    recreate()
                }
            } else {
                LauncherApp(bridge = systemBridge)
            }
        }
        
        ensureLocationPermission()
        ensureAudioPermission()
    }

    override fun onResume() {
        super.onResume()
        // Re-enforce immersive layout if returning from external applications
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        // Force refresh location listener on resume
        systemBridge.startLocationUpdates()
    }
    
    override fun onPause() {
        super.onPause()
        systemBridge.stopLocationUpdates()
    }

    // Overriding back press to prevent exiting the main HOME dashboard
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Do nothing to keep driver in the dashboard interface safely
    }
}

@Composable
private fun CrashReportScreen(details: String, onDismiss: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0B1220))
            .padding(20.dp)
    ) {
        Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
            Text(
                text = "Startup problem detected",
                color = Color(0xFF22D3EE),
                fontSize = 22.sp
            )
            Text(
                text = "Photograph this screen and send it for diagnosis.",
                color = Color(0xFF94A3B8),
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 6.dp, bottom = 14.dp)
            )
            Text(
                text = details,
                color = Color.White,
                fontSize = 11.sp
            )
            Button(
                onClick = onDismiss,
                modifier = Modifier.padding(top = 18.dp)
            ) {
                Text("Clear and continue")
            }
        }
    }
}
