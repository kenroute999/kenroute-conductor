package com.kenroute.conductor;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Keeps GPS running while a trip is active, also when the app is closed or the phone is locked.
 * Android only allows that from a foreground service, which must show a notification.
 *
 * Each position goes to the backend with a trip key the web page hands over (setUpload),
 * so reporting carries on while the page is asleep and its sign-in has timed out.
 *
 * ponytail: the key lasts 24 hours and is renewed whenever the app is opened; a position
 * that fails to send is dropped, the next one replaces it.
 */
public class LocationService extends Service implements LocationListener {
    static final String ACTION_STOP = "com.kenroute.conductor.STOP_TRACKING";
    private static final String CHANNEL = "trip";
    private static final int NOTIFICATION_ID = 1;
    private static final long EVERY_MS = 15_000;
    static final String PREFS = "tracking";

    private boolean listening;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        boolean stop = intent != null && ACTION_STOP.equals(intent.getAction());
        boolean allowed = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        if (stop || !allowed) {
            stopSelf();
            return START_NOT_STICKY;
        }

        Notification notification = buildNotification("GPS is on for this trip");
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        if (!listening) {
            LocationManager manager = (LocationManager) getSystemService(LOCATION_SERVICE);
            String provider = Build.VERSION.SDK_INT >= 31 ? LocationManager.FUSED_PROVIDER : LocationManager.GPS_PROVIDER;
            manager.requestLocationUpdates(provider, EVERY_MS, 0f, this);
            listening = true;
        }
        // Sticky: if Android kills the app during a trip, tracking comes back on its own.
        return START_STICKY;
    }

    @Override
    public void onLocationChanged(Location location) {
        String time = new SimpleDateFormat("HH:mm:ss", Locale.US).format(new Date(location.getTime()));
        getSystemService(NotificationManager.class).notify(NOTIFICATION_ID, buildNotification("Last GPS fix " + time));
        upload(location);
    }

    private void upload(Location location) {
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        final String url = prefs.getString("url", null);
        final String token = prefs.getString("token", null);
        if (url == null || token == null) return;

        SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        iso.setTimeZone(TimeZone.getTimeZone("UTC"));
        final String body = String.format(Locale.US,
                "{\"latitude\":%.6f,\"longitude\":%.6f,\"accuracy\":%s,\"speed\":%s,\"heading\":%s,\"at\":\"%s\"}",
                location.getLatitude(), location.getLongitude(),
                location.hasAccuracy() ? String.format(Locale.US, "%.1f", location.getAccuracy()) : "null",
                location.hasSpeed() ? String.format(Locale.US, "%.1f", location.getSpeed()) : "null",
                location.hasBearing() ? String.format(Locale.US, "%.1f", location.getBearing()) : "null",
                iso.format(new Date(location.getTime())));

        // Network calls are not allowed on the main thread.
        new Thread(() -> {
            HttpURLConnection http = null;
            try {
                http = (HttpURLConnection) new URL(url).openConnection();
                http.setRequestMethod("POST");
                http.setConnectTimeout(8000);
                http.setReadTimeout(8000);
                http.setDoOutput(true);
                http.setRequestProperty("Content-Type", "application/json");
                http.setRequestProperty("Authorization", "Bearer " + token);
                try (OutputStream out = http.getOutputStream()) {
                    out.write(body.getBytes(StandardCharsets.UTF_8));
                }
                http.getResponseCode(); // sends the request; a refusal needs no handling here
            } catch (Exception ignored) {
                // No signal on the highway is normal.
            } finally {
                if (http != null) http.disconnect();
            }
        }).start();
    }

    private Notification buildNotification(String text) {
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(
                new NotificationChannel(CHANNEL, "Trip tracking", NotificationManager.IMPORTANCE_LOW));

        PendingIntent open = PendingIntent.getActivity(
                this, 0, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        PendingIntent stop = PendingIntent.getService(
                this, 0, new Intent(this, LocationService.class).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE);

        return new Notification.Builder(this, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentTitle("KenRoute trip in progress")
                .setContentText(text)
                .setContentIntent(open)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .addAction(new Notification.Action.Builder(null, "Stop", stop).build())
                .build();
    }

    @Override
    public void onDestroy() {
        ((LocationManager) getSystemService(LOCATION_SERVICE)).removeUpdates(this);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // Abstract before Android 11; must exist or older phones crash.
    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}

    @Override
    public void onProviderEnabled(String provider) {}

    @Override
    public void onProviderDisabled(String provider) {}
}
