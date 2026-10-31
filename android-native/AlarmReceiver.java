package com.luachsport.kamti;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONObject;

/** AlarmManager calls here at the set time: an alarm, a test ring, the awake check, the end of a snooze, or ringing again after a restart. */
public class AlarmReceiver extends BroadcastReceiver {
    static final String RING = "com.luachsport.kamti.RING";
    static final String CHECK = "com.luachsport.kamti.CHECK";
    static final String SNOOZE_END = "com.luachsport.kamti.SNOOZE_END";
    static final String AGAIN = "com.luachsport.kamti.AGAIN";

    @Override
    public void onReceive(Context c, Intent intent) {
        String action = intent.getAction();
        if (action == null) return;
        String id = intent.getStringExtra("id");
        switch (action) {
            case RING: {
                boolean test = AlarmStore.TEST_ID.equals(id);
                JSONObject a = AlarmStore.alarm(c, id);
                if (a == null || (!test && !a.optBoolean("on", true))) return;
                if (!test && AlarmMath.once(a)) AlarmStore.turnOff(c, id);
                if (!test) Scheduler.scheduleAll(c);
                // Already ringing for another alarm: that one keeps going (its task covers both).
                if ("ring".equals(RingState.mode(c))) return;
                RingState.ring(c, a, test, true);
                AlarmService.start(c);
                break;
            }
            case SNOOZE_END:
                if (!"snooze".equals(RingState.mode(c))) return;
                RingState.ring(c, RingState.alarm(c), RingState.isTest(c), false);
                AlarmService.start(c);
                break;
            case CHECK:
                if (!"idle".equals(RingState.mode(c)) || RingState.getLong(c, "checkAt") == 0) return;
                RingState.check(c, System.currentTimeMillis() + AlarmService.CHECK_MS);
                AlarmService.start(c);
                break;
            case AGAIN:
                // After a restart: whatever was going on (ringing, checking) continues.
                if (RingState.active(c)) {
                    if ("check".equals(RingState.mode(c))) RingState.again(c);
                    AlarmService.start(c);
                }
                break;
            default:
                break;
        }
    }
}
