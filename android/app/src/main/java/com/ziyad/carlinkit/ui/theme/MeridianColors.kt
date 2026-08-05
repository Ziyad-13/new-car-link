package com.ziyad.carlinkit.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * Meridian palette — ported 1:1 from the AI Studio prototype
 * (.theme-porcelain-day / .theme-porcelain-night in src/index.css).
 */
data class MeridianColors(
    val bg: Color,
    val ink: Color,
    val sub: Color,
    val line: Color,
    val card: Color,
    val map: Color,
    val roads: Color,
    val accent: Color
)

val MeridianDay = MeridianColors(
    bg = Color(0xFFF6F3EC),
    ink = Color(0xFF23281F),
    sub = Color(0xFF6B675A),
    line = Color(0xFFDDD7C7),
    card = Color(0xFFFFFFFF),
    map = Color(0xFFEDE8DA),
    roads = Color(0xFFDBD5C2),
    accent = Color(0xFF5B6C8F)
)

val MeridianNight = MeridianColors(
    bg = Color(0xFF191A17),
    ink = Color(0xFFECE8DC),
    sub = Color(0xFF8B897D),
    line = Color(0xFF33342D),
    card = Color(0xFF212220),
    map = Color(0xFF1E1F1C),
    roads = Color(0xFF2A2B27),
    accent = Color(0xFF5B6C8F)
)
