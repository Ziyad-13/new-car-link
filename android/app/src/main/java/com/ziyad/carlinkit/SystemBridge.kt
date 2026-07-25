package com.ziyad.carlinkit

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.Uri
import android.net.wifi.WifiManager
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.core.content.ContextCompat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class SystemBridge(private val ctx: Context) : LocationListener {

    private val locationManager = ctx.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
    private val wifiManager = ctx.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
    
    // Reactive states for driving HUD values
    private val _currentSpeedKmh = MutableStateFlow(0)
    val currentSpeedKmh: StateFlow<Int> = _currentSpeedKmh

    private val _gpsStatus = MutableStateFlow("SEARCHING")
    val gpsStatus: StateFlow<String> = _gpsStatus

    private val _wifiSsidState = MutableStateFlow("...")
    val wifiSsidState: StateFlow<String> = _wifiSsidState

    init {
        startLocationUpdates()
        refreshNetworkInfo()
    }

    /** Re-read network info (SSID requires location permission on Android 8+). */
    fun refreshNetworkInfo() {
        _wifiSsidState.value = wifiSsid()
    }

    /**
     * Start listening to fine GPS updates to retrieve real-time speed in km/h.
     */
    @SuppressLint("MissingPermission")
    fun startLocationUpdates() {
        val hasPermission = ContextCompat.checkSelfPermission(
            ctx,
            android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (hasPermission && locationManager != null) {
            try {
                _gpsStatus.value = "CONNECTING"
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    500L, // 500ms updates for real-time smoothness
                    0.5f,  // 0.5 meters
                    this
                )
            } catch (e: Exception) {
                _gpsStatus.value = "ERROR"
            }
        } else {
            _gpsStatus.value = "NO_PERMISSION"
        }
    }

    override fun onLocationChanged(location: Location) {
        _gpsStatus.value = "ACTIVE"
        if (location.hasSpeed()) {
            // Speed comes in m/s, convert to km/h (speed * 3.6)
            _currentSpeedKmh.value = (location.speed * 3.6f).toInt()
        } else {
            _currentSpeedKmh.value = 0
        }
    }

    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
    override fun onProviderEnabled(provider: String) { _gpsStatus.value = "ACTIVE" }
    override fun onProviderDisabled(provider: String) { _gpsStatus.value = "DISABLED" }

    /**
     * Launch a specific Android application package.
     */
    fun launch(pkg: String) {
        val intent = ctx.packageManager.getLaunchIntentForPackage(pkg)
        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            ctx.startActivity(intent)
        } else {
            // Fallback: Open Google Play Store for the app package
            try {
                ctx.startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pkg"))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                )
            } catch (e: Exception) {
                // Secondary fallback: open browser Play Store
                ctx.startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$pkg"))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                )
            }
        }
    }

    /**
     * Launch Google Maps navigation directly pointing to a specific query.
     */
    fun navigate(query: String) {
        try {
            val gmmIntentUri = Uri.parse("google.navigation:q=${Uri.encode(query)}&mode=d")
            val mapIntent = Intent(Intent.ACTION_VIEW, gmmIntentUri)
            mapIntent.setPackage("com.google.android.apps.maps")
            mapIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            ctx.startActivity(mapIntent)
        } catch (e: Exception) {
            // Fallback: open in any maps or browser
            val mapIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/search/?api=1&query=${Uri.encode(query)}"))
            mapIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            ctx.startActivity(mapIntent)
        }
    }

    /**
     * Open standard Android OS settings.
     */
    fun openSettings() {
        ctx.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    /**
     * Open WiFi system settings.
     */
    fun openWifi() {
        ctx.startActivity(Intent(Settings.ACTION_WIFI_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    /**
     * Query all installed applications that can be launched as primary user activities.
     * Returns a list of Pair(AppName, PackageName).
     */
    fun installedApps(): List<Pair<String, String>> {
        val mainIntent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val resolveInfos = ctx.packageManager.queryIntentActivities(mainIntent, 0)
        return resolveInfos.map {
            val appLabel = it.loadLabel(ctx.packageManager).toString()
            val packageName = it.activityInfo.packageName
            Pair(appLabel, packageName)
        }.distinctBy { it.second }.sortedBy { it.first }
    }

    /**
     * Retrieve current device information.
     */
    fun deviceModel(): String = Build.MODEL
    fun androidVersion(): String = Build.VERSION.RELEASE

    /**
     * Retrieve connected Wi-Fi SSID safely.
     */
    fun wifiSsid(): String {
        return try {
            val info = wifiManager?.connectionInfo
            val ssid = info?.ssid ?: "No Connection"
            if (ssid.startsWith("\"") && ssid.endsWith("\"")) {
                ssid.substring(1, ssid.length - 1)
            } else {
                ssid
            }
        } catch (e: Exception) {
            "Unknown WiFi"
        }
    }

    /**
     * Retrieve battery level percentage.
     */
    fun batteryPercentage(): Int {
        val batteryManager = ctx.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        return batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: 100
    }
}
