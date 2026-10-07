package com.kenroute.conductor;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

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

    private WebView web;
    private PermissionRequest pendingCamera;

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

        if (savedInstanceState == null) web.loadUrl(APP_URL);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
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
