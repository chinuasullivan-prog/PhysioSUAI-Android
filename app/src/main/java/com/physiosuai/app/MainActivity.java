package com.physiosuai.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;
    private ValueCallback<Uri[]> filePathCallback;
    private static final int FILE_CHOOSER_REQUEST = 1;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Full screen / edge-to-edge look
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#111827"));
            window.setNavigationBarColor(Color.parseColor("#111827"));
        }

        setContentView(R.layout.activity_main);

        swipeRefresh = findViewById(R.id.swipeRefresh);
        webView = findViewById(R.id.webView);

        // Swipe to refresh
        swipeRefresh.setColorSchemeColors(Color.parseColor("#ec4899"), Color.parseColor("#8b5cf6"));
        swipeRefresh.setProgressBackgroundColorSchemeColor(Color.parseColor("#1f2937"));
        swipeRefresh.setOnRefreshListener(() -> webView.reload());

        setupWebView();

        // Load the app
        webView.loadUrl("file:///android_asset/index.html");
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();

        // Core settings
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);

        // Media
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Cache
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Zoom
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        // Scale to fit
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        // User agent - pretend to be mobile Chrome
        settings.setUserAgentString("Mozilla/5.0 (Linux; Android 12; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 PhysioSUAI/8.0");

        // JavaScript bridge
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidApp");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                // Keep internal navigation inside WebView
                if (url.startsWith("file://") || url.startsWith("https://") || url.startsWith("http://")) {
                    // External links (not our app) open in browser
                    if (!url.contains("physiosuai") && !url.startsWith("file://")) {
                        // Let most links load in the WebView (app uses CDNs)
                        return false;
                    }
                    return false;
                }
                // Handle mailto, tel etc
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                } catch (Exception e) {
                    // ignore
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                swipeRefresh.setRefreshing(false);
                // Inject CSS to hide scrollbars and improve appearance
                webView.evaluateJavascript(
                    "document.documentElement.style.setProperty('--scrollbar-width', '0'); " +
                    "::-webkit-scrollbar { display: none; }",
                    null
                );
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                MainActivity.this.filePathCallback = filePathCallback;
                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    return false;
                }
                return true;
            }

            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress == 100) {
                    swipeRefresh.setRefreshing(false);
                }
            }
        });

        // Enable WebView debugging in debug builds
        WebView.setWebContentsDebuggingEnabled(false);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(
                    resultCode == Activity.RESULT_OK ?
                        WebChromeClient.FileChooserParams.parseResult(resultCode, data) :
                        null
                );
                filePathCallback = null;
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    // JavaScript bridge so your web app can call Android features
    public class AndroidBridge {
        @JavascriptInterface
        public void showToast(String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public String getAppVersion() {
            return "8.0";
        }

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }
    }
}
