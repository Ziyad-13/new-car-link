package com.ziyad.carlinkit.ui.theme

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import java.util.Calendar

/**
 * Single source of truth for the Meridian palette.
 *
 * Screens read `M.bg`, `M.ink`, … so the whole launcher — cockpit, sidebar,
 * media, DSP and apps — stays visually consistent, and day/night switches
 * everywhere at once.
 */
object M {
    var isNight by mutableStateOf(defaultIsNight())

    private fun defaultIsNight(): Boolean {
        val h = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return h >= 18 || h < 6
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
