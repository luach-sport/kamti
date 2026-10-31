package com.luachsport.kamti;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Android forgets every AlarmManager alarm when the phone restarts, and after an update or a clock change
 * the times move. Here everything is set again, and:
 *  - if the alarm was ringing (or checking) when the phone was turned off, it rings again right away;
 *  - if an alarm's time passed while the phone was off (in the last hour), it rings now;
 *  - a snooze or an awake check that was waiting still comes.
 * Ringing goes through AlarmManager a few seconds later (not straight from here), which Android allows.
 */
public class BootReceiver extends BroadcastReceiver {
    private static final long MISSED_WINDOW = 60 * 60 * 1000L;

    @Override
    public void onReceive(Context c, Intent intent) {
        String action = intent.getAction();
        if (action == null) return;
        long now = System.currentTimeMillis();
        boolean boot = Intent.ACTION_BOOT_COMPLETED.equals(action) || "android.intent.action.QUICKBOOT_POWERON".equals(action);

        String missedId = boot ? missed(c, now) : null;
        Scheduler.scheduleAll(c);

        String mode = RingState.mode(c);
        if (RingState.active(c)) {
            Scheduler.at(c, now + 3000, Scheduler.receiverPi(c, Scheduler.CODE_AGAIN, AlarmReceiver.AGAIN, null));
            return;
        }
        if ("snooze".equals(mode)) {
            long until = Math.max(RingState.getLong(c, "until"), now + 3000);
            Scheduler.at(c, until, Scheduler.receiverPi(c, Scheduler.CODE_SNOOZE, AlarmReceiver.SNOOZE_END, null));
            return;
        }
        long checkAt = RingState.getLong(c, "checkAt");
        if (checkAt > 0) Scheduler.at(c, Math.max(checkAt, now + 3000), Scheduler.receiverPi(c, Scheduler.CODE_CHECK, AlarmReceiver.CHECK, null));
        if (missedId != null) Scheduler.at(c, now + 3000, Scheduler.receiverPi(c, Scheduler.CODE_MISSED, AlarmReceiver.RING, missedId));
    }

    /** An alarm whose time came while the phone was off (within the last hour), or null. */
    private static String missed(Context c, long now) {
        JSONObject sch = AlarmStore.scheduled(c);
        JSONArray names = sch.names();
        if (names == null) return null;
        String best = null;
        long bestT = 0;
        for (int i = 0; i < names.length(); i++) {
            String id = names.optString(i);
            long t = sch.optLong(id, 0);
            if (t > 0 && t <= now && now - t < MISSED_WINDOW && t > bestT) { best = id; bestT = t; }
        }
        return best;
    }
}
