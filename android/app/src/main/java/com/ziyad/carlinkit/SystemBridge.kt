package com.ziyad.carlinkit

import android.annotation.SuppressLint
import android.app.Application
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.core.content.ContextCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.StateFlow

class SystemBridge(application: Application) : AndroidViewModel(application), LocationListener {
    @SuppressLint("StaticFieldLeak")
    private val ctx: Context = application.applicationContext

    private val locationManager = ctx.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
    private val wifiManager = ctx.getSystemService(Context.WIFI_SERVICE) as? WifiManager

    // Audio DSP & Local Player Engines
    val audioEngine = AudioEngine(ctx)
    val localPlayerManager = LocalPlayerManager(ctx, audioEngine)
    val externalMedia = ExternalMediaController(ctx).also { it.start() }

    init {
        // Sessions appear and disappear long after startup (a player launched
        // later, permission granted later). Poll so the rail always reflects
        // what is actually playing.
        viewModelScope.launch {
            while (true) {
                kotlinx.coroutines.delay(4000)
                try { externalMedia.refresh() } catch (_: Throwable) {}
            }
        }
    }

    /** Metadata scraped from Bluetooth notifications when no session exists. */
    val btTitle = MediaNotificationListener.btTitle
    val btArtist = MediaNotificationListener.btArtist
    val btSource = MediaNotificationListener.btSource

    val globalDspAvailable: StateFlow<Boolean> = audioEngine.globalDspAvailable
    val isPlaying: StateFlow<Boolean> = localPlayerManager.isPlaying
    val currentTrack = localPlayerManager.currentTrack
    val playbackProgress = localPlayerManager.progress

    // Reactive states for driving HUD values
    private val _currentSpeedKmh = MutableStateFlow(0)
    val currentSpeedKmh: StateFlow<Int> = _currentSpeedKmh

    private val _latLon = MutableStateFlow<Pair<Double, Double>?>(null)
    val latLon: StateFlow<Pair<Double, Double>?> = _latLon

    private val _bearing = MutableStateFlow(0f)
    val bearing: StateFlow<Float> = _bearing

    private val _gpsStatus = MutableStateFlow("SEARCHING")
    val gpsStatus: StateFlow<String> = _gpsStatus

    private val _wifiSsidState = MutableStateFlow("Searching...")
    val wifiSsidState: StateFlow<String> = _wifiSsidState

    init {
        startLocationUpdates()
        refreshNetworkInfo()
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
                stopLocationUpdates()
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

    @SuppressLint("MissingPermission")
    fun stopLocationUpdates() {
        locationManager?.removeUpdates(this)
    }

    override fun onLocationChanged(location: Location) {
        _gpsStatus.value = "ACTIVE"
        _latLon.value = location.latitude to location.longitude
        if (location.hasBearing()) _bearing.value = location.bearing
        if (location.hasSpeed()) {
            // m/s -> km/h, lightly smoothed: raw GPS speed jitters by a few
            // km/h even at a constant pace, which made the readout flicker.
            val raw = location.speed * 3.6f
            val prev = _currentSpeedKmh.value.toFloat()
            _currentSpeedKmh.value = (prev + (raw - prev) * 0.35f).toInt()
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
    companion object {
        /** Saudi-built navigation app; preferred when installed. */
        const val HUDHUD_PACKAGE = "sa.hudhud.maps"
        const val GOOGLE_MAPS_PACKAGE = "com.google.android.apps.maps"
    }

    /** True when Hudhud Maps is installed on this device. */
    fun hudhudInstalled(): Boolean = try {
        ctx.packageManager.getPackageInfo(HUDHUD_PACKAGE, 0)
        true
    } catch (_: Throwable) {
        false
    }

    /**
     * Start navigation to a place.
     *
     * Order of preference: Hudhud (local road data), then whatever the user
     * has set as their navigation app, then Google Maps, then the web.
     * Each step is attempted only if the previous one has no handler.
     */
    fun navigate(query: String) {
        if (query.isBlank()) return
        val encoded = Uri.encode(query)
        val geoUri = Uri.parse("geo:0,0?q=$encoded")

        // 1. Hudhud, if installed
        if (hudhudInstalled() && tryStart(Intent(Intent.ACTION_VIEW, geoUri).apply {
                setPackage(HUDHUD_PACKAGE)
            })) return

        // 2. Whatever handles geo: (user's default, or a chooser)
        if (tryStart(Intent(Intent.ACTION_VIEW, geoUri))) return

        // 3. Google Maps turn-by-turn
        if (tryStart(Intent(
                Intent.ACTION_VIEW,
                Uri.parse("google.navigation:q=$encoded&mode=d")
            ).apply { setPackage(GOOGLE_MAPS_PACKAGE) })) return

        // 4. Browser
        tryStart(Intent(
            Intent.ACTION_VIEW,
            Uri.parse("https://www.google.com/maps/search/?api=1&query=$encoded")
        ))
    }

    private fun tryStart(intent: Intent): Boolean = try {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        if (intent.resolveActivity(ctx.packageManager) != null) {
            ctx.startActivity(intent)
            true
        } else {
            false
        }
    } catch (_: Throwable) {
        false
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

    fun refreshNetworkInfo() {
        _wifiSsidState.value = wifiSsid()
    }

    /**
     * Retrieve connected Wi-Fi SSID safely.
     */
    @SuppressLint("MissingPermission")
    fun wifiSsid(): String {
        return try {
            val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            var ssid = "No Connection"

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                cm?.let {
                    val capabilities = it.getNetworkCapabilities(it.activeNetwork)
                    if (capabilities != null && capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                        val wifiInfo = capabilities.transportInfo as? WifiInfo
                        if (wifiInfo != null) {
                            ssid = wifiInfo.ssid
                        }
                    }
                }
            } else {
                @Suppress("DEPRECATION")
                val info = wifiManager?.connectionInfo
                @Suppress("DEPRECATION")
                if (info != null) {
                    ssid = info.ssid
                }
            }

            if (ssid == WifiManager.UNKNOWN_SSID || ssid.isBlank()) {
                "Unknown WiFi"
            } else if (ssid.startsWith("\"") && ssid.endsWith("\"")) {
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

    override fun onCleared() {
        super.onCleared()
        stopLocationUpdates()
        try { externalMedia.release() } catch (_: Throwable) {}
        localPlayerManager.release()
        audioEngine.release()
    }
}
