package com.freelas.app.data.repository;

import com.freelas.app.data.local.PreferencesManager;
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
public final class AuthRepository_Factory implements Factory<AuthRepository> {
  private final Provider<ApiService> apiServiceProvider;

  private final Provider<PreferencesManager> preferencesManagerProvider;

  public AuthRepository_Factory(Provider<ApiService> apiServiceProvider,
      Provider<PreferencesManager> preferencesManagerProvider) {
    this.apiServiceProvider = apiServiceProvider;
    this.preferencesManagerProvider = preferencesManagerProvider;
  }

  @Override
  public AuthRepository get() {
    return newInstance(apiServiceProvider.get(), preferencesManagerProvider.get());
  }

  public static AuthRepository_Factory create(Provider<ApiService> apiServiceProvider,
      Provider<PreferencesManager> preferencesManagerProvider) {
    return new AuthRepository_Factory(apiServiceProvider, preferencesManagerProvider);
  }

  public static AuthRepository newInstance(ApiService apiService,
      PreferencesManager preferencesManager) {
    return new AuthRepository(apiService, preferencesManager);
  }
}
