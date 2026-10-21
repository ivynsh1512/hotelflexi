package novaxai.hotelflexi.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import novaxai.hotelflexi.data.repository.HotelRepository
import novaxai.hotelflexi.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

data class CalendarDay(
    val dateString: String,
    val dayOfWeek: String,
    val dayNumber: String,
    val occupancyPercent: Int,
    val arrivalsCount: Int,
    val departuresCount: Int,
    val isToday: Boolean
)

@Composable
fun CalendarScreen(
    repository: HotelRepository
) {
    val calendarDays = remember { generateCalendarDays() }

    Scaffold(
        containerColor = BackgroundDark,
        topBar = {
            Surface(
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Reservation Calendar",
                            style = MaterialTheme.typography.titleLarge,
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "October 2026 • 14-Day View",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextSecondary
                        )
                    }

                    Row {
                        IconButton(onClick = {}) {
                            Icon(Icons.Default.ChevronLeft, contentDescription = "Prev", tint = TextSecondary)
                        }
                        IconButton(onClick = {}) {
                            Icon(Icons.Default.ChevronRight, contentDescription = "Next", tint = TextSecondary)
                        }
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(vertical = 14.dp)
        ) {
            items(calendarDays) { day ->
                CalendarDayRow(day = day)
            }
        }
    }
}

@Composable
fun CalendarDayRow(day: CalendarDay) {
    val barColor = when {
        day.occupancyPercent >= 90 -> StatusRose
        day.occupancyPercent >= 60 -> BrandBlueLight
        else -> StatusEmerald
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (day.isToday) SurfaceCard else SurfaceDark
        ),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (day.isToday) BrandBlue else BorderDark
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(44.dp)) {
                    Text(
                        text = day.dayOfWeek,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (day.isToday) BrandBlueLight else TextSecondary,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = day.dayNumber,
                        style = MaterialTheme.typography.titleLarge,
                        color = TextPrimary,
                        fontWeight = FontWeight.Black
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Surface(shape = RoundedCornerShape(6.dp), color = StatusEmerald.copy(alpha = 0.15f)) {
                            Text(
                                text = "↓ ${day.arrivalsCount} In",
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = StatusEmerald,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Surface(shape = RoundedCornerShape(6.dp), color = StatusAmber.copy(alpha = 0.15f)) {
                            Text(
                                text = "↑ ${day.departuresCount} Out",
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = StatusAmber,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    Text(
                        text = "${day.occupancyPercent}% Booked",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            // Occupancy Indicator
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = barColor.copy(alpha = 0.15f),
                border = androidx.compose.foundation.BorderStroke(1.dp, barColor.copy(alpha = 0.3f))
            ) {
                Text(
                    text = "${day.occupancyPercent}%",
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = barColor,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

private fun generateCalendarDays(): List<CalendarDay> {
    val list = mutableListOf<CalendarDay>()
    val cal = Calendar.getInstance()
    val sdfDay = SimpleDateFormat("EEE", Locale.US)
    val sdfNum = SimpleDateFormat("dd", Locale.US)
    val sdfFull = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    for (i in 0..13) {
        val date = cal.time
        list.add(
            CalendarDay(
                dateString = sdfFull.format(date),
                dayOfWeek = sdfDay.format(date).uppercase(),
                dayNumber = sdfNum.format(date),
                occupancyPercent = (50..95).random(),
                arrivalsCount = (1..6).random(),
                departuresCount = (1..4).random(),
                isToday = i == 0
            )
        )
        cal.add(Calendar.DAY_OF_YEAR, 1)
    }
    return list
}
