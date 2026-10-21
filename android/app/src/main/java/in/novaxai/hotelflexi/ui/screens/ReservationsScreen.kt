package novaxai.hotelflexi.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import novaxai.hotelflexi.data.model.Reservation
import novaxai.hotelflexi.data.repository.HotelRepository
import novaxai.hotelflexi.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReservationsScreen(
    repository: HotelRepository
) {
    var reservations by remember { mutableStateOf<List<Reservation>>(emptyList()) }
    var selectedFilter by remember { mutableStateOf("all") }
    var searchQuery by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(true) }
    var selectedReservation by remember { mutableStateOf<Reservation?>(null) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    fun loadReservations() {
        scope.launch {
            isLoading = true
            val filter = if (selectedFilter == "all") null else selectedFilter
            val query = if (searchQuery.isBlank()) null else searchQuery
            val res = repository.getReservations(status = filter, search = query)
            reservations = res.getOrDefault(emptyList())
            isLoading = false
        }
    }

    LaunchedEffect(selectedFilter) {
        loadReservations()
    }

    val filterOptions = listOf(
        "all" to "All Bookings",
        "confirmed" to "Confirmed",
        "checked_in" to "Checked In",
        "checked_out" to "Checked Out",
        "cancelled" to "Cancelled"
    )

    Scaffold(
        containerColor = BackgroundDark,
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark)
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Text(
                    text = "Reservations",
                    style = MaterialTheme.typography.titleLarge,
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Search Bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = {
                        searchQuery = it
                        loadReservations()
                    },
                    placeholder = { Text("Search by guest name, phone, ref #", color = TextSecondary, fontSize = 13.sp) },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = "Search", tint = TextSecondary, modifier = Modifier.size(20.dp))
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedBorderColor = BrandBlue,
                        unfocusedBorderColor = BorderDark,
                        focusedContainerColor = SurfaceCard,
                        unfocusedContainerColor = SurfaceCard
                    ),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Filter Tabs
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filterOptions) { (key, label) ->
                        val isSelected = selectedFilter == key
                        FilterChip(
                            selected = isSelected,
                            onClick = { selectedFilter = key },
                            label = { Text(label, fontSize = 12.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = BrandBlue,
                                selectedLabelColor = TextPrimary,
                                containerColor = SurfaceCard,
                                labelColor = TextSecondary
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = isSelected,
                                borderColor = if (isSelected) BrandBlue else BorderDark
                            )
                        )
                    }
                }
            }
        }
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandBlue)
            }
        } else if (reservations.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.EventBusy, contentDescription = "No Bookings", tint = TextMuted, modifier = Modifier.size(54.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("No reservations match this filter.", color = TextSecondary, style = MaterialTheme.typography.bodyMedium)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(vertical = 12.dp)
            ) {
                items(reservations) { res ->
                    ReservationCard(
                        reservation = res,
                        onClick = { selectedReservation = res }
                    )
                }
            }
        }

        // Details Bottom Sheet
        selectedReservation?.let { res ->
            ModalBottomSheet(
                onDismissRequest = { selectedReservation = null },
                containerColor = SurfaceDark,
                dragHandle = { BottomSheetDefaults.DragHandle(color = BorderDark) }
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp)
                        .padding(bottom = 32.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = res.guestName, style = MaterialTheme.typography.titleLarge, color = TextPrimary, fontWeight = FontWeight.Bold)
                            Text(text = "Ref: ${res.reservationNumber} • ${res.source.uppercase()}", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                        }
                        StatusBadge(status = res.status)
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Dates and Room Info
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark)
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Dates", color = TextSecondary, style = MaterialTheme.typography.bodySmall)
                                Text("${res.checkInDate} → ${res.checkOutDate}", color = TextPrimary, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodySmall)
                            }
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Room", color = TextSecondary, style = MaterialTheme.typography.bodySmall)
                                Text("Room ${res.roomNumber ?: "Unassigned"} (${res.roomTypeName ?: "Standard"})", color = BrandBlueLight, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall)
                            }
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Guests", color = TextSecondary, style = MaterialTheme.typography.bodySmall)
                                Text("${res.adults} Adults, ${res.children} Children", color = TextPrimary, style = MaterialTheme.typography.bodySmall)
                            }
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Total Tariff", color = TextSecondary, style = MaterialTheme.typography.bodySmall)
                                Text("₹${res.totalAmountPaise / 100}", color = StatusEmerald, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall)
                            }
                            if (res.balanceAmountPaise > 0) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Balance Due", color = StatusRose, style = MaterialTheme.typography.bodySmall)
                                    Text("₹${res.balanceAmountPaise / 100}", color = StatusRose, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Action Buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        if (res.status == "confirmed") {
                            Button(
                                onClick = {
                                    scope.launch {
                                        repository.checkIn(res.id)
                                        selectedReservation = null
                                        loadReservations()
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = StatusEmerald)
                            ) {
                                Icon(Icons.Default.MeetingRoom, contentDescription = "Check In", modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Check In", fontWeight = FontWeight.Bold)
                            }
                        } else if (res.status == "checked_in") {
                            Button(
                                onClick = {
                                    scope.launch {
                                        repository.checkOut(res.id)
                                        selectedReservation = null
                                        loadReservations()
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = BrandBlue)
                            ) {
                                Icon(Icons.Default.ExitToApp, contentDescription = "Check Out", modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Check Out", fontWeight = FontWeight.Bold)
                            }
                        }

                        res.guestPhone?.let { phone ->
                            OutlinedButton(
                                onClick = {
                                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                                    context.startActivity(intent)
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark)
                            ) {
                                Icon(Icons.Default.Phone, contentDescription = "Call", tint = TextPrimary, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Call Guest", color = TextPrimary)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ReservationCard(
    reservation: Reservation,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = reservation.guestName,
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Ref: ${reservation.reservationNumber}",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary
                    )
                }
                StatusBadge(status = reservation.status)
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.DateRange, contentDescription = null, tint = TextMuted, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${reservation.checkInDate} → ${reservation.checkOutDate}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = SurfaceCard
                ) {
                    Text(
                        text = "Room ${reservation.roomNumber ?: "Unassigned"}",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = BrandBlueLight,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Source: ${reservation.source.uppercase()}",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted
                )
                Text(
                    text = "₹${reservation.totalAmountPaise / 100}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = StatusEmerald,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun StatusBadge(status: String) {
    val (label, bg, text) = when (status) {
        "confirmed" -> Triple("Confirmed", StatusEmerald.copy(alpha = 0.15f), StatusEmerald)
        "checked_in" -> Triple("Checked In", BrandBlue.copy(alpha = 0.15f), BrandBlueLight)
        "checked_out" -> Triple("Checked Out", SurfaceCard, TextSecondary)
        "cancelled" -> Triple("Cancelled", StatusRose.copy(alpha = 0.15f), StatusRose)
        else -> Triple(status.replace("_", " ").uppercase(), SurfaceCard, TextSecondary)
    }

    Surface(
        shape = RoundedCornerShape(8.dp),
        color = bg,
        border = androidx.compose.foundation.BorderStroke(1.dp, text.copy(alpha = 0.3f))
    ) {
        Text(
            text = label,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            style = MaterialTheme.typography.labelSmall,
            color = text,
            fontWeight = FontWeight.Bold
        )
    }
}
