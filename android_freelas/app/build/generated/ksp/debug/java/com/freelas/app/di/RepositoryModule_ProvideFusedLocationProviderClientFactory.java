package com.freelas.app.di;

import android.content.Context;
import com.google.android.gms.location.FusedLocationProviderClient;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("dagger.hilt.android.qualifiers.ApplicationContext")
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
public final class RepositoryModule_ProvideFusedLocationProviderClientFactory implements Factory<FusedLocationProviderClient> {
  private final Provider<Context> contextProvider;

  public RepositoryModule_ProvideFusedLocationProviderClientFactory(
      Provider<Context> contextProvider) {
    this.contextProvider = contextProvider;
  }

  @Override
  public FusedLocationProviderClient get() {
    return provideFusedLocationProviderClient(contextProvider.get());
  }

  public static RepositoryModule_ProvideFusedLocationProviderClientFactory create(
      Provider<Context> contextProvider) {
    return new RepositoryModule_ProvideFusedLocationProviderClientFactory(contextProvider);
  }

  public static FusedLocationProviderClient provideFusedLocationProviderClient(Context context) {
    return Preconditions.checkNotNullFromProvides(RepositoryModule.INSTANCE.provideFusedLocationProviderClient(context));
  }
}
