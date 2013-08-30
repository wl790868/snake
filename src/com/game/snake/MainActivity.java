package com.game.snake;

import org.apache.cordova.DroidGap;

import android.R;
import android.os.Bundle;

public class MainActivity extends DroidGap {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
//        setContentView(R.layout.activity_main);
//        super.setIntegerProperty("splashscreen", R.drawable.ic_launcher);
        super.loadUrl("file:///android_asset/www/app/snake.html", 5000);
    }

    
}
