package com.freelas.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class FreelasApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize any global configurations here
        // Firebase, crash reporting, analytics, etc.
    }
}

