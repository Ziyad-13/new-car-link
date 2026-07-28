package com.ziyad.carlinkit.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Shared building blocks for every inner screen, taken from the Meridian
 * design spec: 800x480 head unit, 64dp sidebar, 20dp gutters, 10dp card radius,
 * 1dp borders, no shadows.
 */

/** Screen header: title on the left, optional trailing content on the right. */
@Composable
fun ScreenHeader(
    title: String,
    modifier: Modifier = Modifier,
    trailing: @Composable RowScope.() -> Unit = {}
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(start = 20.dp, end = 20.dp, top = 14.dp, bottom = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(title, color = M.ink, fontSize = 17.sp, fontWeight = FontWeight.Bold)
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            content = trailing
        )
    }
}

/** Rounded selector chip. Selected = accent fill with card-coloured text. */
@Composable
fun MChip(label: String, selected: Boolean, onClick: () -> Unit) {
    val base = Modifier
        .clip(RoundedCornerShape(999.dp))
        .clickable(onClick = onClick)
    Text(
        text = label,
        color = if (selected) M.card else M.sub,
        fontSize = 12.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = (if (selected) base.background(M.accent)
        else base.border(1.dp, M.line, RoundedCornerShape(999.dp)))
            .padding(horizontal = 14.dp, vertical = 6.dp)
    )
}

/** Standard surface card. */
@Composable
fun MCard(
    modifier: Modifier = Modifier,
    padding: Int = 16,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(M.card)
            .border(1.dp, M.line, RoundedCornerShape(10.dp))
            .padding(padding.dp),
        content = content
    )
}

/** Small uppercase section label. */
@Composable
fun MSectionLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        color = M.sub,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.9.sp,
        modifier = modifier
    )
}
