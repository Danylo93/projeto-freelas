package com.freelas.app.di;

import com.freelas.app.data.local.PreferencesManager;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import okhttp3.Interceptor;

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
public final class NetworkModule_ProvideAuthInterceptorFactory implements Factory<Interceptor> {
  private final Provider<PreferencesManager> preferencesManagerProvider;

  public NetworkModule_ProvideAuthInterceptorFactory(
      Provider<PreferencesManager> preferencesManagerProvider) {
    this.preferencesManagerProvider = preferencesManagerProvider;
  }

  @Override
  public Interceptor get() {
    return provideAuthInterceptor(preferencesManagerProvider.get());
  }

  public static NetworkModule_ProvideAuthInterceptorFactory create(
      Provider<PreferencesManager> preferencesManagerProvider) {
    return new NetworkModule_ProvideAuthInterceptorFactory(preferencesManagerProvider);
  }

  public static Interceptor provideAuthInterceptor(PreferencesManager preferencesManager) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideAuthInterceptor(preferencesManager));
  }
}
