package com.physiosuai.app;

import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.ImageView;

import androidx.appcompat.app.AppCompatActivity;

public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // TRUE fullscreen — hides status bar and nav bar completely
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );

        setContentView(R.layout.activity_splash);

        // Animate logo: fade in + scale up
        ImageView logo = findViewById(R.id.splashLogo);
        logo.setAlpha(0f);
        logo.setScaleX(0.6f);
        logo.setScaleY(0.6f);

        ObjectAnimator fadeIn = ObjectAnimator.ofFloat(logo, "alpha", 0f, 1f);
        ObjectAnimator scaleX  = ObjectAnimator.ofFloat(logo, "scaleX", 0.6f, 1f);
        ObjectAnimator scaleY  = ObjectAnimator.ofFloat(logo, "scaleY", 0.6f, 1f);

        AnimatorSet set = new AnimatorSet();
        set.playTogether(fadeIn, scaleX, scaleY);
        set.setDuration(800);
        set.setInterpolator(new AccelerateDecelerateInterpolator());
        set.start();

        // Go to main after 2.5 seconds
        new Handler().postDelayed(() -> {
            Intent intent = new Intent(SplashActivity.this, MainActivity.class);
            startActivity(intent);
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            finish();
        }, 2500);
    }
}
