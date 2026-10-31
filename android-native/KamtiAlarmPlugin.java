package com.luachsport.kamti;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.hardware.Sensor;
import android.hardware.SensorManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.OpenableColumns;
import android.provider.Settings;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONArray;
import org.json.JSONObject;

/** The web app's door to the alarm (js/alarm/bridge.js): schedule, ring state, stop / snooze / awake, permissions, sounds. */
@CapacitorPlugin(name = "KamtiAlarm", permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) })
public class KamtiAlarmPlugin extends Plugin {
    private RingState.Listener listener;

    @Override
    public void load() {
        listener = (st) -> notifyListeners("ringState", js(withFired(st)), true);
        RingState.addListener(listener);
    }

    @Override
    protected void handleOnDestroy() {
        if (listener != null) RingState.removeListener(listener);
        Sounds.stopPreview();
    }

    private static JSObject js(JSONObject o) {
        try { return new JSObject(o.toString()); } catch (Exception e) { return new JSObject(); }
    }

    private JSONObject withFired(JSONObject st) {
        try { st.put("firedOnce", AlarmStore.firedOnce(getContext())); } catch (Exception ignored) { }
        return st;
    }

    // ---------- schedule ----------
    @PluginMethod
    public void sync(PluginCall call) {
        Context c = getContext();
        JSArray arr = call.getArray("alarms");
        AlarmStore.setAlarms(c, arr == null ? new JSONArray() : arr);
        AlarmStore.clearFired(c);
        call.resolve(js(Scheduler.scheduleAll(c)));
    }

    @PluginMethod
    public void test(PluginCall call) {
        Context c = getContext();
        JSObject a = call.getObject("alarm", new JSObject());
        int delay = Math.max(2, call.getInt("delay", 5));
        AlarmStore.setTestAlarm(c, a);
        long at = System.currentTimeMillis() + delay * 1000L;
        Scheduler.at(c, at, Scheduler.receiverPi(c, Scheduler.CODE_TEST, AlarmReceiver.RING, AlarmStore.TEST_ID));
        JSObject r = new JSObject();
        r.put("at", at);
        call.resolve(r);
    }

    // ---------- the ring ----------
    @PluginMethod
    public void getState(PluginCall call) { call.resolve(js(withFired(RingState.toJson(getContext())))); }

    /** The tasks are done. The awake check (if the alarm has one) is set for later. */
    @PluginMethod
    public void dismiss(PluginCall call) {
        Context c = getContext();
        long checkAt = 0;
        if ("ring".equals(RingState.mode(c)) && !RingState.isTest(c)) {
            int min = RingState.alarm(c).optInt("check", 0);
            if (min > 0) {
                checkAt = System.currentTimeMillis() + min * 60000L;
                Scheduler.at(c, checkAt, Scheduler.receiverPi(c, Scheduler.CODE_CHECK, AlarmReceiver.CHECK, null));
            }
        }
        RingState.idle(c, checkAt);
        AlarmService.stop(c);
        JSObject r = new JSObject();
        r.put("mode", "idle");
        r.put("checkAt", checkAt);
        call.resolve(r);
    }

    @PluginMethod
    public void snooze(PluginCall call) {
        Context c = getContext();
        if (!"ring".equals(RingState.mode(c)) || RingState.getInt(c, "snoozesLeft") <= 0) { call.reject("no-snooze"); return; }
        int min = Math.max(1, RingState.alarm(c).optInt("snoozeMin", 5));
        long until = System.currentTimeMillis() + min * 60000L;
        RingState.snooze(c, until);
        Scheduler.at(c, until, Scheduler.receiverPi(c, Scheduler.CODE_SNOOZE, AlarmReceiver.SNOOZE_END, null));
        AlarmService.stop(c);
        JSObject r = new JSObject();
        r.put("mode", "snooze");
        r.put("until", until);
        call.resolve(r);
    }

    @PluginMethod
    public void confirmAwake(PluginCall call) {
        Context c = getContext();
        if ("check".equals(RingState.mode(c))) {
            RingState.idle(c, 0);
            AlarmService.stop(c);
        }
        Scheduler.cancel(c, Scheduler.CODE_CHECK, AlarmReceiver.CHECK);
        JSObject r = new JSObject();
        r.put("mode", "idle");
        call.resolve(r);
    }

    // ---------- what this phone or player has ----------
    @PluginMethod
    public void device(PluginCall call) {
        Context c = getContext();
        PackageManager pm = c.getPackageManager();
        SensorManager sm = (SensorManager) c.getSystemService(Context.SENSOR_SERVICE);
        JSObject r = new JSObject();
        r.put("camera", pm.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY));
        r.put("accel", sm != null && sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) != null);
        r.put("sdk", Build.VERSION.SDK_INT);
        r.put("model", (Build.MANUFACTURER + " " + Build.MODEL).trim());
        call.resolve(r);
    }

    /** true / false for each permission; left out when this Android version doesn't need it. */
    @PluginMethod
    public void permissions(PluginCall call) {
        Context c = getContext();
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        JSObject r = new JSObject();
        boolean notif = nm == null || nm.areNotificationsEnabled();
        if (Build.VERSION.SDK_INT >= 33) notif = notif && getPermissionState("notifications") == PermissionState.GRANTED;
        r.put("notifications", notif);
        if (Build.VERSION.SDK_INT >= 31) {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            r.put("exact", am != null && am.canScheduleExactAlarms());
        }
        if (Build.VERSION.SDK_INT >= 34 && nm != null) r.put("fullScreen", nm.canUseFullScreenIntent());
        r.put("overlay", Settings.canDrawOverlays(c));
        PowerManager pw = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
        r.put("battery", pw == null || pw.isIgnoringBatteryOptimizations(c.getPackageName()));
        call.resolve(r);
    }

    /** Opens the right phone screen for one permission (or asks, for notifications). */
    @PluginMethod
    public void request(PluginCall call) {
        Context c = getContext();
        String what = call.getString("what", "");
        Uri pkg = Uri.parse("package:" + c.getPackageName());
        SharedPreferences sp = c.getSharedPreferences("kamti_perm", Context.MODE_PRIVATE);
        Intent i = null;
        switch (what) {
            case "notifications":
                if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED && !sp.getBoolean("askedNotif", false)) {
                    sp.edit().putBoolean("askedNotif", true).apply();
                    requestPermissionForAlias("notifications", call, "notificationsAnswered");
                    return;
                }
                if (Build.VERSION.SDK_INT >= 26) i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, c.getPackageName());
                break;
            case "exact":
                if (Build.VERSION.SDK_INT >= 31) i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, pkg);
                break;
            case "fullScreen":
                if (Build.VERSION.SDK_INT >= 34) i = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, pkg);
                break;
            case "overlay":
                i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, pkg);
                break;
            case "battery":
                i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, pkg);
                break;
            default:
                break;
        }
        open(i);
        call.resolve();
    }

    @PermissionCallback
    private void notificationsAnswered(PluginCall call) { call.resolve(); }

    // Some players and kosher phones don't have every settings screen: then the app's own details page.
    private void open(Intent i) {
        Context c = getContext();
        if (i != null) {
            try { i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); c.startActivity(i); return; } catch (Exception ignored) { }
        }
        try {
            c.startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + c.getPackageName())).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (Exception ignored) { }
    }

    // ---------- sounds ----------
    @PluginMethod
    public void preview(PluginCall call) {
        Sounds.preview(getContext(), call.getObject("sound", new JSObject()));
        call.resolve();
    }

    @PluginMethod
    public void stopPreview(PluginCall call) {
        Sounds.stopPreview();
        call.resolve();
    }

    /** A song or recording from the phone's files, kept readable for when the alarm rings. */
    @PluginMethod
    public void pickSound(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("audio/*");
        if (i.resolveActivity(getContext().getPackageManager()) == null) i = new Intent(Intent.ACTION_GET_CONTENT).addCategory(Intent.CATEGORY_OPENABLE).setType("audio/*");
        try { startActivityForResult(call, i, "soundPicked"); } catch (Exception e) { call.reject("no-picker"); }
    }

    @ActivityCallback
    private void soundPicked(PluginCall call, ActivityResult result) {
        JSObject r = new JSObject();
        Intent data = result.getData();
        Uri uri = data == null ? null : data.getData();
        if (uri == null) { r.put("cancelled", true); call.resolve(r); return; }
        Context c = getContext();
        try { c.getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION); } catch (Exception ignored) { }
        String name = "";
        try (Cursor cur = c.getContentResolver().query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (cur != null && cur.moveToFirst()) name = cur.getString(0);
        } catch (Exception ignored) { }
        if (name == null) name = "";
        r.put("uri", uri.toString());
        r.put("name", name.replaceAll("\\.[A-Za-z0-9]{2,4}$", ""));
        call.resolve(r);
    }
}
