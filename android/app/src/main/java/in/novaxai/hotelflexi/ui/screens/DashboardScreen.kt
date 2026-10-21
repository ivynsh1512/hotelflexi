package novaxai.hotelflexi.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import novaxai.hotelflexi.data.model.DashboardMetrics
import novaxai.hotelflexi.data.model.UrgentAlert
import novaxai.hotelflexi.data.repository.HotelRepository
import novaxai.hotelflexi.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen(
    repository: HotelRepository,
    onNavigateToReservations: () -> Unit,
    onNavigateToRooms: () -> Unit,
    onNavigateToBilling: () -> Unit,
    onNavigateToAlerts: () -> Unit
) {
    var metrics by remember { mutableStateOf<DashboardMetrics?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    fun loadData() {
        scope.launch {
            isLoading = true
            val res = repository.getDashboard()
            metrics = res.getOrNull()
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        loadData()
    }

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
                            text = repository.session.getActivePropertyName(),
                            style = MaterialTheme.typography.titleLarge,
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Logged in as ${repository.session.getUserName()} (${repository.session.getUserRole()})",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextSecondary
                        )
                    }

                    IconButton(
                        onClick = onNavigateToAlerts,
                        modifier = Modifier
                            .background(SurfaceCard, CircleShape)
                            .size(42.dp)
                    ) {
                        BadgedBox(
                            badge = {
                                val count = metrics?.urgentAlertsCount ?: 0
                                if (count > 0) {
                                    Badge(containerColor = StatusRose) {
                                        Text("$count", color = Color.White)
                                    }
                                }
                            }
                        ) {
                            Icon(
                                Icons.Default.Notifications,
                                contentDescription = "Alerts",
                                tint = if ((metrics?.urgentAlertsCount ?: 0) > 0) StatusRose else TextPrimary
                            )
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (isLoading && metrics == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandBlue)
            }
        } else {
            val m = metrics ?: DashboardMetrics()
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                // 1. Live Occupancy Banner
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Occupancy Rate",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = TextSecondary
                                )
                                Text(
                                    text = "${String.format("%.1f", m.occupancyPercent)}%",
                                    style = MaterialTheme.typography.headlineLarge,
                                    color = BrandBlueLight,
                                    fontWeight = FontWeight.Black
                                )
                                Text(
                                    text = "${m.inHouse} In-House Guests",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = StatusEmerald
                                )
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = "Today's Revenue",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = TextSecondary
                                )
                                Text(
                                    text = "₹${m.totalRevenuePaise / 100}",
                                    style = MaterialTheme.typography.titleLarge,
                                    color = TextPrimary,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "GST Invoices Synced",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextMuted
                                )
                            }
                        }
                    }
                }

                // 2. Metrics 2x2 Grid
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        MetricCard(
                            modifier = Modifier.weight(1f),
                            title = "Arrivals Today",
                            value = "${m.arrivalsToday}",
                            icon = Icons.Default.ArrowDownward,
                            accentColor = BrandBlue,
                            onClick = onNavigateToReservations
                        )
                        MetricCard(
                            modifier = Modifier.weight(1f),
                            title = "Departures",
                            value = "${m.departuresToday}",
                            icon = Icons.Default.ArrowUpward,
                            accentColor = StatusAmber,
                            onClick = onNavigateToReservations
                        )
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        MetricCard(
                            modifier = Modifier.weight(1f),
                            title = "Clean Rooms",
                            value = "${m.cleanRooms}",
                            icon = Icons.Default.CheckCircle,
                            accentColor = StatusEmerald,
                            onClick = onNavigateToRooms
                        )
                        MetricCard(
                            modifier = Modifier.weight(1f),
                            title = "Dirty / Pending",
                            value = "${m.dirtyRooms}",
                            icon = Icons.Default.Star,
                            accentColor = StatusRose,
                            onClick = onNavigateToRooms
                        )
                    }
                }

                // 3. Quick Actions
                item {
                    Text(
                        text = "Quick Operations",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        QuickActionButton(
                            modifier = Modifier.weight(1f),
                            label = "Reservations",
                            icon = Icons.Default.CalendarToday,
                            onClick = onNavigateToReservations
                        )
                        QuickActionButton(
                            modifier = Modifier.weight(1f),
                            label = "Rooms & HK",
                            icon = Icons.Default.MeetingRoom,
                            onClick = onNavigateToRooms
                        )
                        QuickActionButton(
                            modifier = Modifier.weight(1f),
                            label = "Folios / GST",
                            icon = Icons.Default.Receipt,
                            onClick = onNavigateToBilling
                        )
                    }
                }

                // 4. Urgent Staff Alerts (if any)
                if (m.recentAlerts.isNotEmpty()) {
                    item {
                        Text(
                            text = "Active Staff Sirens & Alerts",
                            style = MaterialTheme.typography.titleMedium,
                            color = StatusRose,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }

                    items(m.recentAlerts) { alert ->
                        AlertCard(alert = alert, onAction = onNavigateToAlerts)
                    }
                }
            }
        }
    }
}

@Composable
fun MetricCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    icon: ImageVector,
    accentColor: Color,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(accentColor.copy(alpha = 0.15f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = title, tint = accentColor, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = value, style = MaterialTheme.typography.headlineMedium, color = TextPrimary, fontWeight = FontWeight.Bold)
            Text(text = title, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
        }
    }
}

@Composable
fun QuickActionButton(
    modifier: Modifier = Modifier,
    label: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(48.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(containerColor = SurfaceCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
        contentPadding = PaddingValues(horizontal = 8.dp)
    ) {
        Icon(icon, contentDescription = label, tint = BrandBlueLight, modifier = Modifier.size(18.dp))
        Spacer(modifier = Modifier.width(6.dp))
        Text(text = label, color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun AlertCard(
    alert: UrgentAlert,
    onAction: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = StatusRose.copy(alpha = 0.12f)),
        border = androidx.compose.foundation.BorderStroke(1.dp, StatusRose.copy(alpha = 0.4f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(StatusRose, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Warning, contentDescription = "Urgent", tint = Color.White, modifier = Modifier.size(22.dp))
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = alert.title, style = MaterialTheme.typography.titleMedium, color = TextPrimary, fontWeight = FontWeight.Bold)
                Text(text = alert.message, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }
            TextButton(onClick = onAction) {
                Text("View", color = StatusRose, fontWeight = FontWeight.Bold)
            }
        }
    }
}
