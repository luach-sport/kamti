package com.luachsport.kamti;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.database.ContentObserver;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import org.json.JSONObject;

/**
 * Plays the alarm while RingState says "ring" or "check". Foreground service, so Android lets it run.
 *  - The alarm volume is pushed to maximum and pushed back if anything lowers it (keys, settings).
 *  - Every few seconds: if the app isn't on the screen, it is brought back (needs "display over other apps").
 *  - No answer to the awake check within a minute → ring again, with the task.
 *  - Nobody stopped it for an hour → it gives up (an empty house shouldn't ring all day).
 *  - During a phone call it goes quiet and doesn't jump over the call; it comes back when the call ends.
 * The sound only stops from the app, after the tasks (or a snooze it allows).
 */
public class AlarmService extends Service {
    static final long CHECK_MS = 60 * 1000L;
    static final long AUTO_STOP_MS = 60 * 60 * 1000L;
    private static final String CHANNEL = "kamti_ring";
    private static final int NOTIF_ID = 4242;
    private static final String ACT_STOP = "com.luachsport.kamti.STOP";

    private final Handler h = new Handler(Looper.getMainLooper());
    private MediaPlayer player;
    private Vibrator vibrator;
    private PowerManager.WakeLock wake;
    private ContentObserver volumeWatch;
    private String playing = "";      // "ring" | "check" | ""
    private int savedVolume = -1;

    /** Start (or refresh) ringing according to RingState. Safe to call from a receiver at alarm time. */
    static void start(Context c) {
        Intent i = new Intent(c, AlarmService.class);
        if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i); else c.startService(i);
        RingState.changed(c);
    }

    /** Stop the sound now (RingState was already changed by the caller). */
    static void stop(Context c) {
        try { c.startService(new Intent(c, AlarmService.class).setAction(ACT_STOP)); } catch (Exception e) {
            c.stopService(new Intent(c, AlarmService.class));
        }
        RingState.changed(c);
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String mode = RingState.mode(this);
        boolean stopAsked = intent != null && ACT_STOP.equals(intent.getAction());
        if (!stopAsked && ("ring".equals(mode) || "check".equals(mode))) {
            goForeground(mode);
            if (!mode.equals(playing)) begin(mode);
            bringAppToFront();
            return START_STICKY;
        }
        end();
        stopSelf();
        return START_NOT_STICKY;
    }

    // ---------- notification (shows the app over the lock screen) ----------
    private void goForeground(String mode) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm != null && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "השעון מצלצל", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("מופיע כשהשעון מצלצל ופותח את המשימה");
            ch.setSound(null, null);
            ch.enableVibration(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            ch.setBypassDnd(true);
            nm.createNotificationChannel(ch);
        }
        PendingIntent open = Scheduler.openAppPi(this);
        JSONObject a = RingState.alarm(this);
        String label = a.optString("label", "");
        String title = "check".equals(mode) ? "אתה עדיין ער?" : (label.isEmpty() ? "קמתי – השעון מצלצל" : "קמתי – " + label);
        String text = "check".equals(mode) ? "לוחצים \"כן, אני ער!\" תוך דקה" : "הצלצול ייפסק רק אחרי המשימה. לוחצים כאן כדי להתחיל";
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        b.setSmallIcon(getResources().getIdentifier("ic_stat_kamti", "drawable", getPackageName()))
            .setContentTitle(title).setContentText(text)
            .setCategory(Notification.CATEGORY_ALARM).setPriority(Notification.PRIORITY_MAX)
            .setOngoing(true).setAutoCancel(false).setVisibility(Notification.VISIBILITY_PUBLIC)
            .setContentIntent(open).setFullScreenIntent(open, true);
        if (Build.VERSION.SDK_INT >= 31) b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
        Notification n = b.build();
        n.flags |= Notification.FLAG_INSISTENT | Notification.FLAG_NO_CLEAR;
        try {
            if (Build.VERSION.SDK_INT >= 29) startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            else startForeground(NOTIF_ID, n);
        } catch (Exception e) {
            if (nm != null) nm.notify(NOTIF_ID, n);
        }
    }

    // ---------- sound, vibration, volume lock ----------
    private void begin(String mode) {
        stopSound();
        playing = mode;
        boolean check = "check".equals(mode);
        JSONObject a = RingState.alarm(this);
        if (wake == null) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) { wake = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "kamti:ring"); wake.setReferenceCounted(false); }
        }
        if (wake != null) wake.acquire(AUTO_STOP_MS + 60000);
        AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (am != null) {
            if (savedVolume < 0) savedVolume = am.getStreamVolume(AudioManager.STREAM_ALARM);
            maxVolume();
            watchVolume();
        }
        playSound(check ? Sounds.checkUri(this) : Sounds.uriFor(this, a.optJSONObject("sound")), true);
        if (a.optBoolean("vibrate", true) || check) vibrate(check);
        h.removeCallbacksAndMessages(null);
        h.postDelayed(watchdog, 2500);
        if (check) {
            long left = Math.max(1000, RingState.getLong(this, "checkEndsAt") - System.currentTimeMillis());
            h.postDelayed(checkTimeout, left);
        } else {
            long started = RingState.getLong(this, "startedAt");
            h.postDelayed(autoStop, Math.max(5000, started + AUTO_STOP_MS - System.currentTimeMillis()));
        }
    }

    private void playSound(Uri uri, boolean allowFallback) {
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            player.setDataSource(this, uri);
            player.setLooping(true);
            player.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
            player.prepare();
            if (!inCall(this)) player.start(); // during a call it starts when the call ends (watchdog)
        } catch (Exception e) {
            releasePlayer();
            if (allowFallback) playSound(Sounds.builtin(this, "classic"), false);
        }
    }

    private void maxVolume() {
        AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (am == null) return;
        int max = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
        int want = "check".equals(playing) ? Math.max(1, Math.round(max * 0.8f)) : max;
        try { if (am.getStreamVolume(AudioManager.STREAM_ALARM) < want) am.setStreamVolume(AudioManager.STREAM_ALARM, want, 0); } catch (Exception ignored) { }
    }

    private void watchVolume() {
        if (volumeWatch != null) return;
        volumeWatch = new ContentObserver(h) {
            @Override public void onChange(boolean selfChange) { if (!playing.isEmpty()) maxVolume(); }
        };
        try { getContentResolver().registerContentObserver(Settings.System.CONTENT_URI, true, volumeWatch); } catch (Exception ignored) { }
    }

    private void vibrate(boolean soft) {
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) return;
        long[] pattern = soft ? new long[] { 0, 300, 1700 } : new long[] { 0, 800, 500 };
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build());
            } else {
                vibrator.vibrate(pattern, 0);
            }
        } catch (Exception ignored) { }
    }

    // ---------- timers ----------
    private final Runnable watchdog = new Runnable() {
        @Override public void run() {
            if (!RingState.active(AlarmService.this)) { end(); stopSelf(); return; }
            boolean call = inCall(AlarmService.this);
            if (player != null) {
                try { if (call && player.isPlaying()) player.pause(); else if (!call && !player.isPlaying()) player.start(); } catch (Exception ignored) { }
            }
            if (!call) {
                maxVolume();
                if (!MainActivity.visible) bringAppToFront();
            }
            h.postDelayed(this, call ? 1500 : 2500);
        }
    };

    /** A phone call is ringing or going on (no permission needed to know this). */
    static boolean inCall(Context c) {
        AudioManager am = (AudioManager) c.getSystemService(Context.AUDIO_SERVICE);
        if (am == null) return false;
        int m = am.getMode();
        return m == AudioManager.MODE_IN_CALL || m == AudioManager.MODE_IN_COMMUNICATION || m == AudioManager.MODE_RINGTONE;
    }

    private final Runnable checkTimeout = () -> {
        if (!"check".equals(RingState.mode(this))) return;
        RingState.again(this);
        RingState.changed(this);
        goForeground("ring");
        begin("ring");
        bringAppToFront();
    };

    private final Runnable autoStop = () -> {
        if (!"ring".equals(RingState.mode(this))) return;
        RingState.idle(this, 0);
        RingState.changed(this);
        end();
        stopSelf();
    };

    /** Puts the app (the task) back on the screen. Android allows it with "display over other apps". */
    private void bringAppToFront() {
        if (MainActivity.visible || inCall(this)) return;
        if (Build.VERSION.SDK_INT >= 29 && !Settings.canDrawOverlays(this)) return;
        try {
            Intent i = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(i);
        } catch (Exception ignored) { }
    }

    // ---------- stopping ----------
    private void releasePlayer() {
        if (player != null) {
            try { player.stop(); } catch (Exception ignored) { }
            try { player.release(); } catch (Exception ignored) { }
            player = null;
        }
    }

    private void stopSound() {
        releasePlayer();
        if (vibrator != null) { try { vibrator.cancel(); } catch (Exception ignored) { } }
    }

    private void end() {
        h.removeCallbacksAndMessages(null);
        playing = "";
        stopSound();
        if (volumeWatch != null) { try { getContentResolver().unregisterContentObserver(volumeWatch); } catch (Exception ignored) { } volumeWatch = null; }
        AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (am != null && savedVolume >= 0) { try { am.setStreamVolume(AudioManager.STREAM_ALARM, savedVolume, 0); } catch (Exception ignored) { } }
        savedVolume = -1;
        if (wake != null && wake.isHeld()) { try { wake.release(); } catch (Exception ignored) { } }
        if (Build.VERSION.SDK_INT >= 24) stopForeground(Service.STOP_FOREGROUND_REMOVE); else stopForeground(true);
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(NOTIF_ID);
    }

    @Override
    public void onDestroy() {
        end();
        super.onDestroy();
    }
}
