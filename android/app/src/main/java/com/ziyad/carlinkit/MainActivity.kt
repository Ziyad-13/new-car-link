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
        
        // Enable true Edge-To-Edge rendering for immersive full-screen aesthetics
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        // Hide Android standard navigation and status bars completely
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }

        setContent {
            LauncherApp(bridge = systemBridge)
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
