package com.kenroute.conductor;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Keeps GPS running while a trip is active, also when the app is closed or the phone is locked.
 * Android only allows that from a foreground service, which must show a notification.
 *
 * ponytail: positions are read but not sent anywhere yet. Uploading belongs in
 * onLocationChanged once the backend has an endpoint for it (and a way for this service to
 * hold a login token while the web page is asleep).
 */
public class LocationService extends Service implements LocationListener {
    static final String ACTION_STOP = "com.kenroute.conductor.STOP_TRACKING";
    private static final String CHANNEL = "trip";
    private static final int NOTIFICATION_ID = 1;
    private static final long EVERY_MS = 15_000;

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
