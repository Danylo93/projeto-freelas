package com.freelas.app.data.repository;

import com.freelas.app.data.network.ApiService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata
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
public final class RouteRepository_Factory implements Factory<RouteRepository> {
  private final Provider<ApiService> apiServiceProvider;

  public RouteRepository_Factory(Provider<ApiService> apiServiceProvider) {
    this.apiServiceProvider = apiServiceProvider;
  }

  @Override
  public RouteRepository get() {
    return newInstance(apiServiceProvider.get());
  }

  public static RouteRepository_Factory create(Provider<ApiService> apiServiceProvider) {
    return new RouteRepository_Factory(apiServiceProvider);
  }

  public static RouteRepository newInstance(ApiService apiService) {
    return new RouteRepository(apiService);
  }
}
