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
public final class ServiceRepository_Factory implements Factory<ServiceRepository> {
  private final Provider<ApiService> apiServiceProvider;

  public ServiceRepository_Factory(Provider<ApiService> apiServiceProvider) {
    this.apiServiceProvider = apiServiceProvider;
  }

  @Override
  public ServiceRepository get() {
    return newInstance(apiServiceProvider.get());
  }

  public static ServiceRepository_Factory create(Provider<ApiService> apiServiceProvider) {
    return new ServiceRepository_Factory(apiServiceProvider);
  }

  public static ServiceRepository newInstance(ApiService apiService) {
    return new ServiceRepository(apiService);
  }
}
