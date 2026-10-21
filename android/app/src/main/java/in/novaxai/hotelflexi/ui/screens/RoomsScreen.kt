package novaxai.hotelflexi.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import novaxai.hotelflexi.data.model.Room
import novaxai.hotelflexi.data.repository.HotelRepository
import novaxai.hotelflexi.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun RoomsScreen(
    repository: HotelRepository
) {
    var rooms by remember { mutableStateOf<List<Room>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var selectedFloor by remember { mutableStateOf<Int?>(null) }
    val scope = rememberCoroutineScope()

    fun loadRooms() {
        scope.launch {
            isLoading = true
            val res = repository.getRooms()
            rooms = res.getOrDefault(emptyList())
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        loadRooms()
    }

    fun toggleRoomCleanStatus(room: Room) {
        scope.launch {
            val newClean = !room.isClean
            val newStatus = if (newClean) "available" else "dirty"
            repository.updateRoomStatus(room.id, newStatus, newClean)
            loadRooms()
        }
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
                        text = "Rooms & Housekeeping",
                        style = MaterialTheme.typography.titleLarge,
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Tap a room to toggle Clean / Dirty status",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary
                    )
                }
            }
        }
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandBlue)
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(rooms) { room ->
                    RoomGridCard(
                        room = room,
                        onToggleClean = { toggleRoomCleanStatus(room) }
                    )
                }
            }
        }
    }
}

@Composable
fun RoomGridCard(
    room: Room,
    onToggleClean: () -> Unit
) {
    val statusColor = when (room.status) {
        "available" -> StatusEmerald
        "occupied" -> BrandBlueLight
        "dirty" -> StatusRose
        "maintenance" -> StatusAmber
        else -> TextSecondary
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggleClean() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Room ${room.roomNumber}",
                    style = MaterialTheme.typography.titleLarge,
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold
                )

                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .background(statusColor, CircleShape)
                )
            }

            Text(
                text = room.roomTypeName,
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary,
                modifier = Modifier.padding(top = 2.dp, bottom = 8.dp)
            )

            if (room.activeGuestName != null) {
                Text(
                    text = "👤 ${room.activeGuestName}",
                    style = MaterialTheme.typography.bodySmall,
                    color = BrandBlueLight,
                    fontWeight = FontWeight.SemiBold
                )
            } else {
                Text(
                    text = if (room.isClean) "✨ Ready for Guest" else "🧹 Needs Cleaning",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (room.isClean) StatusEmerald else StatusRose
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Surface(
                shape = RoundedCornerShape(8.dp),
                color = statusColor.copy(alpha = 0.15f),
                border = androidx.compose.foundation.BorderStroke(1.dp, statusColor.copy(alpha = 0.3f))
            ) {
                Text(
                    text = room.status.replace("_", " ").uppercase(),
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = statusColor,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
