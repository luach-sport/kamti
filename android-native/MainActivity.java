package com.luachsport.kamti;

import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.KeyEvent;
import android.view.WindowManager;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

/**
 * The app's only screen (the web app inside). While the alarm rings or checks on you:
 *  - it shows over the lock screen and turns the screen on;
 *  - volume keys and "back" do nothing;
 *  - leaving it (home, another app) brings it straight back, when "display over other apps" is allowed.
 */
public class MainActivity extends BridgeActivity {
    static volatile boolean visible = false;
    private final Handler h = new Handler(Looper.getMainLooper());
    private final RingState.Listener ringListener = (st) -> applyRingWindow();
    private OnBackPressedCallback backLock;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KamtiAlarmPlugin.class);
        super.onCreate(savedInstanceState);
        backLock = new OnBackPressedCallback(false) {
            @Override public void handleOnBackPressed() { /* swallowed while ringing */ }
        };
        getOnBackPressedDispatcher().addCallback(this, backLock);
        RingState.addListener(ringListener);
        applyRingWindow();
    }

    @Override
    public void onStart() {
        super.onStart();
        visible = true;
        h.removeCallbacks(comeBack);
    }

    @Override
    public void onResume() {
        super.onResume();
        applyRingWindow();
    }

    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        applyRingWindow();
    }

    @Override
    public void onStop() {
        super.onStop();
        visible = false;
        if (RingState.active(this) && !isChangingConfigurations()) h.postDelayed(comeBack, 600);
    }

    @Override
    public void onDestroy() {
        RingState.removeListener(ringListener);
        h.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        if (RingState.active(this)) h.postDelayed(comeBack, 600);
    }

    private final Runnable comeBack = () -> {
        if (visible || !RingState.active(this)) return;
        if (Build.VERSION.SDK_INT >= 29 && !Settings.canDrawOverlays(this)) return;
        try {
            startActivity(new android.content.Intent(this, MainActivity.class)
                .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK | android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP));
        } catch (Exception ignored) { }
    };

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        if (RingState.active(this)) {
            switch (e.getKeyCode()) {
                case KeyEvent.KEYCODE_VOLUME_UP:
                case KeyEvent.KEYCODE_VOLUME_DOWN:
                case KeyEvent.KEYCODE_VOLUME_MUTE:
                case KeyEvent.KEYCODE_BACK:
                case KeyEvent.KEYCODE_ESCAPE:
                case KeyEvent.KEYCODE_CAMERA:
                case KeyEvent.KEYCODE_FOCUS:
                    return true;
                default:
                    break;
            }
        }
        return super.dispatchKeyEvent(e);
    }

    /** Over the lock screen, screen on and kept on – only while ringing or checking. */
    private void applyRingWindow() {
        boolean on = RingState.active(this);
        if (backLock != null) backLock.setEnabled(on);
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(on);
            setTurnScreenOn(on);
        } else {
            int f = WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON;
            if (on) getWindow().addFlags(f); else getWindow().clearFlags(f);
        }
        if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
