package `in`.novaxai.hotelflexi.data.api

import `in`.novaxai.hotelflexi.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface HotelFlexiApiService {

    // -----------------------------------------------------------------------
    // Authentication & Profile
    // -----------------------------------------------------------------------
    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<ApiResponse<AuthUser>>

    @GET("auth/me")
    suspend fun getCurrentUser(): Response<ApiResponse<AuthUser>>

    // -----------------------------------------------------------------------
    // Dashboard & Metrics
    // -----------------------------------------------------------------------
    @GET("dashboard/summary")
    suspend fun getDashboardMetrics(
        @Query("property_id") propertyId: String? = null
    ): Response<ApiResponse<DashboardMetrics>>

    @GET("complaints")
    suspend fun getUrgentAlerts(
        @Query("property_id") propertyId: String? = null
    ): Response<ApiResponse<List<UrgentAlert>>>

    // -----------------------------------------------------------------------
    // Reservations
    // -----------------------------------------------------------------------
    @GET("reservations")
    suspend fun getReservations(
        @Query("property_id") propertyId: String? = null,
        @Query("status") status: String? = null,
        @Query("search") search: String? = null
    ): Response<ApiResponse<List<Reservation>>>

    @GET("reservations/{id}")
    suspend fun getReservationDetails(
        @Path("id") reservationId: String
    ): Response<ApiResponse<Reservation>>

    @POST("reservations/{id}/checkin")
    suspend fun checkInReservation(
        @Path("id") reservationId: String,
        @Body body: Map<String, String> = emptyMap()
    ): Response<ApiResponse<Reservation>>

    @POST("reservations/{id}/checkout")
    suspend fun checkOutReservation(
        @Path("id") reservationId: String,
        @Body body: Map<String, String> = emptyMap()
    ): Response<ApiResponse<Reservation>>

    // -----------------------------------------------------------------------
    // Rooms & Housekeeping
    // -----------------------------------------------------------------------
    @GET("rooms")
    suspend fun getRooms(
        @Query("property_id") propertyId: String? = null
    ): Response<ApiResponse<List<Room>>>

    @PATCH("rooms/{id}/status")
    suspend fun updateRoomStatus(
        @Path("id") roomId: String,
        @Body request: UpdateRoomStatusRequest
    ): Response<ApiResponse<Room>>

    // -----------------------------------------------------------------------
    // Billing & Invoices
    // -----------------------------------------------------------------------
    @GET("billing/invoices")
    suspend fun getInvoices(
        @Query("property_id") propertyId: String? = null
    ): Response<ApiResponse<List<Invoice>>>

    // -----------------------------------------------------------------------
    // Push Notifications Registration
    // -----------------------------------------------------------------------
    @POST("push/register")
    suspend fun registerDevicePushToken(
        @Body request: RegisterDeviceRequest
    ): Response<ApiResponse<Map<String, Any>>>
}
