package com.freelas.app.di

import android.content.Context
import com.freelas.app.data.repository.AuthRepository
import com.freelas.app.data.repository.ServiceRepository
import com.freelas.app.data.repository.LocationRepository
import com.freelas.app.data.repository.RealClientRepository
import com.freelas.app.data.repository.RealProviderRepository
import com.freelas.app.data.repository.PaymentRepository
import com.freelas.app.data.repository.RatingRepository
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {
    
    @Provides
    @Singleton
    fun provideContext(@ApplicationContext context: Context): Context {
        return context
    }
    
    @Provides
    @Singleton
    fun provideFusedLocationProviderClient(@ApplicationContext context: Context): FusedLocationProviderClient {
        return LocationServices.getFusedLocationProviderClient(context)
    }
    
    @Provides
    @Singleton
    fun provideAuthRepository(
        apiService: com.freelas.app.data.network.ApiService,
        preferencesManager: com.freelas.app.data.local.PreferencesManager
    ): AuthRepository {
        return AuthRepository(apiService, preferencesManager)
    }
    
    @Provides
    @Singleton
    fun provideServiceRepository(
        apiService: com.freelas.app.data.network.ApiService
    ): ServiceRepository {
        return ServiceRepository(apiService)
    }
    
    @Provides
    @Singleton
    fun provideLocationRepository(
        context: Context,
        apiService: com.freelas.app.data.network.ApiService
    ): LocationRepository {
        return LocationRepository(context, apiService)
    }

    @Provides
    @Singleton
    fun provideRealClientRepository(): RealClientRepository {
        return RealClientRepository()
    }

    @Provides
    @Singleton
    fun provideRealProviderRepository(): RealProviderRepository {
        return RealProviderRepository()
    }

    @Provides
    @Singleton
    fun providePaymentRepository(): PaymentRepository {
        return PaymentRepository()
    }

    @Provides
    @Singleton
    fun provideRatingRepository(): RatingRepository {
        return RatingRepository()
    }
}
