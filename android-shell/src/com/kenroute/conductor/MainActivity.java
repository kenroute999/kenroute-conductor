package com.kenroute.conductor;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/**
 * Thin Android shell around the conductor web app.
 *
 * ponytail: loads the dev server through `adb reverse`, so it needs the USB cable and the
 * laptop. Once the backend and app are deployed, change APP_URL to the https address (and
 * drop usesCleartextTraffic from the manifest); nothing else here needs to change.
 */
public class MainActivity extends Activity {
    private static final String APP_URL = "http://localhost:3003";
    private static final int CAMERA_REQUEST = 1;
    private static final int SETUP_REQUEST = 2;

    private WebView web;
    private PermissionRequest pendingCamera;
    private int setupStep;
    /** What the web page last asked for; applied again once location is allowed. */
    private boolean wantTracking;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        setContentView(web);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true); // the app keeps its session in localStorage
        settings.setMediaPlaybackRequiresUserGesture(false); // camera preview starts on its own

        web.setWebViewClient(new WebViewClient() {
            // A WebView only opens web pages. Links like tel: (call a passenger) are handed to
            // Android, which opens the phone's dialer with the number filled in.
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String scheme = request.getUrl().getScheme();
                if ("http".equals(scheme) || "https".equals(scheme)) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, request.getUrl()));
                } catch (ActivityNotFoundException e) {
                    Toast.makeText(MainActivity.this, "No app on this phone can open that", Toast.LENGTH_SHORT).show();
                }
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!request.isForMainFrame()) return;
                view.loadData(
                        "<body style='font-family:sans-serif;padding:32px;text-align:center'>"
                                + "<h2>Cannot reach KenRoute</h2>"
                                + "<p>Connect the USB cable to the laptop and make sure the servers are running.</p>"
                                + "<p><a href='" + APP_URL + "' style='font-size:20px'>Try again</a></p></body>",
                        "text/html", "utf-8");
            }
        });

        // The web page asks for the camera (QR scanner); Android must grant it to this app first.
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                boolean wantsCamera = false;
                for (String resource : request.getResources()) {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) wantsCamera = true;
                }
                if (!wantsCamera) {
                    request.deny();
                } else if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                    request.grant(new String[] {PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                } else {
                    pendingCamera = request;
                    requestPermissions(new String[] {Manifest.permission.CAMERA}, CAMERA_REQUEST);
                }
            }
        });

        // The page calls window.KenRouteNative.setTracking(true/false) as a trip starts and ends.
        web.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void setTracking(final boolean on) {
                runOnUiThread(() -> applyTracking(on));
            }
        }, "KenRouteNative");

        if (savedInstanceState == null) web.loadUrl(APP_URL);
        startSetup();
    }

    /** First open: say why, then let Android ask for notifications, location, and "all the time". */
    private void startSetup() {
        final SharedPreferences prefs = getPreferences(MODE_PRIVATE);
        if (prefs.getBoolean("explained", false)) {
            askNextPermission();
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle("Allow location and notifications")
                .setMessage("KenRoute shares the bus location with passengers during your trip, "
                        + "also when this app is closed or the phone is locked.\n\n"
                        + "On the next screens please choose:\n"
                        + "1. Notifications: Allow\n"
                        + "2. Location: While using the app\n"
                        + "3. Location: Allow all the time\n\n"
                        + "Location is only read while you have an active trip.")
                .setCancelable(false)
                .setPositiveButton("Continue", (dialog, which) -> {
                    prefs.edit().putBoolean("explained", true).apply();
                    askNextPermission();
                })
                .show();
    }

    // Android shows one permission screen at a time, and "all the time" may only be asked
    // after normal location is allowed, so these run in order.
    private void askNextPermission() {
        while (setupStep < 3) {
            int step = setupStep++;
            if (step == 0 && Build.VERSION.SDK_INT >= 33 && !has(Manifest.permission.POST_NOTIFICATIONS)) {
                requestPermissions(new String[] {Manifest.permission.POST_NOTIFICATIONS}, SETUP_REQUEST);
                return;
            }
            if (step == 1 && !has(Manifest.permission.ACCESS_FINE_LOCATION)) {
                requestPermissions(
                        new String[] {Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                        SETUP_REQUEST);
                return;
            }
            if (step == 2 && Build.VERSION.SDK_INT >= 29
                    && has(Manifest.permission.ACCESS_FINE_LOCATION)
                    && !has(Manifest.permission.ACCESS_BACKGROUND_LOCATION)) {
                requestPermissions(new String[] {Manifest.permission.ACCESS_BACKGROUND_LOCATION}, SETUP_REQUEST);
                return;
            }
        }
        if (wantTracking) applyTracking(true);
    }

    private boolean has(String permission) {
        return checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED;
    }

    private void applyTracking(boolean on) {
        wantTracking = on;
        Intent service = new Intent(this, LocationService.class);
        if (!on) {
            stopService(service);
        } else if (has(Manifest.permission.ACCESS_FINE_LOCATION)) {
            if (Build.VERSION.SDK_INT >= 26) startForegroundService(service);
            else startService(service);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        if (requestCode == SETUP_REQUEST) {
            askNextPermission();
            return;
        }
        if (requestCode != CAMERA_REQUEST || pendingCamera == null) return;
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
            pendingCamera.grant(new String[] {PermissionRequest.RESOURCE_VIDEO_CAPTURE});
        } else {
            pendingCamera.deny();
        }
        pendingCamera = null;
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
