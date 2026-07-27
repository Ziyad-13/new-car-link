package com.ziyad.carlinkit.ui.theme

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import java.util.Calendar

enum class ThemeMode { AUTO, DAY, NIGHT }

/**
 * Single source of truth for the Meridian palette.
 *
 * AUTO follows the clock (night between 18:00 and 06:00); DAY and NIGHT pin it.
 * The choice is persisted so it survives restarts of the launcher.
 */
object M {

    private const val PREFS = "carlinkkit_theme"
    private const val KEY_MODE = "theme_mode"

    var mode by mutableStateOf(ThemeMode.AUTO)
        private set

    /** Bumped every minute by the UI so AUTO re-evaluates without a restart. */
    var clockTick by mutableStateOf(0)

    fun load(context: Context) {
        mode = try {
            val name = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(KEY_MODE, ThemeMode.AUTO.name) ?: ThemeMode.AUTO.name
            ThemeMode.valueOf(name)
        } catch (_: Throwable) {
            ThemeMode.AUTO
        }
    }

    fun cycle(context: Context) {
        mode = when (mode) {
            ThemeMode.AUTO -> ThemeMode.DAY
            ThemeMode.DAY -> ThemeMode.NIGHT
            ThemeMode.NIGHT -> ThemeMode.AUTO
        }
        try {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY_MODE, mode.name).apply()
        } catch (_: Throwable) {
        }
    }

    val isNight: Boolean
        get() {
            clockTick // read so AUTO recomposes on tick
            return when (mode) {
                ThemeMode.DAY -> false
                ThemeMode.NIGHT -> true
                ThemeMode.AUTO -> {
                    val h = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
                    h >= 18 || h < 6
                }
            }
        }

    private val palette: MeridianColors
        get() = if (isNight) MeridianNight else MeridianDay

    val bg: Color get() = palette.bg
    val ink: Color get() = palette.ink
    val sub: Color get() = palette.sub
    val line: Color get() = palette.line
    val card: Color get() = palette.card
    val map: Color get() = palette.map
    val roads: Color get() = palette.roads
    val accent: Color get() = palette.accent
}
