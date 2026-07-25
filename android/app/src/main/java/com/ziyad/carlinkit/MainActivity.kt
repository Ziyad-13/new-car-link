package com.ziyad.carlinkit

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.ziyad.carlinkit.ui.LauncherApp

class MainActivity : ComponentActivity() {
    
    private lateinit var systemBridge: SystemBridge

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

        // Initialize our system gateway bridge
        systemBridge = SystemBridge(this)

        setContent {
            LauncherApp(bridge = systemBridge)
        }
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

    // Overriding back press to prevent exiting the main HOME dashboard
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Do nothing to keep driver in the dashboard interface safely
    }
}
