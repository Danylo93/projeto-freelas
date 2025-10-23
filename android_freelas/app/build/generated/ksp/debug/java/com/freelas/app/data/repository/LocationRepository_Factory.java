package com.freelas.app.data.repository;

import android.content.Context;
import com.freelas.app.data.network.ApiService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("dagger.hilt.android.qualifiers.ApplicationContext")
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava"
})
public final class LocationRepository_Factory implements Factory<LocationRepository> {
  private final Provider<Context> contextProvider;

  private final Provider<ApiService> apiServiceProvider;

  public LocationRepository_Factory(Provider<Context> contextProvider,
      Provider<ApiService> apiServiceProvider) {
    this.contextProvider = contextProvider;
    this.apiServiceProvider = apiServiceProvider;
  }

  @Override
  public LocationRepository get() {
    return newInstance(contextProvider.get(), apiServiceProvider.get());
  }

  public static LocationRepository_Factory create(Provider<Context> contextProvider,
      Provider<ApiService> apiServiceProvider) {
    return new LocationRepository_Factory(contextProvider, apiServiceProvider);
  }

  public static LocationRepository newInstance(Context context, ApiService apiService) {
    return new LocationRepository(context, apiService);
  }
}
