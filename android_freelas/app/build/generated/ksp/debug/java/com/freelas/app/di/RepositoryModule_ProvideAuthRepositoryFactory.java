package com.freelas.app.di;

import com.freelas.app.data.local.PreferencesManager;
import com.freelas.app.data.network.ApiService;
import com.freelas.app.data.repository.AuthRepository;
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
public final class RepositoryModule_ProvideAuthRepositoryFactory implements Factory<AuthRepository> {
  private final Provider<ApiService> apiServiceProvider;

  private final Provider<PreferencesManager> preferencesManagerProvider;

  public RepositoryModule_ProvideAuthRepositoryFactory(Provider<ApiService> apiServiceProvider,
      Provider<PreferencesManager> preferencesManagerProvider) {
    this.apiServiceProvider = apiServiceProvider;
    this.preferencesManagerProvider = preferencesManagerProvider;
  }

  @Override
  public AuthRepository get() {
    return provideAuthRepository(apiServiceProvider.get(), preferencesManagerProvider.get());
  }

  public static RepositoryModule_ProvideAuthRepositoryFactory create(
      Provider<ApiService> apiServiceProvider,
      Provider<PreferencesManager> preferencesManagerProvider) {
    return new RepositoryModule_ProvideAuthRepositoryFactory(apiServiceProvider, preferencesManagerProvider);
  }

  public static AuthRepository provideAuthRepository(ApiService apiService,
      PreferencesManager preferencesManager) {
    return Preconditions.checkNotNullFromProvides(RepositoryModule.INSTANCE.provideAuthRepository(apiService, preferencesManager));
  }
}
