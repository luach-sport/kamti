package com.luachsport.kamti;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Everything that has to happen at a time goes through AlarmManager.setAlarmClock(): the exact, reliable kind
 * that wakes the phone from deep sleep and shows the alarm icon. Used for the alarms themselves, the awake
 * check, the end of a snooze, a test ring, and ringing again after the phone restarts.
 */
final class Scheduler {
    static final int CODE_CHECK = 900001, CODE_SNOOZE = 900002, CODE_AGAIN = 900003, CODE_TEST = 900004, CODE_MISSED = 900005;

    private Scheduler() {}

    static PendingIntent receiverPi(Context c, int code, String action, String id) {
        Intent i = new Intent(c, AlarmReceiver.class).setAction(action);
        if (id != null) i.putExtra("id", id);
        return PendingIntent.getBroadcast(c, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static PendingIntent openAppPi(Context c) {
        Intent i = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, 7, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static boolean canExact(Context c) {
        if (Build.VERSION.SDK_INT < 31) return true;
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        return am != null && am.canScheduleExactAlarms();
    }

    /** Sets one moment. Without the exact-alarm permission it still sets it, only less precisely. */
    static void at(Context c, long when, PendingIntent pi) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        try {
            if (canExact(c)) { am.setAlarmClock(new AlarmManager.AlarmClockInfo(when, openAppPi(c)), pi); return; }
        } catch (SecurityException ignored) { }
        if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
        else am.set(AlarmManager.RTC_WAKEUP, when, pi);
    }

    static void cancel(Context c, int code, String action) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(receiverPi(c, code, action, null));
    }

    /** Sets every alarm that is on to its next time (and clears the ones that are off). Returns { next, nextId }. */
    static JSONObject scheduleAll(Context c) {
        JSONArray arr = AlarmStore.alarms(c);
        JSONObject scheduled = new JSONObject();
        long now = System.currentTimeMillis(), best = 0;
        String bestId = "";
        for (int i = 0; i < arr.length(); i++) {
            JSONObject a = arr.optJSONObject(i);
            if (a == null) continue;
            String id = a.optString("id", "");
            if (id.isEmpty()) continue;
            int code = AlarmStore.code(c, id);
            long t = a.optBoolean("on", true) ? AlarmMath.next(a, now) : 0;
            if (t > 0) {
                at(c, t, receiverPi(c, code, AlarmReceiver.RING, id));
                try { scheduled.put(id, t); } catch (Exception ignored) { }
                if (best == 0 || t < best) { best = t; bestId = id; }
            } else {
                cancel(c, code, AlarmReceiver.RING);
            }
        }
        // Alarms that were deleted in the app: cancel their old request codes too.
        JSONObject old = AlarmStore.scheduled(c);
        JSONArray names = old.names();
        if (names != null) {
            for (int i = 0; i < names.length(); i++) {
                String id = names.optString(i);
                if (!scheduled.has(id)) cancel(c, AlarmStore.code(c, id), AlarmReceiver.RING);
            }
        }
        AlarmStore.setScheduled(c, scheduled);
        JSONObject r = new JSONObject();
        try { r.put("next", best); r.put("nextId", bestId); } catch (Exception ignored) { }
        return r;
    }
}
