package com.lovable.snapstore;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.webkit.WebView;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private volatile boolean appReady = false;
    private int cachedNavBarHeight = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> !appReady);
        super.onCreate(savedInstanceState);
        new Handler(Looper.getMainLooper()).postDelayed(() -> appReady = true, 1500);

        // Use addOnGlobalLayoutListener (additive — does not replace Capacitor's insets listener).
        // Read insets via getRootWindowInsets after every layout pass.
        View decorView = getWindow().getDecorView();
        decorView.getViewTreeObserver().addOnGlobalLayoutListener(() -> {
            if (cachedNavBarHeight > 0) return;

            WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decorView);
            if (insets != null) {
                // Covers both 3-button nav (navigationBars) and gesture nav (mandatorySystemGestures)
                int navBarH  = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
                int gestureH = insets.getInsets(WindowInsetsCompat.Type.mandatorySystemGestures()).bottom;
                int height = Math.max(navBarH, gestureH);
                if (height > 0) {
                    cachedNavBarHeight = height;
                    injectNavBarHeight(cachedNavBarHeight);
                    return;
                }
            }
            // Fallback: read the nav bar dimension from Android system resources.
            // Works for 3-button nav on all API levels regardless of insets state.
            int resHeight = getNavBarHeightFromResources();
            if (resHeight > 0) {
                cachedNavBarHeight = resHeight;
                injectNavBarHeight(cachedNavBarHeight);
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-inject on every resume so the value survives page reloads inside the WebView.
        int height = cachedNavBarHeight > 0 ? cachedNavBarHeight : getNavBarHeightFromResources();
        if (height > 0) {
            new Handler(Looper.getMainLooper()).postDelayed(() -> injectNavBarHeight(height), 400);
        }
    }

    private int getNavBarHeightFromResources() {
        // getDimensionPixelSize returns physical pixels; divide by density to get dp (= CSS px).
        int resId = getResources().getIdentifier("navigation_bar_height", "dimen", "android");
        if (resId <= 0) return 0;
        float physicalPx = getResources().getDimensionPixelSize(resId);
        float density = getResources().getDisplayMetrics().density;
        return Math.round(physicalPx / density);
    }

    private void injectNavBarHeight(int cssPx) {
        try {
            WebView webView = getBridge().getWebView();
            // Value is in dp == CSS pixels (physical px already divided by density).
            String js = "window.__androidNavBarHeight = " + cssPx + ";";
            webView.post(() -> webView.evaluateJavascript(js, null));
        } catch (Exception ignored) {}
    }
}
