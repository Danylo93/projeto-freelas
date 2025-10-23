package com.freelas.app.di;

import android.content.Context;
import com.freelas.app.data.network.ApiService;
import com.freelas.app.data.repository.LocationRepository;
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
public final class RepositoryModule_ProvideLocationRepositoryFactory implements Factory<LocationRepository> {
  private final Provider<Context> contextProvider;

  private final Provider<ApiService> apiServiceProvider;

  public RepositoryModule_ProvideLocationRepositoryFactory(Provider<Context> contextProvider,
      Provider<ApiService> apiServiceProvider) {
    this.contextProvider = contextProvider;
    this.apiServiceProvider = apiServiceProvider;
  }

  @Override
  public LocationRepository get() {
    return provideLocationRepository(contextProvider.get(), apiServiceProvider.get());
  }

  public static RepositoryModule_ProvideLocationRepositoryFactory create(
      Provider<Context> contextProvider, Provider<ApiService> apiServiceProvider) {
    return new RepositoryModule_ProvideLocationRepositoryFactory(contextProvider, apiServiceProvider);
  }

  public static LocationRepository provideLocationRepository(Context context,
      ApiService apiService) {
    return Preconditions.checkNotNullFromProvides(RepositoryModule.INSTANCE.provideLocationRepository(context, apiService));
  }
}
