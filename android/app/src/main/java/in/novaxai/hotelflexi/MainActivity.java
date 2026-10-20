package in.novaxai.hotelflexi;

import android.Manifest;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {
    private static final int PERMISSION_REQ_CODE = 1001;
    private static final String PREF_MUTED = "hotelflexi_siren_muted";

    private HotelFlexiApiClient apiClient;
    private HotelFlexiSirenEngine sirenEngine;
    private Handler pollHandler;
    private Runnable pollRunnable;

    private LinearLayout mainContainer;
    private LinearLayout sirenAlertCard;
    private TextView sirenTitle;
    private TextView sirenSubtitle;
    private Button btnPickSiren;
    private Button btnMuteSiren;
    private LinearLayout notifContainer;
    private LinearLayout roomsContainer;
    private ProgressBar loadingProgress;
    private TextView emptyNotifText;

    private JSONArray currentSirens = new JSONArray();
    private boolean isMuted = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Dark Luxury HotelFlexi theme (#0A0F1D)
        getWindow().setStatusBarColor(Color.parseColor("#0A0F1D"));
        getWindow().setNavigationBarColor(Color.parseColor("#0A0F1D"));

        apiClient = new HotelFlexiApiClient(this);
        sirenEngine = new HotelFlexiSirenEngine(this);
        pollHandler = new Handler(Looper.getMainLooper());

        // Load configured mute setting (Preserve existing settings)
        SharedPreferences sp = getSharedPreferences("hotelflexi_native_prefs", MODE_PRIVATE);
        isMuted = sp.getBoolean(PREF_MUTED, false);

        // Build native layout
        buildNativeLayout();

        // Official Android 13+ runtime notification permission request
        requestNotificationPermission();

        // Setup periodic polling for real-time state synchronization
        setupPolling();
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                // Official operating system permission dialog
                ActivityCompat.requestPermissions(
                        this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        PERMISSION_REQ_CODE
                );
            } else {
                showWelcomeNotification();
            }
        } else {
            showWelcomeNotification();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQ_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "✅ Official Push Notifications Enabled!", Toast.LENGTH_SHORT).show();
                showWelcomeNotification();
            } else {
                Toast.makeText(this, "⚠️ Notifications blocked. Urgent siren alerts may not ring when minimized.", Toast.LENGTH_LONG).show();
            }
        }
    }

    private void showWelcomeNotification() {
        try {
            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, HotelFlexiSirenEngine.CHANNEL_NOTIFICATIONS)
                    .setSmallIcon(R.drawable.ic_notification_icon)
                    .setContentTitle("HotelFlexi Mobile Connected")
                    .setContentText("Hardware Urgency Siren & Real-Time Operational Alerts Active")
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .setAutoCancel(true);

            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.notify(101, builder.build());
            }
        } catch (Exception ignored) {}
    }

    private void setupPolling() {
        pollRunnable = new Runnable() {
            @Override
            public void run() {
                refreshActiveSirens();
                pollHandler.postDelayed(this, 4000); // 4-second real-time interval
            }
        };
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Immediately synchronize state when opening or returning from background
        if (pollHandler != null && pollRunnable != null) {
            pollHandler.post(pollRunnable);
        }
        refreshNotifications();
        refreshRooms();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (pollHandler != null && pollRunnable != null) {
            pollHandler.removeCallbacks(pollRunnable);
        }
        // Silence in-app siren audio if leaving app (unless foreground alert active)
        sirenEngine.stopSiren();
    }

    // 1. Refresh Active Sirens & Sync Siren Audio Engine
    private void refreshActiveSirens() {
        apiClient.getActiveSirens(new HotelFlexiApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray sirens) {
                currentSirens = sirens;
                updateSirenUI();
            }

            @Override
            public void onError(String error) {
                // Quiet fail
            }
        });
    }

    private void updateSirenUI() {
        if (currentSirens.length() > 0) {
            JSONObject s = currentSirens.optJSONObject(0);
            String room = s != null ? s.optString("room_number", "Room") : "Room";
            String desc = s != null ? s.optString("description", "Urgent housekeeping required") : "";

            sirenAlertCard.setVisibility(View.VISIBLE);
            sirenTitle.setText("🚨 URGENT DISPATCH: ROOM " + room.toUpperCase());
            sirenSubtitle.setText(desc);

            // Ring siren immediately according to configured mute setting
            if (!isMuted) {
                if (!sirenEngine.isPlaying()) {
                    sirenEngine.startSiren();
                }
            } else {
                sirenEngine.stopSiren();
            }
        } else {
            sirenAlertCard.setVisibility(View.GONE);
            sirenEngine.stopSiren();
        }
    }

    // 2. Refresh Active Unread Notifications (Requirement 3: Automatic Removal of Read Items)
    private void refreshNotifications() {
        apiClient.getActiveNotifications(new HotelFlexiApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray notifs) {
                notifContainer.removeAllViews();
                if (notifs.length() == 0) {
                    emptyNotifText.setVisibility(View.VISIBLE);
                } else {
                    emptyNotifText.setVisibility(View.GONE);
                    for (int i = 0; i < notifs.length(); i++) {
                        JSONObject n = notifs.optJSONObject(i);
                        if (n != null) {
                            addNotificationItemView(n);
                        }
                    }
                }
            }

            @Override
            public void onError(String error) {
                // Ignore
            }
        });
    }

    private void addNotificationItemView(JSONObject n) {
        String id = n.optString("id");
        String title = n.optString("title", "Operational Alert");
        String message = n.optString("message", "");

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setPadding(32, 28, 32, 28);
        card.setGravity(Gravity.CENTER_VERTICAL);

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#151D30"));
        bg.setCornerRadius(24);
        bg.setStroke(2, Color.parseColor("#233150"));
        card.setBackground(bg);

        LinearLayout textCol = new LinearLayout(this);
        textCol.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        textCol.setLayoutParams(tlp);

        TextView tvTitle = new TextView(this);
        tvTitle.setText(title);
        tvTitle.setTextColor(Color.WHITE);
        tvTitle.setTextSize(13);
        tvTitle.setTypeface(null, Typeface.BOLD);

        TextView tvMsg = new TextView(this);
        tvMsg.setText(message);
        tvMsg.setTextColor(Color.parseColor("#94A3B8"));
        tvMsg.setTextSize(11);
        tvMsg.setPadding(0, 6, 0, 0);

        textCol.addView(tvTitle);
        textCol.addView(tvMsg);

        // One-tap Dismiss / Done button (Requirement 3: Immediately remove seen item from active list)
        Button btnDone = new Button(this);
        btnDone.setText("Done ✓");
        btnDone.setTextColor(Color.parseColor("#38BDF8"));
        btnDone.setTextSize(11);
        btnDone.setTypeface(null, Typeface.BOLD);
        btnDone.setPadding(24, 12, 24, 12);

        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(Color.parseColor("#0F2844"));
        btnBg.setCornerRadius(16);
        btnBg.setStroke(1, Color.parseColor("#1E4976"));
        btnDone.setBackground(btnBg);

        btnDone.setOnClickListener(v -> {
            // 1. Immediately remove from active UI without waiting for refresh
            notifContainer.removeView(card);
            if (notifContainer.getChildCount() == 0) {
                emptyNotifText.setVisibility(View.VISIBLE);
            }
            // 2. Synchronize read status with backend
            apiClient.markNotificationRead(id, new HotelFlexiApiClient.ApiCallback<JSONObject>() {
                @Override
                public void onSuccess(JSONObject result) {
                    Toast.makeText(MainActivity.this, "Notification cleared", Toast.LENGTH_SHORT).show();
                }

                @Override
                public void onError(String error) {
                    // Retry or silent
                }
            });
        });

        card.addView(textCol);
        card.addView(btnDone);

        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        clp.setMargins(0, 0, 0, 16);
        card.setLayoutParams(clp);

        notifContainer.addView(card);
    }

    // 3. Refresh Rooms for Quick Housekeeping Status
    private void refreshRooms() {
        apiClient.getRooms(new HotelFlexiApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray rooms) {
                roomsContainer.removeAllViews();
                for (int i = 0; i < Math.min(rooms.length(), 6); i++) {
                    JSONObject r = rooms.optJSONObject(i);
                    if (r != null) {
                        addRoomItemView(r);
                    }
                }
            }

            @Override
            public void onError(String error) {
                // Ignore
            }
        });
    }

    private void addRoomItemView(JSONObject room) {
        String id = room.optString("id");
        String num = room.optString("room_number", "Room");
        String hkStatus = room.optString("housekeeping_status", "clean");
        boolean isDirty = "dirty".equalsIgnoreCase(hkStatus);

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setPadding(28, 20, 28, 20);
        row.setGravity(Gravity.CENTER_VERTICAL);

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#131B2E"));
        bg.setCornerRadius(20);
        bg.setStroke(1, isDirty ? Color.parseColor("#F59E0B") : Color.parseColor("#1E293B"));
        row.setBackground(bg);

        TextView tvNum = new TextView(this);
        tvNum.setText("Room " + num);
        tvNum.setTextColor(Color.WHITE);
        tvNum.setTextSize(13);
        tvNum.setTypeface(null, Typeface.BOLD);
        tvNum.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView tvStatus = new TextView(this);
        tvStatus.setText(isDirty ? "DIRTY / NEEDS CLEAN" : "CLEAN");
        tvStatus.setTextColor(isDirty ? Color.parseColor("#FBBF24") : Color.parseColor("#34D399"));
        tvStatus.setTextSize(10);
        tvStatus.setTypeface(null, Typeface.BOLD);
        tvStatus.setPadding(0, 0, 24, 0);

        Button btnToggle = new Button(this);
        btnToggle.setText(isDirty ? "Mark Clean" : "Mark Dirty");
        btnToggle.setTextColor(Color.WHITE);
        btnToggle.setTextSize(11);
        btnToggle.setTypeface(null, Typeface.BOLD);

        GradientDrawable tbg = new GradientDrawable();
        tbg.setColor(isDirty ? Color.parseColor("#059669") : Color.parseColor("#DC2626"));
        tbg.setCornerRadius(16);
        btnToggle.setBackground(tbg);

        btnToggle.setOnClickListener(v -> {
            String newStatus = isDirty ? "clean" : "dirty";
            apiClient.updateRoomStatus(id, newStatus, new HotelFlexiApiClient.ApiCallback<JSONObject>() {
                @Override
                public void onSuccess(JSONObject result) {
                    Toast.makeText(MainActivity.this, "Room " + num + " updated to " + newStatus, Toast.LENGTH_SHORT).show();
                    refreshRooms();
                    refreshActiveSirens();
                }

                @Override
                public void onError(String error) {
                    Toast.makeText(MainActivity.this, "Failed: " + error, Toast.LENGTH_SHORT).show();
                }
            });
        });

        row.addView(tvNum);
        row.addView(tvStatus);
        row.addView(btnToggle);

        LinearLayout.LayoutParams rlp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        rlp.setMargins(0, 0, 0, 12);
        row.setLayoutParams(rlp);

        roomsContainer.addView(row);
    }

    // Build Material Native UI Programmatically for absolute crash-freedom
    private void buildNativeLayout() {
        ScrollView scrollView = new ScrollView(this);
        scrollView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        scrollView.setBackgroundColor(Color.parseColor("#0A0F1D"));

        mainContainer = new LinearLayout(this);
        mainContainer.setOrientation(LinearLayout.VERTICAL);
        mainContainer.setPadding(40, 48, 40, 64);
        scrollView.addView(mainContainer);

        // 1. Top App Header
        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(0, 0, 0, 40);

        LinearLayout titleCol = new LinearLayout(this);
        titleCol.setOrientation(LinearLayout.VERTICAL);
        titleCol.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView tvBrand = new TextView(this);
        tvBrand.setText("HotelFlexi");
        tvBrand.setTextColor(Color.WHITE);
        tvBrand.setTextSize(22);
        tvBrand.setTypeface(null, Typeface.BOLD);

        TextView tvRole = new TextView(this);
        tvRole.setText("Native Staff Console • Android Mobile App");
        tvRole.setTextColor(Color.parseColor("#38BDF8"));
        tvRole.setTextSize(11);
        tvRole.setPadding(0, 4, 0, 0);

        titleCol.addView(tvBrand);
        titleCol.addView(tvRole);
        header.addView(titleCol);

        mainContainer.addView(header);

        // 2. Urgent Housekeeping Siren Alert Card (Visible when active urgent ticket exists)
        sirenAlertCard = new LinearLayout(this);
        sirenAlertCard.setOrientation(LinearLayout.VERTICAL);
        sirenAlertCard.setPadding(36, 36, 36, 36);

        GradientDrawable sirenBg = new GradientDrawable();
        sirenBg.setColor(Color.parseColor("#DC2626"));
        sirenBg.setCornerRadius(28);
        sirenAlertCard.setBackground(sirenBg);
        sirenAlertCard.setVisibility(View.GONE);

        sirenTitle = new TextView(this);
        sirenTitle.setText("🚨 URGENT DISPATCH: ROOM ALERT");
        sirenTitle.setTextColor(Color.WHITE);
        sirenTitle.setTextSize(15);
        sirenTitle.setTypeface(null, Typeface.BOLD);

        sirenSubtitle = new TextView(this);
        sirenSubtitle.setText("Immediate cleaning or guest assistance required.");
        sirenSubtitle.setTextColor(Color.parseColor("#FEE2E2"));
        sirenSubtitle.setTextSize(12);
        sirenSubtitle.setPadding(0, 8, 0, 24);

        LinearLayout sirenActions = new LinearLayout(this);
        sirenActions.setOrientation(LinearLayout.HORIZONTAL);

        btnPickSiren = new Button(this);
        btnPickSiren.setText("Pick & Silence Siren");
        btnPickSiren.setTextColor(Color.parseColor("#991B1B"));
        btnPickSiren.setTextSize(12);
        btnPickSiren.setTypeface(null, Typeface.BOLD);

        GradientDrawable pickBg = new GradientDrawable();
        pickBg.setColor(Color.WHITE);
        pickBg.setCornerRadius(18);
        btnPickSiren.setBackground(pickBg);

        btnPickSiren.setOnClickListener(v -> {
            if (currentSirens.length() > 0) {
                JSONObject s = currentSirens.optJSONObject(0);
                String id = s != null ? s.optString("id") : "";
                sirenEngine.stopSiren();
                apiClient.acknowledgeSiren(id, apiClient.getUserName(), new HotelFlexiApiClient.ApiCallback<JSONObject>() {
                    @Override
                    public void onSuccess(JSONObject result) {
                        Toast.makeText(MainActivity.this, "Siren silenced and task claimed!", Toast.LENGTH_SHORT).show();
                        refreshActiveSirens();
                    }

                    @Override
                    public void onError(String error) {
                        Toast.makeText(MainActivity.this, "Error: " + error, Toast.LENGTH_SHORT).show();
                    }
                });
            }
        });

        btnMuteSiren = new Button(this);
        btnMuteSiren.setText(isMuted ? "Unmute" : "Mute");
        btnMuteSiren.setTextColor(Color.WHITE);
        btnMuteSiren.setTextSize(12);
        btnMuteSiren.setPadding(24, 0, 24, 0);

        GradientDrawable muteBg = new GradientDrawable();
        muteBg.setColor(Color.parseColor("#7F1D1D"));
        muteBg.setCornerRadius(18);
        btnMuteSiren.setBackground(muteBg);

        btnMuteSiren.setOnClickListener(v -> {
            isMuted = !isMuted;
            getSharedPreferences("hotelflexi_native_prefs", MODE_PRIVATE)
                    .edit()
                    .putBoolean(PREF_MUTED, isMuted)
                    .apply();

            btnMuteSiren.setText(isMuted ? "Unmute" : "Mute");
            if (isMuted) {
                sirenEngine.stopSiren();
            } else if (currentSirens.length() > 0) {
                sirenEngine.startSiren();
            }
        });

        sirenActions.addView(btnPickSiren);
        sirenActions.addView(btnMuteSiren);

        sirenAlertCard.addView(sirenTitle);
        sirenAlertCard.addView(sirenSubtitle);
        sirenAlertCard.addView(sirenActions);

        LinearLayout.LayoutParams slp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        slp.setMargins(0, 0, 0, 32);
        sirenAlertCard.setLayoutParams(slp);

        mainContainer.addView(sirenAlertCard);

        // 3. Native Test Siren & Vibration Bar
        LinearLayout testBar = new LinearLayout(this);
        testBar.setOrientation(LinearLayout.HORIZONTAL);
        testBar.setGravity(Gravity.CENTER_VERTICAL);
        testBar.setPadding(32, 28, 32, 28);

        GradientDrawable tbb = new GradientDrawable();
        tbb.setColor(Color.parseColor("#131B2E"));
        tbb.setCornerRadius(24);
        tbb.setStroke(1, Color.parseColor("#2563EB"));
        testBar.setBackground(tbb);

        TextView tvTestDesc = new TextView(this);
        tvTestDesc.setText("Hardware Siren & Vibration Test");
        tvTestDesc.setTextColor(Color.WHITE);
        tvTestDesc.setTextSize(12);
        tvTestDesc.setTypeface(null, Typeface.BOLD);
        tvTestDesc.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        Button btnTest = new Button(this);
        btnTest.setText("Test Alarm");
        btnTest.setTextColor(Color.WHITE);
        btnTest.setTextSize(11);
        btnTest.setTypeface(null, Typeface.BOLD);

        GradientDrawable btbg = new GradientDrawable();
        btbg.setColor(Color.parseColor("#2563EB"));
        btbg.setCornerRadius(16);
        btnTest.setBackground(btbg);

        btnTest.setOnClickListener(v -> {
            btnTest.setEnabled(false);
            btnTest.setText("Ringing...");
            sirenEngine.testSiren(3500, () -> {
                btnTest.setEnabled(true);
                btnTest.setText("Test Alarm");
            });
        });

        testBar.addView(tvTestDesc);
        testBar.addView(btnTest);

        LinearLayout.LayoutParams tblp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        tblp.setMargins(0, 0, 0, 36);
        testBar.setLayoutParams(tblp);
        mainContainer.addView(testBar);

        // 4. Active In-App Notifications Section (Requirement 3)
        TextView tvNotifHeader = new TextView(this);
        tvNotifHeader.setText("ACTIVE NOTIFICATIONS");
        tvNotifHeader.setTextColor(Color.parseColor("#94A3B8"));
        tvNotifHeader.setTextSize(11);
        tvNotifHeader.setTypeface(null, Typeface.BOLD);
        tvNotifHeader.setPadding(4, 0, 0, 16);
        mainContainer.addView(tvNotifHeader);

        notifContainer = new LinearLayout(this);
        notifContainer.setOrientation(LinearLayout.VERTICAL);
        mainContainer.addView(notifContainer);

        emptyNotifText = new TextView(this);
        emptyNotifText.setText("✓ No active notifications. All caught up!");
        emptyNotifText.setTextColor(Color.parseColor("#64748B"));
        emptyNotifText.setTextSize(12);
        emptyNotifText.setPadding(8, 8, 8, 24);
        emptyNotifText.setVisibility(View.GONE);
        mainContainer.addView(emptyNotifText);

        // 5. Rooms Quick Housekeeping Roster
        TextView tvRoomsHeader = new TextView(this);
        tvRoomsHeader.setText("ROOM HOUSEKEEPING STATUS");
        tvRoomsHeader.setTextColor(Color.parseColor("#94A3B8"));
        tvRoomsHeader.setTextSize(11);
        tvRoomsHeader.setTypeface(null, Typeface.BOLD);
        tvRoomsHeader.setPadding(4, 24, 0, 16);
        mainContainer.addView(tvRoomsHeader);

        roomsContainer = new LinearLayout(this);
        roomsContainer.setOrientation(LinearLayout.VERTICAL);
        mainContainer.addView(roomsContainer);

        // 6. Launch Full Cloud PMS Console Button
        Button btnOpenConsole = new Button(this);
        btnOpenConsole.setText("Open Full PMS Dashboard →");
        btnOpenConsole.setTextColor(Color.WHITE);
        btnOpenConsole.setTextSize(13);
        btnOpenConsole.setTypeface(null, Typeface.BOLD);
        btnOpenConsole.setPadding(0, 36, 0, 36);

        GradientDrawable ocbg = new GradientDrawable();
        ocbg.setColor(Color.parseColor("#1D4ED8"));
        ocbg.setCornerRadius(24);
        btnOpenConsole.setBackground(ocbg);

        btnOpenConsole.setOnClickListener(v -> {
            Intent intent = new Intent(MainActivity.this, LauncherActivity.class);
            startActivity(intent);
        });

        LinearLayout.LayoutParams oclp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        oclp.setMargins(0, 32, 0, 0);
        btnOpenConsole.setLayoutParams(oclp);
        mainContainer.addView(btnOpenConsole);

        setContentView(scrollView);
    }
}
