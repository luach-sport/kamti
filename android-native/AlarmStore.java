package com.luachsport.kamti;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The alarms as the app last sent them (so they ring and survive a restart even when the app is closed),
 * which request code each one uses with AlarmManager, and when each was last scheduled.
 */
final class AlarmStore {
    private static final String PREFS = "kamti_alarms";
    static final String TEST_ID = "__test__";

    private AlarmStore() {}

    private static SharedPreferences p(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static JSONArray alarms(Context c) {
        try { return new JSONArray(p(c).getString("alarms", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    static void setAlarms(Context c, JSONArray arr) { p(c).edit().putString("alarms", arr.toString()).apply(); }

    static JSONObject alarm(Context c, String id) {
        if (TEST_ID.equals(id)) return testAlarm(c);
        JSONArray arr = alarms(c);
        for (int i = 0; i < arr.length(); i++) {
            JSONObject a = arr.optJSONObject(i);
            if (a != null && id != null && id.equals(a.optString("id"))) return a;
        }
        return null;
    }

    /** A one-time alarm that rang turns off (the app reads `firedOnce` and turns it off there too). */
    static void turnOff(Context c, String id) {
        JSONArray arr = alarms(c);
        for (int i = 0; i < arr.length(); i++) {
            JSONObject a = arr.optJSONObject(i);
            if (a != null && id.equals(a.optString("id"))) { try { a.put("on", false); } catch (Exception ignored) { } }
        }
        setAlarms(c, arr);
        JSONArray fired = firedOnce(c);
        fired.put(id);
        p(c).edit().putString("firedOnce", fired.toString()).apply();
    }

    static JSONArray firedOnce(Context c) {
        try { return new JSONArray(p(c).getString("firedOnce", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    static void clearFired(Context c) { p(c).edit().remove("firedOnce").apply(); }

    static JSONObject testAlarm(Context c) {
        try { return new JSONObject(p(c).getString("test", "{}")); } catch (Exception e) { return null; }
    }

    static void setTestAlarm(Context c, JSONObject a) { p(c).edit().putString("test", a.toString()).apply(); }

    /** A stable AlarmManager request code for each alarm id (codes from 1000 up). */
    static int code(Context c, String id) {
        SharedPreferences sp = p(c);
        try {
            JSONObject codes = new JSONObject(sp.getString("codes", "{}"));
            if (codes.has(id)) return codes.getInt(id);
            int next = sp.getInt("nextCode", 1000);
            codes.put(id, next);
            sp.edit().putString("codes", codes.toString()).putInt("nextCode", next + 1).apply();
            return next;
        } catch (Exception e) {
            return 1000 + Math.abs(id.hashCode() % 50000);
        }
    }

    /** id → time it was scheduled for (to notice an alarm missed while the phone was off). */
    static JSONObject scheduled(Context c) {
        try { return new JSONObject(p(c).getString("scheduled", "{}")); } catch (Exception e) { return new JSONObject(); }
    }

    static void setScheduled(Context c, JSONObject o) { p(c).edit().putString("scheduled", o.toString()).apply(); }
}
