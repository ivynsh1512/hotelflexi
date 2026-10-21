package novaxai.hotelflexi.data.model

import com.google.gson.annotations.SerializedName

// ---------------------------------------------------------------------------
// Auth & Profile Models
// ---------------------------------------------------------------------------
data class LoginRequest(
    val email: String,
    val password: String
)

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null,
    val message: String? = null
)

data class AuthUser(
    val id: String,
    val email: String,
    @SerializedName("full_name") val fullName: String?,
    val role: String,
    @SerializedName("tenant_id") val tenantId: String,
    @SerializedName("property_id") val propertyId: String?,
    val properties: List<PropertySummary> = emptyList(),
    val token: String? = null
)

data class PropertySummary(
    val id: String,
    val name: String,
    val address: String? = null,
    val city: String? = null,
    @SerializedName("subscription_plan") val subscriptionPlan: String? = "essential",
    @SerializedName("trial_days_left") val trialDaysLeft: Int? = null
)

// ---------------------------------------------------------------------------
// Dashboard Metrics
// ---------------------------------------------------------------------------
data class DashboardMetrics(
    @SerializedName("arrivals_today") val arrivalsToday: Int = 0,
    @SerializedName("departures_today") val departuresToday: Int = 0,
    @SerializedName("in_house") val inHouse: Int = 0,
    @SerializedName("occupancy_percent") val occupancyPercent: Double = 0.0,
    @SerializedName("total_revenue_paise") val totalRevenuePaise: Long = 0,
    @SerializedName("clean_rooms") val cleanRooms: Int = 0,
    @SerializedName("dirty_rooms") val dirtyRooms: Int = 0,
    @SerializedName("urgent_alerts_count") val urgentAlertsCount: Int = 0,
    @SerializedName("recent_alerts") val recentAlerts: List<UrgentAlert> = emptyList()
)

data class UrgentAlert(
    val id: String,
    val title: String,
    val message: String,
    @SerializedName("room_number") val roomNumber: String?,
    @SerializedName("created_at") val createdAt: Long,
    val severity: String = "urgent" // 'urgent', 'warning', 'info'
)

// ---------------------------------------------------------------------------
// Reservation Models
// ---------------------------------------------------------------------------
data class Reservation(
    val id: String,
    @SerializedName("reservation_number") val reservationNumber: String,
    @SerializedName("room_id") val roomId: String?,
    @SerializedName("room_number") val roomNumber: String?,
    @SerializedName("room_type_name") val roomTypeName: String?,
    @SerializedName("guest_name") val guestName: String,
    @SerializedName("guest_phone") val guestPhone: String?,
    @SerializedName("guest_email") val guestEmail: String?,
    @SerializedName("check_in_date") val checkInDate: String,
    @SerializedName("check_out_date") val checkOutDate: String,
    val adults: Int = 1,
    val children: Int = 0,
    val status: String, // 'confirmed', 'checked_in', 'checked_out', 'cancelled'
    val source: String, // 'direct', 'booking_engine', 'agoda', 'expedia', 'booking_com', 'makemytrip'
    @SerializedName("total_amount_paise") val totalAmountPaise: Long = 0,
    @SerializedName("paid_amount_paise") val paidAmountPaise: Long = 0,
    @SerializedName("balance_amount_paise") val balanceAmountPaise: Long = 0,
    @SerializedName("special_requests") val specialRequests: String? = null
)

// ---------------------------------------------------------------------------
// Room & Housekeeping Models
// ---------------------------------------------------------------------------
data class Room(
    val id: String,
    @SerializedName("room_number") val roomNumber: String,
    @SerializedName("room_type_id") val roomTypeId: String,
    @SerializedName("room_type_name") val roomTypeName: String,
    val floor: Int? = 1,
    val status: String, // 'available', 'occupied', 'dirty', 'maintenance'
    @SerializedName("is_clean") val isClean: Boolean = true,
    @SerializedName("active_guest_name") val activeGuestName: String? = null,
    @SerializedName("assigned_housekeeper") val assignedHousekeeper: String? = null
)

data class UpdateRoomStatusRequest(
    val status: String,
    @SerializedName("is_clean") val isClean: Boolean? = null
)

// ---------------------------------------------------------------------------
// Folio & Billing Models
// ---------------------------------------------------------------------------
data class Invoice(
    val id: String,
    @SerializedName("invoice_number") val invoiceNumber: String,
    @SerializedName("guest_name") val guestName: String,
    @SerializedName("reservation_number") val reservationNumber: String?,
    @SerializedName("subtotal_paise") val subtotalPaise: Long,
    @SerializedName("tax_paise") val taxPaise: Long,
    @SerializedName("total_paise") val totalPaise: Long,
    val status: String, // 'paid', 'unpaid', 'partially_paid'
    @SerializedName("created_at") val createdAt: Long
)

// ---------------------------------------------------------------------------
// Push Device Registration
// ---------------------------------------------------------------------------
data class RegisterDeviceRequest(
    @SerializedName("fcm_token") val fcmToken: String,
    @SerializedName("device_type") val deviceType: String = "android",
    @SerializedName("device_model") val deviceModel: String? = null,
    @SerializedName("app_version") val appVersion: String? = "2.0.0"
)
