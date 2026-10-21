package novaxai.hotelflexi.data.api

import android.content.Context
import novaxai.hotelflexi.data.repository.SessionManager
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    private const val PRIMARY_BASE_URL = "https://hotelflexi.divyansh-shukla.workers.dev/api/v1/"
    private const val FALLBACK_BASE_URL = "https://hotelflexi.com/api/v1/"

    private var retrofit: Retrofit? = null
    private var apiService: HotelFlexiApiService? = null

    fun getService(context: Context): HotelFlexiApiService {
        if (apiService == null) {
            val sessionManager = SessionManager(context.applicationContext)

            val authInterceptor = Interceptor { chain ->
                val originalRequest = chain.request()
                val requestBuilder = originalRequest.newBuilder()
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "HotelFlexi-Android/2.0.0")

                // Inject Bearer token if logged in
                val token = sessionManager.getAuthToken()
                if (!token.isNullOrBlank()) {
                    requestBuilder.header("Authorization", "Bearer $token")
                }

                // Inject active Property ID & Tenant ID headers
                val propertyId = sessionManager.getActivePropertyId()
                if (!propertyId.isNullOrBlank()) {
                    requestBuilder.header("X-Property-Id", propertyId)
                }

                chain.proceed(requestBuilder.build())
            }

            val loggingInterceptor = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            val okHttpClient = OkHttpClient.Builder()
                .addInterceptor(authInterceptor)
                .addInterceptor(loggingInterceptor)
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(20, TimeUnit.SECONDS)
                .writeTimeout(20, TimeUnit.SECONDS)
                .build()

            retrofit = Retrofit.Builder()
                .baseUrl(PRIMARY_BASE_URL)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            apiService = retrofit!!.create(HotelFlexiApiService::class.java)
        }
        return apiService!!
    }
}
