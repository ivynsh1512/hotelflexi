package in.novaxai.hotelflexi;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Vibrator;
import android.view.View;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {
    private static final int PERMISSION_REQ_CODE = 1001;
    private static final int FILE_CHOOSER_REQ_CODE = 2001;
    private static final String DEFAULT_LAUNCH_URL = "https://hotelflexi.com/login";

    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private LinearLayout layoutOffline;
    private Button btnRetryOffline;

    private LinearLayout layoutSirenAlert;
    private TextView tvSirenTitle;
    private TextView tvSirenSubtitle;
    private Button btnPickTask;
    private Button btnStopSiren;

    private ValueCallback<Uri[]> filePathCallback;
    private HotelFlexiApiClient apiClient;
    private HotelFlexiSirenEngine sirenEngine;
    private Handler pollHandler;
    private Runnable pollRunnable;

    private long backPressedTime = 0;
    private String activeSirenId = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Native Dark Luxury HotelFlexi Styling (#0A0F1D)
        getWindow().setStatusBarColor(Color.parseColor("#0A0F1D"));
        getWindow().setNavigationBarColor(Color.parseColor("#0A0F1D"));

        setContentView(R.layout.activity_main);

        apiClient = new HotelFlexiApiClient(this);
        sirenEngine = new HotelFlexiSirenEngine(this);
        pollHandler = new Handler(Looper.getMainLooper());

        initViews();
        setupWebView();
        setupSwipeRefresh();
        setupSirenAlerts();
        requestNotificationPermission();

        // Load primary HotelFlexi workspace
        loadHotelFlexi();

        // Start background polling for urgent room alerts
        setupPolling();
    }

    private void initViews() {
        webView = findViewById(R.id.webView);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        progressBar = findViewById(R.id.progressBar);
        layoutOffline = findViewById(R.id.layoutOffline);
        btnRetryOffline = findViewById(R.id.btnRetryOffline);

        layoutSirenAlert = findViewById(R.id.layoutSirenAlert);
        tvSirenTitle = findViewById(R.id.tvSirenTitle);
        tvSirenSubtitle = findViewById(R.id.tvSirenSubtitle);
        btnPickTask = findViewById(R.id.btnPickTask);
        btnStopSiren = findViewById(R.id.btnStopSiren);

        btnRetryOffline.setOnClickListener(v -> {
            layoutOffline.setVisibility(View.GONE);
            webView.reload();
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.setBackgroundColor(Color.parseColor("#0A0F1D"));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Identify as pure native app to backend and web client
        String defaultUA = settings.getUserAgentString();
        settings.setUserAgentString(defaultUA + " HotelFlexi-Native-App/1.0");

        // Expose Native Device Capabilities to Web via Javascript Bridge
        webView.addJavascriptInterface(new HotelFlexiNativeBridge(), "HotelFlexiBridge");

        // Custom WebViewClient: guarantees NO BROWSER URL BAR ever shows!
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request == null || request.getUrl() == null) return false;
                String url = request.getUrl().toString();
                return handleUrlNavigation(url);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrlNavigation(url);
            }

            private boolean handleUrlNavigation(String url) {
                if (url == null) return false;

                // Handle Telephone Calls
                if (url.startsWith("tel:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception ignored) {}
                    return true;
                }

                // Handle Email Composition
                if (url.startsWith("mailto:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_SENDTO, Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception ignored) {}
                    return true;
                }

                // Handle WhatsApp Direct Chats
                if (url.contains("wa.me") || url.startsWith("whatsapp:") || url.contains("api.whatsapp.com")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "WhatsApp is not installed on this device", Toast.LENGTH_SHORT).show();
                    }
                    return true;
                }

                // Keep all HotelFlexi internal links strictly inside the native app
                if (url.contains("hotelflexi.com") ||
                    url.contains("hotelflexi.divyansh-shukla.workers.dev") ||
                    url.contains("accounts.google.com") ||
                    url.contains("firebaseapp.com")) {
                    return false; // Load inside WebView
                }

                // For external third-party links, open via system handler without closing app
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception ignored) {
                    return false;
                }
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
                progressBar.setProgress(15);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                layoutOffline.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request != null && request.isForMainFrame()) {
                    progressBar.setVisibility(View.GONE);
                    swipeRefresh.setRefreshing(false);
                    layoutOffline.setVisibility(View.VISIBLE);
                }
            }
        });

        // Custom WebChromeClient: supports File Uploads (camera/photos) and Geolocation
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress >= 100) {
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");

                try {
                    startActivityForResult(Intent.createChooser(intent, "Select Room Photo or Document"), FILE_CHOOSER_REQ_CODE);
                } catch (ActivityNotFoundException e) {
                    MainActivity.this.filePathCallback = null;
                    Toast.makeText(MainActivity.this, "Cannot open file chooser", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }
        });
    }

    private void setupSwipeRefresh() {
        swipeRefresh.setColorSchemeColors(Color.parseColor("#2563EB"), Color.parseColor("#3B82F6"));
        swipeRefresh.setProgressBackgroundColorSchemeColor(Color.parseColor("#0A0F1D"));
        swipeRefresh.setOnRefreshListener(() -> {
            layoutOffline.setVisibility(View.GONE);
            webView.reload();
        });
    }

    private void setupSirenAlerts() {
        btnStopSiren.setOnClickListener(v -> {
            sirenEngine.stopSiren();
            layoutSirenAlert.setVisibility(View.GONE);
        });

        btnPickTask.setOnClickListener(v -> {
            sirenEngine.stopSiren();
            layoutSirenAlert.setVisibility(View.GONE);

            if (activeSirenId != null) {
                apiClient.acknowledgeSiren(activeSirenId, apiClient.getUserName(), null);
            }

            // Direct WebView navigation to staff operations console
            webView.loadUrl("https://hotelflexi.com/app/housekeeping");
        });
    }

    private void loadHotelFlexi() {
        String url = DEFAULT_LAUNCH_URL;
        try {
            int resId = getResources().getIdentifier("launchUrl", "string", getPackageName());
            if (resId != 0) {
                url = getString(resId);
            }
        } catch (Exception ignored) {}

        webView.loadUrl(url);
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        PERMISSION_REQ_CODE
                );
            }
        }
    }

    private void setupPolling() {
        pollRunnable = new Runnable() {
            @Override
            public void run() {
                checkForUrgentSirens();
                pollHandler.postDelayed(this, 15000); // Poll every 15s for instant alarm
            }
        };
        pollHandler.postDelayed(pollRunnable, 5000);
    }

    private void checkForUrgentSirens() {
        apiClient.getActiveSirens(new HotelFlexiApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray sirens) {
                if (sirens != null && sirens.length() > 0) {
                    try {
                        JSONObject topSiren = sirens.getJSONObject(0);
                        activeSirenId = topSiren.optString("id", null);
                        String room = topSiren.optString("room_number", "Room");
                        String desc = topSiren.optString("description", "Urgent request pending");

                        tvSirenTitle.setText("EMERGENCY SIREN: Room " + room);
                        tvSirenSubtitle.setText(desc);
                        layoutSirenAlert.setVisibility(View.VISIBLE);

                        if (!sirenEngine.isPlaying()) {
                            sirenEngine.startSiren();
                        }
                    } catch (Exception ignored) {}
                } else {
                    if (sirenEngine.isPlaying()) {
                        sirenEngine.stopSiren();
                    }
                    layoutSirenAlert.setVisibility(View.GONE);
                }
            }

            @Override
            public void onError(String error) {
                // Silently ignore background polling errors
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQ_CODE) {
            if (filePathCallback == null) return;
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                } else if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                }
            }
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (layoutSirenAlert.getVisibility() == View.VISIBLE) {
            sirenEngine.stopSiren();
            layoutSirenAlert.setVisibility(View.GONE);
            return;
        }

        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            if (System.currentTimeMillis() - backPressedTime < 2000) {
                super.onBackPressed();
            } else {
                backPressedTime = System.currentTimeMillis();
                Toast.makeText(this, "Press back again to exit HotelFlexi", Toast.LENGTH_SHORT).show();
            }
        }
    }

    @Override
    protected void onDestroy() {
        if (pollHandler != null && pollRunnable != null) {
            pollHandler.removeCallbacks(pollRunnable);
        }
        if (sirenEngine != null) {
            sirenEngine.stopSiren();
        }
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    /**
     * Native Bridge exposed to Web JavaScript via window.HotelFlexiBridge
     */
    public class HotelFlexiNativeBridge {
        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }

        @JavascriptInterface
        public void triggerSiren(String title, String message, String priority) {
            runOnUiThread(() -> {
                tvSirenTitle.setText(title != null ? title : "EMERGENCY STAFF SIREN");
                tvSirenSubtitle.setText(message != null ? message : "Immediate attention required");
                layoutSirenAlert.setVisibility(View.VISIBLE);
                sirenEngine.startSiren();
            });
        }

        @JavascriptInterface
        public void stopSiren() {
            runOnUiThread(() -> {
                sirenEngine.stopSiren();
                layoutSirenAlert.setVisibility(View.GONE);
            });
        }

        @JavascriptInterface
        public void vibrate(long durationMs) {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                v.vibrate(durationMs > 0 ? durationMs : 400);
            }
        }

        @JavascriptInterface
        public void showToast(String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show());
        }
    }
}
