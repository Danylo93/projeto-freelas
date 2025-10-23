package com.freelas.app.ui.provider;

import com.freelas.app.data.repository.LocationRepository;
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
public final class ProviderHomeViewModel_Factory implements Factory<ProviderHomeViewModel> {
  private final Provider<ServiceRepository> serviceRepositoryProvider;

  private final Provider<LocationRepository> locationRepositoryProvider;

  private final Provider<RealProviderRepository> realProviderRepositoryProvider;

  public ProviderHomeViewModel_Factory(Provider<ServiceRepository> serviceRepositoryProvider,
      Provider<LocationRepository> locationRepositoryProvider,
      Provider<RealProviderRepository> realProviderRepositoryProvider) {
    this.serviceRepositoryProvider = serviceRepositoryProvider;
    this.locationRepositoryProvider = locationRepositoryProvider;
    this.realProviderRepositoryProvider = realProviderRepositoryProvider;
  }

  @Override
  public ProviderHomeViewModel get() {
    return newInstance(serviceRepositoryProvider.get(), locationRepositoryProvider.get(), realProviderRepositoryProvider.get());
  }

  public static ProviderHomeViewModel_Factory create(
      Provider<ServiceRepository> serviceRepositoryProvider,
      Provider<LocationRepository> locationRepositoryProvider,
      Provider<RealProviderRepository> realProviderRepositoryProvider) {
    return new ProviderHomeViewModel_Factory(serviceRepositoryProvider, locationRepositoryProvider, realProviderRepositoryProvider);
  }

  public static ProviderHomeViewModel newInstance(ServiceRepository serviceRepository,
      LocationRepository locationRepository, RealProviderRepository realProviderRepository) {
    return new ProviderHomeViewModel(serviceRepository, locationRepository, realProviderRepository);
  }
}
