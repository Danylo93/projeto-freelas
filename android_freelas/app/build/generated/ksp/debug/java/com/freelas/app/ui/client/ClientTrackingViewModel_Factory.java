package com.freelas.app.ui.client;

import com.freelas.app.data.repository.RouteRepository;
import com.freelas.app.data.repository.ServiceRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
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
public final class ClientTrackingViewModel_Factory implements Factory<ClientTrackingViewModel> {
  private final Provider<RouteRepository> routeRepositoryProvider;

  private final Provider<ServiceRepository> serviceRepositoryProvider;

  public ClientTrackingViewModel_Factory(Provider<RouteRepository> routeRepositoryProvider,
      Provider<ServiceRepository> serviceRepositoryProvider) {
    this.routeRepositoryProvider = routeRepositoryProvider;
    this.serviceRepositoryProvider = serviceRepositoryProvider;
  }

  @Override
  public ClientTrackingViewModel get() {
    return newInstance(routeRepositoryProvider.get(), serviceRepositoryProvider.get());
  }

  public static ClientTrackingViewModel_Factory create(
      Provider<RouteRepository> routeRepositoryProvider,
      Provider<ServiceRepository> serviceRepositoryProvider) {
    return new ClientTrackingViewModel_Factory(routeRepositoryProvider, serviceRepositoryProvider);
  }

  public static ClientTrackingViewModel newInstance(RouteRepository routeRepository,
      ServiceRepository serviceRepository) {
    return new ClientTrackingViewModel(routeRepository, serviceRepository);
  }
}
