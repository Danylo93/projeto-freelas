package com.freelas.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.lifecycleScope
import com.freelas.app.ui.navigation.FreelasNavigation
import com.freelas.app.ui.theme.FreelasAppTheme
import com.freelas.app.utils.PermissionManager
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    private lateinit var permissionManager: PermissionManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // Initialize permission manager
        permissionManager = PermissionManager(this)
        
        setContent {
            FreelasAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    FreelasNavigation(permissionManager = permissionManager)
                }
            }
        }
        
        // Request location permission on startup
        lifecycleScope.launch {
            permissionManager.requestLocationPermission()
        }
    }
}

