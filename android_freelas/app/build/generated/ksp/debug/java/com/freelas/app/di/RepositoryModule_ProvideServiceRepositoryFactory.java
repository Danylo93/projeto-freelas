package com.freelas.app.di;

import com.freelas.app.data.network.ApiService;
import com.freelas.app.data.repository.ServiceRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
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
public final class RepositoryModule_ProvideServiceRepositoryFactory implements Factory<ServiceRepository> {
  private final Provider<ApiService> apiServiceProvider;

  public RepositoryModule_ProvideServiceRepositoryFactory(Provider<ApiService> apiServiceProvider) {
    this.apiServiceProvider = apiServiceProvider;
  }

  @Override
  public ServiceRepository get() {
    return provideServiceRepository(apiServiceProvider.get());
  }

  public static RepositoryModule_ProvideServiceRepositoryFactory create(
      Provider<ApiService> apiServiceProvider) {
    return new RepositoryModule_ProvideServiceRepositoryFactory(apiServiceProvider);
  }

  public static ServiceRepository provideServiceRepository(ApiService apiService) {
    return Preconditions.checkNotNullFromProvides(RepositoryModule.INSTANCE.provideServiceRepository(apiService));
  }
}
