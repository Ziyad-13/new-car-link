package com.ziyad.carlinkit.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Toyota emblem and CAMRY wordmark, drawn as vector shapes so they stay crisp
 * at any screen density. Personal use on the owner's own vehicle.
 */
@Composable
fun CamryMark(
    modifier: Modifier = Modifier,
    color: Color = Color.White,
    emblemSize: Dp = 74.dp
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        ToyotaEmblem(size = emblemSize, color = color)
        Spacer(Modifier.width(18.dp))
        CamryWordmark(height = emblemSize * 0.42f, color = color)
    }
}

/** Three interlocking ellipses of the Toyota emblem. */
@Composable
private fun ToyotaEmblem(size: Dp, color: Color) {
    Canvas(modifier = Modifier.size(width = size * 1.42f, height = size)) {
        val w = this.size.width
        val h = this.size.height
        val stroke = h * 0.085f

        // Outer ellipse
        drawOval(
            color = color,
            topLeft = androidx.compose.ui.geometry.Offset(stroke / 2, stroke / 2),
            size = androidx.compose.ui.geometry.Size(w - stroke, h - stroke),
            style = Stroke(width = stroke)
        )

        // Horizontal inner ellipse
        val hw = w * 0.62f
        val hh = h * 0.30f
        drawOval(
            color = color,
            topLeft = androidx.compose.ui.geometry.Offset((w - hw) / 2, (h - hh) / 2),
            size = androidx.compose.ui.geometry.Size(hw, hh),
            style = Stroke(width = stroke)
        )

        // Vertical inner ellipse
        val vw = w * 0.26f
        val vh = h * 0.72f
        drawOval(
            color = color,
            topLeft = androidx.compose.ui.geometry.Offset((w - vw) / 2, (h - vh) / 2),
            size = androidx.compose.ui.geometry.Size(vw, vh),
            style = Stroke(width = stroke)
        )
    }
}

/** Italic block letters spelling CAMRY. */
@Composable
private fun CamryWordmark(height: Dp, color: Color) {
    Canvas(modifier = Modifier.size(width = height * 5.4f, height = height)) {
        val h = this.size.height
        val t = h * 0.20f          // stroke thickness
        val slant = h * 0.22f      // italic lean
        val letterW = h * 0.78f
        val gap = h * 0.26f
        var x = 0f

        fun lean(px: Float, py: Float) =
            androidx.compose.ui.geometry.Offset(px + (1f - py / h) * slant, py)

        fun bar(x1: Float, y1: Float, x2: Float, y2: Float) {
            drawLine(color, lean(x1, y1), lean(x2, y2), strokeWidth = t)
        }

        // C
        bar(x + letterW, t / 2, x + t / 2, t / 2)
        bar(x + t / 2, t / 2, x + t / 2, h - t / 2)
        bar(x + t / 2, h - t / 2, x + letterW, h - t / 2)
        x += letterW + gap

        // A
        bar(x + t / 2, h, x + letterW / 2, t / 2)
        bar(x + letterW / 2, t / 2, x + letterW - t / 2, h)
        bar(x + letterW * 0.26f, h * 0.62f, x + letterW * 0.74f, h * 0.62f)
        x += letterW + gap

        // M
        bar(x + t / 2, h, x + t / 2, t / 2)
        bar(x + t / 2, t / 2, x + letterW / 2, h * 0.62f)
        bar(x + letterW / 2, h * 0.62f, x + letterW - t / 2, t / 2)
        bar(x + letterW - t / 2, t / 2, x + letterW - t / 2, h)
        x += letterW + gap

        // R
        bar(x + t / 2, h, x + t / 2, t / 2)
        bar(x + t / 2, t / 2, x + letterW - t / 2, t / 2)
        bar(x + letterW - t / 2, t / 2, x + letterW - t / 2, h * 0.55f)
        bar(x + letterW - t / 2, h * 0.55f, x + t / 2, h * 0.55f)
        bar(x + letterW * 0.45f, h * 0.55f, x + letterW - t / 2, h)
        x += letterW + gap

        // Y
        bar(x + t / 2, t / 2, x + letterW / 2, h * 0.55f)
        bar(x + letterW - t / 2, t / 2, x + letterW / 2, h * 0.55f)
        bar(x + letterW / 2, h * 0.55f, x + letterW / 2, h)
    }
}
