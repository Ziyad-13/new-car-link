package com.ziyad.carlinkit

import android.content.Context
import android.content.SharedPreferences
import android.media.audiofx.BassBoost
import android.media.audiofx.DynamicsProcessing
import android.media.audiofx.Equalizer
import android.media.audiofx.LoudnessEnhancer
import android.os.Build
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class EqBandInfo(
    val index: Short,
    val centerFreqHz: Int,
    val freqRangeHz: Pair<Int, Int>?,
    val formattedFreq: String,
    val minLevelMb: Short,
    val maxLevelMb: Short,
    val currentLevelMb: Short
)

class AudioEngine(private val context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("carlinkkit_audio_dsp", Context.MODE_PRIVATE)

    // Global DSP Effects (Session 0)
    private var globalEqualizer: Equalizer? = null
    private var globalBassBoost: BassBoost? = null
    private var globalLoudnessEnhancer: LoudnessEnhancer? = null
    private var globalDynamicsProcessing: DynamicsProcessing? = null

    // Local DSP Effects (Local Player Session)
    private var localEqualizer: Equalizer? = null
    private var localBassBoost: BassBoost? = null
    private var localLoudnessEnhancer: LoudnessEnhancer? = null
    private var localDynamicsProcessing: DynamicsProcessing? = null

    // StateFlows
    private val _globalDspAvailable = MutableStateFlow(false)
    val globalDspAvailable: StateFlow<Boolean> = _globalDspAvailable

    private val _activeSessionId = MutableStateFlow(0)
    val activeSessionId: StateFlow<Int> = _activeSessionId

    private val _isGlobalActive = MutableStateFlow(false)
    val isGlobalActive: StateFlow<Boolean> = _isGlobalActive

    // EQ info state
    private val _bands = MutableStateFlow<List<EqBandInfo>>(emptyList())
    val bands: StateFlow<List<EqBandInfo>> = _bands

    private val _presets = MutableStateFlow<List<String>>(emptyList())
    val presets: StateFlow<List<String>> = _presets

    private val _selectedPresetIndex = MutableStateFlow(-1)
    val selectedPresetIndex: StateFlow<Int> = _selectedPresetIndex

    private val _bassBoostStrength = MutableStateFlow(0) // 0 to 1000 mB
    val bassBoostStrength: StateFlow<Int> = _bassBoostStrength

    private val _loudnessGain = MutableStateFlow(0) // 0 to 1000 mB
    val loudnessGain: StateFlow<Int> = _loudnessGain

    private val _limiterEnabled = MutableStateFlow(true)
    val limiterEnabled: StateFlow<Boolean> = _limiterEnabled

    init {
        // Load persisted settings
        _bassBoostStrength.value = prefs.getInt("bass_boost", 0)
        _loudnessGain.value = prefs.getInt("loudness_gain", 0)
        _limiterEnabled.value = prefs.getBoolean("limiter_enabled", true)
        _selectedPresetIndex.value = prefs.getInt("preset_index", -1)

        attemptGlobalDsp()
    }

    /**
     * PATH 1 — Global DSP Attempt on Session 0
     */
    fun attemptGlobalDsp() {
        var eqSuccess = false
        try {
            val eq = Equalizer(0, 0)
            eq.enabled = true
            // Read-back verification
            if (eq.enabled) {
                globalEqualizer = eq
                eqSuccess = true
            } else {
                try { eq.release() } catch (_: Exception) {}
            }
        } catch (e: Exception) {
            globalEqualizer = null
        }

        try {
            val bb = BassBoost(0, 0)
            bb.enabled = true
            if (bb.enabled) {
                globalBassBoost = bb
            } else {
                try { bb.release() } catch (_: Exception) {}
            }
        } catch (_: Exception) {
            globalBassBoost = null
        }

        try {
            val le = LoudnessEnhancer(0)
            le.enabled = true
            if (le.enabled) {
                globalLoudnessEnhancer = le
            } else {
                try { le.release() } catch (_: Exception) {}
            }
        } catch (_: Exception) {
            globalLoudnessEnhancer = null
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            try {
                val dp = DynamicsProcessing(0)
                dp.enabled = true
                if (dp.enabled) {
                    globalDynamicsProcessing = dp
                } else {
                    try { dp.release() } catch (_: Exception) {}
                }
            } catch (_: Exception) {
                globalDynamicsProcessing = null
            }
        }

        _globalDspAvailable.value = eqSuccess
        if (eqSuccess) {
            _isGlobalActive.value = true
            populateEqMetadata(globalEqualizer)
            applySavedSettingsToGlobal()
        }
    }

    /**
     * PATH 2 — Attach DSP to Local Player Session
     */
    fun attachToSession(sessionId: Int) {
        if (sessionId <= 0 || sessionId == _activeSessionId.value) return
        _activeSessionId.value = sessionId

        // Release any existing local effects
        releaseLocalEffects()

        var activeEq: Equalizer? = null
        try {
            val eq = Equalizer(0, sessionId)
            eq.enabled = true
            if (eq.enabled) {
                localEqualizer = eq
                activeEq = eq
            } else {
                try { eq.release() } catch (_: Exception) {}
                activeEq = globalEqualizer
            }
        } catch (e: Exception) {
            localEqualizer = null
            activeEq = globalEqualizer
        }

        try {
            val bb = BassBoost(0, sessionId)
            bb.enabled = true
            if (bb.enabled) {
                localBassBoost = bb
            } else {
                try { bb.release() } catch (_: Exception) {}
            }
        } catch (_: Exception) {
            localBassBoost = null
        }

        try {
            val le = LoudnessEnhancer(sessionId)
            le.enabled = true
            if (le.enabled) {
                localLoudnessEnhancer = le
            } else {
                try { le.release() } catch (_: Exception) {}
            }
        } catch (_: Exception) {
            localLoudnessEnhancer = null
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            try {
                val dp = DynamicsProcessing(sessionId)
                dp.enabled = true
                if (dp.enabled) {
                    localDynamicsProcessing = dp
                } else {
                    try { dp.release() } catch (_: Exception) {}
                }
            } catch (_: Exception) {
                localDynamicsProcessing = null
            }
        }

        populateEqMetadata(activeEq)
        applySavedSettingsToSession()
    }

    private fun populateEqMetadata(eq: Equalizer?) {
        if (eq == null) return
        try {
            val numBands = eq.numberOfBands
            val range = eq.bandLevelRange // ShortArray [min, max]
            val minMb = range[0]
            val maxMb = range[1]

            val bandList = mutableListOf<EqBandInfo>()
            val currentPreset = _selectedPresetIndex.value
            for (i in 0 until numBands) {
                val b = i.toShort()
                val freqHz = try { eq.getCenterFreq(b) / 1000 } catch (_: Exception) { 0 }
                val freqRangeArray = try { eq.getBandFreqRange(b) } catch (_: Exception) { null }
                val freqRange = if (freqRangeArray != null && freqRangeArray.size >= 2) {
                    Pair(freqRangeArray[0] / 1000, freqRangeArray[1] / 1000)
                } else null

                val centerStr = if (freqHz >= 1000) "${freqHz / 1000}kHz" else "${freqHz}Hz"
                val rangeStr = if (freqRange != null) {
                    val minStr = if (freqRange.first >= 1000) "${freqRange.first / 1000}k" else "${freqRange.first}"
                    val maxStr = if (freqRange.second >= 1000) "${freqRange.second / 1000}k" else "${freqRange.second}"
                    "$minStr-$maxStr"
                } else null

                val formatted = if (rangeStr != null) "$centerStr\n$rangeStr" else centerStr
                val hwLevel = try { eq.getBandLevel(b) } catch (_: Exception) { 0.toShort() }
                val savedLevel = if (currentPreset >= 0) {
                    hwLevel
                } else {
                    prefs.getInt("eq_band_$i", hwLevel.toInt()).toShort()
                }
                bandList.add(
                    EqBandInfo(
                        index = b,
                        centerFreqHz = freqHz,
                        freqRangeHz = freqRange,
                        formattedFreq = formatted,
                        minLevelMb = minMb,
                        maxLevelMb = maxMb,
                        currentLevelMb = savedLevel
                    )
                )
            }
            _bands.value = bandList

            // Presets
            val numPresets = eq.numberOfPresets.toInt()
            val presetNames = mutableListOf<String>()
            for (p in 0 until numPresets) {
                try {
                    presetNames.add(eq.getPresetName(p.toShort()))
                } catch (_: Exception) {
                    presetNames.add("Preset $p")
                }
            }
            _presets.value = presetNames
        } catch (_: Exception) {}
    }

    fun setBandLevel(bandIndex: Short, levelMb: Short) {
        val currentList = _bands.value.toMutableList()
        val idx = currentList.indexOfFirst { it.index == bandIndex }
        if (idx >= 0) {
            currentList[idx] = currentList[idx].copy(currentLevelMb = levelMb)
            _bands.value = currentList
            prefs.edit().putInt("eq_band_$bandIndex", levelMb.toInt()).apply()
            _selectedPresetIndex.value = -1
            prefs.edit().putInt("preset_index", -1).apply()

            try { localEqualizer?.setBandLevel(bandIndex, levelMb) } catch (_: Exception) {}
            try { globalEqualizer?.setBandLevel(bandIndex, levelMb) } catch (_: Exception) {}
        }
    }

    fun applyPreset(presetIndex: Short) {
        val eq = localEqualizer ?: globalEqualizer
        if (eq != null) {
            try {
                eq.usePreset(presetIndex)
                _selectedPresetIndex.value = presetIndex.toInt()
                val editor = prefs.edit().putInt("preset_index", presetIndex.toInt())
                for (i in 0 until eq.numberOfBands) {
                    editor.remove("eq_band_$i")
                }
                editor.apply()

                // Refresh band levels
                populateEqMetadata(eq)
            } catch (_: Exception) {}
        }
    }

    fun setBassBoost(strength: Int) { // 0 to 1000
        val clamped = strength.coerceIn(0, 1000)
        _bassBoostStrength.value = clamped
        prefs.edit().putInt("bass_boost", clamped).apply()

        try {
            if (localBassBoost?.strengthSupported == true) {
                localBassBoost?.setStrength(clamped.toShort())
            }
        } catch (_: Exception) {}

        try {
            if (globalBassBoost?.strengthSupported == true) {
                globalBassBoost?.setStrength(clamped.toShort())
            }
        } catch (_: Exception) {}
    }

    fun setLoudnessGain(gainMb: Int) { // 0 to 1000 mB
        val clamped = gainMb.coerceIn(0, 1000)
        _loudnessGain.value = clamped
        prefs.edit().putInt("loudness_gain", clamped).apply()

        try { localLoudnessEnhancer?.setTargetGain(clamped) } catch (_: Exception) {}
        try { globalLoudnessEnhancer?.setTargetGain(clamped) } catch (_: Exception) {}
    }

    fun setLimiterEnabled(enabled: Boolean) {
        _limiterEnabled.value = enabled
        prefs.edit().putBoolean("limiter_enabled", enabled).apply()

        try { localDynamicsProcessing?.enabled = enabled } catch (_: Exception) {}
        try { globalDynamicsProcessing?.enabled = enabled } catch (_: Exception) {}
    }

    private fun applySavedSettingsToGlobal() {
        val eq = globalEqualizer ?: return
        val savedPreset = _selectedPresetIndex.value
        if (savedPreset >= 0 && savedPreset < eq.numberOfPresets) {
            applyPreset(savedPreset.toShort())
        } else {
            _bands.value.forEach { band ->
                try { eq.setBandLevel(band.index, band.currentLevelMb) } catch (_: Exception) {}
            }
        }
        setBassBoost(_bassBoostStrength.value)
        setLoudnessGain(_loudnessGain.value)
        setLimiterEnabled(_limiterEnabled.value)
    }

    private fun applySavedSettingsToSession() {
        val eq = localEqualizer ?: globalEqualizer
        if (eq != null) {
            val savedPreset = _selectedPresetIndex.value
            if (savedPreset >= 0 && savedPreset < eq.numberOfPresets) {
                applyPreset(savedPreset.toShort())
            } else {
                _bands.value.forEach { band ->
                    try { eq.setBandLevel(band.index, band.currentLevelMb) } catch (_: Exception) {}
                }
            }
        }
        setBassBoost(_bassBoostStrength.value)
        setLoudnessGain(_loudnessGain.value)
        setLimiterEnabled(_limiterEnabled.value)
    }

    private fun releaseLocalEffects() {
        try { localEqualizer?.release() } catch (_: Exception) {}
        try { localBassBoost?.release() } catch (_: Exception) {}
        try { localLoudnessEnhancer?.release() } catch (_: Exception) {}
        try { localDynamicsProcessing?.release() } catch (_: Exception) {}

        localEqualizer = null
        localBassBoost = null
        localLoudnessEnhancer = null
        localDynamicsProcessing = null
    }

    /**
     * Release all AudioEffect objects to prevent memory leaks and audio dropouts device-wide
     */
    fun release() {
        releaseLocalEffects()

        try { globalEqualizer?.release() } catch (_: Exception) {}
        try { globalBassBoost?.release() } catch (_: Exception) {}
        try { globalLoudnessEnhancer?.release() } catch (_: Exception) {}
        try { globalDynamicsProcessing?.release() } catch (_: Exception) {}

        globalEqualizer = null
        globalBassBoost = null
        globalLoudnessEnhancer = null
        globalDynamicsProcessing = null
    }
}
