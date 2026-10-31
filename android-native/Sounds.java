package com.luachsport.kamti;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONObject;

/**
 * Which sound to play: one made for קמתי (res/raw/kamti_*.ogg), the phone's own alarm sound, or a file the
 * user picked. Anything that can't be found falls back to the classic beep, so the alarm is never silent.
 * Also plays a short preview in the editor (at the phone's current alarm volume).
 */
final class Sounds {
    private static MediaPlayer preview;
    private static final Handler h = new Handler(Looper.getMainLooper());

    private Sounds() {}

    static Uri builtin(Context c, String id) {
        int res = c.getResources().getIdentifier("kamti_" + id, "raw", c.getPackageName());
        if (res == 0) res = c.getResources().getIdentifier("kamti_classic", "raw", c.getPackageName());
        return Uri.parse("android.resource://" + c.getPackageName() + "/" + res);
    }

    static Uri checkUri(Context c) { return builtin(c, "check"); }

    static Uri uriFor(Context c, JSONObject s) {
        if (s == null) return builtin(c, "classic");
        String kind = s.optString("kind", "builtin");
        if ("phone".equals(kind)) {
            Uri u = null;
            try { u = RingtoneManager.getActualDefaultRingtoneUri(c, RingtoneManager.TYPE_ALARM); } catch (Exception ignored) { }
            if (u == null) { try { u = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM); } catch (Exception ignored) { } }
            return u != null ? u : builtin(c, "classic");
        }
        if ("file".equals(kind) && !s.optString("uri", "").isEmpty()) return Uri.parse(s.optString("uri"));
        return builtin(c, s.optString("id", "classic"));
    }

    static void preview(Context c, JSONObject s) {
        stopPreview();
        try {
            preview = new MediaPlayer();
            preview.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            preview.setDataSource(c, uriFor(c, s));
            preview.setLooping(true);
            preview.prepare();
            preview.start();
            h.postDelayed(Sounds::stopPreview, 6000);
        } catch (Exception e) {
            stopPreview();
        }
    }

    static void stopPreview() {
        h.removeCallbacksAndMessages(null);
        if (preview != null) {
            try { preview.stop(); } catch (Exception ignored) { }
            try { preview.release(); } catch (Exception ignored) { }
            preview = null;
        }
    }
}
