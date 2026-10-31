package com.luachsport.kamti;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;

/**
 * What the alarm is doing right now, saved so it survives the app being closed or the phone restarting:
 *   idle   – nothing (checkAt > 0 when an awake check is waiting)
 *   ring   – ringing; only the tasks stop it
 *   check  – "are you awake?" (checkEndsAt); no answer → ring again
 *   snooze – snoozed until `until`
 * Listeners (the plugin → the web app, MainActivity → lock-screen window) hear every change.
 */
final class RingState {
    private static final String PREFS = "kamti_ring";
    interface Listener { void onChange(JSONObject state); }
    private static final List<Listener> listeners = new ArrayList<>();
    private static volatile String cachedMode = null;

    private RingState() {}

    private static SharedPreferences p(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static String mode(Context c) {
        if (cachedMode == null) cachedMode = p(c).getString("mode", "idle");
        return cachedMode;
    }

    /** Ringing or checking: the screen shows over the lock screen and the keys are locked. */
    static boolean active(Context c) {
        String m = mode(c);
        return "ring".equals(m) || "check".equals(m);
    }

    static JSONObject alarm(Context c) {
        try { return new JSONObject(p(c).getString("alarm", "{}")); } catch (Exception e) { return new JSONObject(); }
    }

    static long getLong(Context c, String k) { return p(c).getLong(k, 0); }
    static int getInt(Context c, String k) { return p(c).getInt(k, 0); }
    static boolean isTest(Context c) { return p(c).getBoolean("test", false); }

    /** A new morning starts ringing (fresh), or the same morning rings again (after a snooze / a missed check). */
    static void ring(Context c, JSONObject alarm, boolean test, boolean fresh) {
        long now = System.currentTimeMillis();
        SharedPreferences.Editor e = p(c).edit();
        e.putString("mode", "ring").putLong("startedAt", now).putLong("checkAt", 0).putLong("checkEndsAt", 0).putLong("until", 0);
        if (fresh) {
            e.putString("alarm", alarm.toString()).putBoolean("test", test).putLong("ringAt", now)
                .putInt("snoozesLeft", test ? 0 : alarm.optInt("snooze", 0)).putInt("snoozeCount", 0).putInt("round", 0);
        }
        e.apply();
        set("ring");
    }

    static void again(Context c) {
        p(c).edit().putInt("round", getInt(c, "round") + 1).apply();
        ring(c, alarm(c), isTest(c), false);
    }

    static void check(Context c, long endsAt) {
        p(c).edit().putString("mode", "check").putLong("startedAt", System.currentTimeMillis()).putLong("checkEndsAt", endsAt).putLong("checkAt", 0).apply();
        set("check");
    }

    static void snooze(Context c, long until) {
        p(c).edit().putString("mode", "snooze").putLong("until", until)
            .putInt("snoozesLeft", Math.max(0, getInt(c, "snoozesLeft") - 1)).putInt("snoozeCount", getInt(c, "snoozeCount") + 1).apply();
        set("snooze");
    }

    /** checkAt: when the awake check comes (0 = none). */
    static void idle(Context c, long checkAt) {
        p(c).edit().putString("mode", "idle").putLong("checkAt", checkAt).putLong("checkEndsAt", 0).putLong("until", 0).apply();
        set("idle");
    }

    private static void set(String mode) { cachedMode = mode; }

    static JSONObject toJson(Context c) {
        JSONObject o = new JSONObject();
        SharedPreferences sp = p(c);
        try {
            JSONObject a = alarm(c);
            o.put("mode", mode(c));
            o.put("alarmId", a.optString("id", ""));
            o.put("alarm", a);
            o.put("test", sp.getBoolean("test", false));
            o.put("startedAt", sp.getLong("startedAt", 0));
            o.put("ringAt", sp.getLong("ringAt", 0));
            o.put("snoozesLeft", sp.getInt("snoozesLeft", 0));
            o.put("snoozeCount", sp.getInt("snoozeCount", 0));
            o.put("round", sp.getInt("round", 0));
            o.put("until", sp.getLong("until", 0));
            o.put("checkAt", sp.getLong("checkAt", 0));
            o.put("checkEndsAt", sp.getLong("checkEndsAt", 0));
        } catch (Exception ignored) { }
        return o;
    }

    static synchronized void addListener(Listener l) { if (!listeners.contains(l)) listeners.add(l); }
    static synchronized void removeListener(Listener l) { listeners.remove(l); }

    /** Tell everyone (on the main thread). */
    static void changed(final Context c) {
        final JSONObject st = toJson(c);
        new Handler(Looper.getMainLooper()).post(() -> {
            List<Listener> copy;
            synchronized (RingState.class) { copy = new ArrayList<>(listeners); }
            for (Listener l : copy) {
                try { l.onChange(st); } catch (Exception ignored) { }
            }
        });
    }
}
