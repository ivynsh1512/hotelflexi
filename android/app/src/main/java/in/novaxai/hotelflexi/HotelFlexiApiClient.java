package in.novaxai.hotelflexi;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class HotelFlexiApiClient {
    public static final String BASE_URL = "https://hotelflexi.divyansh-shukla.workers.dev/api/v1";
    private static final String PREF_NAME = "hotelflexi_prefs";
    private static final String KEY_TOKEN = "auth_token";
    private static final String KEY_TENANT_ID = "tenant_id";
    private static final String KEY_USER_NAME = "user_name";
    private static final String KEY_USER_ROLE = "user_role";

    private final Context context;
    private final SharedPreferences prefs;
    private final ExecutorService executor;
    private final Handler mainHandler;

    public interface ApiCallback<T> {
        void onSuccess(T result);
        void onError(String error);
    }

    public HotelFlexiApiClient(Context context) {
        this.context = context.getApplicationContext();
        this.prefs = this.context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        this.executor = Executors.newFixedThreadPool(4);
        this.mainHandler = new Handler(Looper.getMainLooper());
    }

    public String getToken() {
        return prefs.getString(KEY_TOKEN, "");
    }

    public void setToken(String token) {
        prefs.edit().putString(KEY_TOKEN, token).apply();
    }

    public String getTenantId() {
        return prefs.getString(KEY_TENANT_ID, "");
    }

    public void setTenantId(String tenantId) {
        prefs.edit().putString(KEY_TENANT_ID, tenantId).apply();
    }

    public String getUserName() {
        return prefs.getString(KEY_USER_NAME, "Staff Member");
    }

    public void setUserName(String name) {
        prefs.edit().putString(KEY_USER_NAME, name).apply();
    }

    public String getUserRole() {
        return prefs.getString(KEY_USER_ROLE, "housekeeping");
    }

    public void setUserRole(String role) {
        prefs.edit().putString(KEY_USER_ROLE, role).apply();
    }

    // 1. Fetch Active Urgent Sirens
    public void getActiveSirens(ApiCallback<JSONArray> callback) {
        executeRequest("GET", "/operations/complaints/active-sirens", null, new ApiCallback<JSONObject>() {
            @Override
            public void onSuccess(JSONObject result) {
                JSONArray sirens = result.optJSONArray("sirens");
                callback.onSuccess(sirens != null ? sirens : new JSONArray());
            }

            @Override
            public void onError(String error) {
                callback.onError(error);
            }
        });
    }

    // 2. Pick & Acknowledge Siren (Silences alarm on all devices)
    public void acknowledgeSiren(String id, String staffName, ApiCallback<JSONObject> callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("staffName", staffName);
            executeRequest("PATCH", "/operations/complaints/" + id + "/acknowledge", body.toString(), callback);
        } catch (Exception e) {
            callback.onError(e.getMessage());
        }
    }

    // 3. Fetch Active Unread Notifications
    public void getActiveNotifications(ApiCallback<JSONArray> callback) {
        executeRequest("GET", "/operations/notifications?view=active", null, new ApiCallback<JSONObject>() {
            @Override
            public void onSuccess(JSONObject result) {
                JSONArray notifs = result.optJSONArray("notifications");
                callback.onSuccess(notifs != null ? notifs : new JSONArray());
            }

            @Override
            public void onError(String error) {
                callback.onError(error);
            }
        });
    }

    // 4. Mark Notification Read (Removes from active list automatically)
    public void markNotificationRead(String id, ApiCallback<JSONObject> callback) {
        executeRequest("PATCH", "/operations/notifications/" + id + "/read", "{}", callback);
    }

    // 5. Fetch Rooms for Housekeeping
    public void getRooms(ApiCallback<JSONArray> callback) {
        executeRequest("GET", "/rooms", null, new ApiCallback<JSONObject>() {
            @Override
            public void onSuccess(JSONObject result) {
                JSONArray rooms = result.optJSONArray("rooms");
                callback.onSuccess(rooms != null ? rooms : new JSONArray());
            }

            @Override
            public void onError(String error) {
                callback.onError(error);
            }
        });
    }

    // 6. Update Room Housekeeping Status (e.g. clean / dirty)
    public void updateRoomStatus(String roomId, String housekeepingStatus, ApiCallback<JSONObject> callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("housekeepingStatus", housekeepingStatus);
            executeRequest("PATCH", "/rooms/" + roomId + "/status", body.toString(), callback);
        } catch (Exception e) {
            callback.onError(e.getMessage());
        }
    }

    private void executeRequest(String method, String endpoint, String jsonBody, ApiCallback<JSONObject> callback) {
        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(BASE_URL + endpoint);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod(method);
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(10000);
                conn.setRequestProperty("Accept", "application/json");
                conn.setRequestProperty("Content-Type", "application/json");

                String token = getToken();
                if (!token.isEmpty()) {
                    conn.setRequestProperty("Authorization", "Bearer " + token);
                }
                String tenant = getTenantId();
                if (!tenant.isEmpty()) {
                    conn.setRequestProperty("x-tenant-id", tenant);
                }

                if (jsonBody != null && (method.equals("POST") || method.equals("PATCH") || method.equals("PUT"))) {
                    conn.setDoOutput(true);
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
                    }
                }

                int code = conn.getResponseCode();
                InputStream is = (code >= 200 && code < 300) ? conn.getInputStream() : conn.getErrorStream();
                if (is == null) {
                    postError(callback, "Server returned response code " + code);
                    return;
                }

                BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();

                String resStr = sb.toString();
                if (code >= 200 && code < 300) {
                    JSONObject json = new JSONObject(resStr.startsWith("{") ? resStr : "{\"message\":\"ok\"}");
                    postSuccess(callback, json);
                } else {
                    postError(callback, "Error " + code + ": " + resStr);
                }

            } catch (Exception e) {
                postError(callback, e.getMessage() != null ? e.getMessage() : "Network communication error");
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        });
    }

    private <T> void postSuccess(ApiCallback<T> callback, T result) {
        mainHandler.post(() -> callback.onSuccess(result));
    }

    private <T> void postError(ApiCallback<T> callback, String error) {
        mainHandler.post(() -> callback.onError(error));
    }
}
