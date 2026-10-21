package novaxai.hotelflexi.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Done
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import novaxai.hotelflexi.data.model.UrgentAlert
import novaxai.hotelflexi.data.repository.HotelRepository
import novaxai.hotelflexi.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun NotificationsScreen(
    repository: HotelRepository,
    onBack: () -> Unit
) {
    var alerts by remember {
        mutableStateOf(
            listOf(
                UrgentAlert(
                    id = "alt_1",
                    title = "Guest Self Check-In Complete",
                    message = "Pooja Verma checked into Room 102 via FlexiLink. Key prepared.",
                    roomNumber = "102",
                    createdAt = System.currentTimeMillis() - 1000 * 60 * 12,
                    severity = "urgent"
                ),
                UrgentAlert(
                    id = "alt_2",
                    title = "OTA Channel Sync Success",
                    message = "Agoda and Expedia inventory pushed successfully for Nov 2026.",
                    roomNumber = null,
                    createdAt = System.currentTimeMillis() - 1000 * 60 * 45,
                    severity = "info"
                )
            )
        )
    }

    Scaffold(
        containerColor = BackgroundDark,
        topBar = {
            Surface(
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 20.dp, vertical = 14.dp)
                ) {
                    Text(
                        text = "Notifications & Sirens",
                        style = MaterialTheme.typography.titleLarge,
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Real-time Front Desk and OTA Alerts",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary
                    )
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(alerts) { alert ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (alert.severity == "urgent") StatusRose.copy(alpha = 0.12f) else SurfaceDark
                    ),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (alert.severity == "urgent") StatusRose.copy(alpha = 0.4f) else BorderDark
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .background(
                                    if (alert.severity == "urgent") StatusRose else BrandBlue,
                                    CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                if (alert.severity == "urgent") Icons.Default.Warning else Icons.Default.Notifications,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(14.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = alert.title,
                                style = MaterialTheme.typography.titleMedium,
                                color = TextPrimary,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = alert.message,
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }

                        IconButton(
                            onClick = {
                                alerts = alerts.filter { it.id != alert.id }
                            }
                        ) {
                            Icon(Icons.Default.Done, contentDescription = "Dismiss", tint = TextSecondary)
                        }
                    }
                }
            }
        }
    }
}
