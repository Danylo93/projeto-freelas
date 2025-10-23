package com.freelas.app.ui.client;

import com.freelas.app.data.repository.LocationRepository;
import com.freelas.app.data.repository.RealClientRepository;
import com.freelas.app.data.repository.RealProviderRepository;
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
public final class ClientHomeViewModel_Factory implements Factory<ClientHomeViewModel> {
  private final Provider<ServiceRepository> serviceRepositoryProvider;

  private final Provider<LocationRepository> locationRepositoryProvider;

  private final Provider<RealClientRepository> realClientRepositoryProvider;

  private final Provider<RealProviderRepository> realProviderRepositoryProvider;

  public ClientHomeViewModel_Factory(Provider<ServiceRepository> serviceRepositoryProvider,
      Provider<LocationRepository> locationRepositoryProvider,
      Provider<RealClientRepository> realClientRepositoryProvider,
      Provider<RealProviderRepository> realProviderRepositoryProvider) {
    this.serviceRepositoryProvider = serviceRepositoryProvider;
    this.locationRepositoryProvider = locationRepositoryProvider;
    this.realClientRepositoryProvider = realClientRepositoryProvider;
    this.realProviderRepositoryProvider = realProviderRepositoryProvider;
  }

  @Override
  public ClientHomeViewModel get() {
    return newInstance(serviceRepositoryProvider.get(), locationRepositoryProvider.get(), realClientRepositoryProvider.get(), realProviderRepositoryProvider.get());
  }

  public static ClientHomeViewModel_Factory create(
      Provider<ServiceRepository> serviceRepositoryProvider,
      Provider<LocationRepository> locationRepositoryProvider,
      Provider<RealClientRepository> realClientRepositoryProvider,
      Provider<RealProviderRepository> realProviderRepositoryProvider) {
    return new ClientHomeViewModel_Factory(serviceRepositoryProvider, locationRepositoryProvider, realClientRepositoryProvider, realProviderRepositoryProvider);
  }

  public static ClientHomeViewModel newInstance(ServiceRepository serviceRepository,
      LocationRepository locationRepository, RealClientRepository realClientRepository,
      RealProviderRepository realProviderRepository) {
    return new ClientHomeViewModel(serviceRepository, locationRepository, realClientRepository, realProviderRepository);
  }
}
