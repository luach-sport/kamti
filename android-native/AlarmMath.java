package com.luachsport.kamti;

import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONObject;

/** When an alarm rings next. The same rule as KM.nextRing in www/js/core/dates.js. */
final class AlarmMath {
    private AlarmMath() {}

    /** days: 0 = Sunday … 6 = Saturday; empty = once. Returns 0 when there is no next time. */
    static long next(JSONObject a, long from) {
        if (a == null) return 0;
        int h = a.optInt("h", 6), m = a.optInt("m", 30);
        long skipUntil = a.optLong("skipUntil", 0);
        JSONArray days = a.optJSONArray("days");
        boolean any = days == null || days.length() == 0;
        Calendar base = Calendar.getInstance();
        base.setTimeInMillis(from);
        base.set(Calendar.HOUR_OF_DAY, 0);
        base.set(Calendar.MINUTE, 0);
        base.set(Calendar.SECOND, 0);
        base.set(Calendar.MILLISECOND, 0);
        for (int d = 0; d <= 15; d++) {
            Calendar c = (Calendar) base.clone();
            c.add(Calendar.DAY_OF_MONTH, d);
            c.set(Calendar.HOUR_OF_DAY, h);
            c.set(Calendar.MINUTE, m);
            long t = c.getTimeInMillis();
            if (t <= from) continue;
            if (skipUntil > 0 && t <= skipUntil) continue;
            if (!any && !contains(days, c.get(Calendar.DAY_OF_WEEK) - 1)) continue;
            return t;
        }
        return 0;
    }

    private static boolean contains(JSONArray arr, int v) {
        for (int i = 0; i < arr.length(); i++) if (arr.optInt(i, -1) == v) return true;
        return false;
    }

    static boolean once(JSONObject a) {
        JSONArray days = a.optJSONArray("days");
        return days == null || days.length() == 0;
    }
}
