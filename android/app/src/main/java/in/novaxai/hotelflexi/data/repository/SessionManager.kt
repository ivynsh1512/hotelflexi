package novaxai.hotelflexi.data.repository

import android.content.Context
import android.content.SharedPreferences
import novaxai.hotelflexi.data.model.AuthUser

class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("hotelflexi_session_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_AUTH_TOKEN = "key_auth_token"
        private const val KEY_USER_ID = "key_user_id"
        private const val KEY_USER_EMAIL = "key_user_email"
        private const val KEY_USER_NAME = "key_user_name"
        private const val KEY_USER_ROLE = "key_user_role"
        private const val KEY_TENANT_ID = "key_tenant_id"
        private const val KEY_ACTIVE_PROPERTY_ID = "key_active_property_id"
        private const val KEY_ACTIVE_PROPERTY_NAME = "key_active_property_name"
        private const val KEY_FCM_TOKEN = "key_fcm_token"
    }

    fun saveUserSession(user: AuthUser) {
        val editor = prefs.edit()
        user.token?.let { editor.putString(KEY_AUTH_TOKEN, it) }
        editor.putString(KEY_USER_ID, user.id)
        editor.putString(KEY_USER_EMAIL, user.email)
        editor.putString(KEY_USER_NAME, user.fullName ?: user.email)
        editor.putString(KEY_USER_ROLE, user.role)
        editor.putString(KEY_TENANT_ID, user.tenantId)

        // Select first property if none active
        val propId = user.propertyId ?: user.properties.firstOrNull()?.id
        val propName = user.properties.firstOrNull { it.id == propId }?.name ?: "HotelFlexi Property"
        editor.putString(KEY_ACTIVE_PROPERTY_ID, propId)
        editor.putString(KEY_ACTIVE_PROPERTY_NAME, propName)

        editor.apply()
    }

    fun getAuthToken(): String? = prefs.getString(KEY_AUTH_TOKEN, null)

    fun isLoggedIn(): Boolean = !getAuthToken().isNullOrBlank()

    fun getUserEmail(): String = prefs.getString(KEY_USER_EMAIL, "") ?: ""

    fun getUserName(): String = prefs.getString(KEY_USER_NAME, "Staff") ?: "Staff"

    fun getUserRole(): String = prefs.getString(KEY_USER_ROLE, "front_desk") ?: "front_desk"

    fun getTenantId(): String? = prefs.getString(KEY_TENANT_ID, null)

    fun getActivePropertyId(): String? = prefs.getString(KEY_ACTIVE_PROPERTY_ID, null)

    fun getActivePropertyName(): String = prefs.getString(KEY_ACTIVE_PROPERTY_NAME, "HotelFlexi Property") ?: "HotelFlexi Property"

    fun setActiveProperty(propertyId: String, propertyName: String) {
        prefs.edit()
            .putString(KEY_ACTIVE_PROPERTY_ID, propertyId)
            .putString(KEY_ACTIVE_PROPERTY_NAME, propertyName)
            .apply()
    }

    fun saveFcmToken(token: String) {
        prefs.edit().putString(KEY_FCM_TOKEN, token).apply()
    }

    fun getFcmToken(): String? = prefs.getString(KEY_FCM_TOKEN, null)

    fun clearSession() {
        prefs.edit()
            .remove(KEY_AUTH_TOKEN)
            .remove(KEY_USER_ID)
            .remove(KEY_USER_EMAIL)
            .remove(KEY_USER_NAME)
            .remove(KEY_USER_ROLE)
            .remove(KEY_TENANT_ID)
            .remove(KEY_ACTIVE_PROPERTY_ID)
            .remove(KEY_ACTIVE_PROPERTY_NAME)
            .apply()
    }
}
