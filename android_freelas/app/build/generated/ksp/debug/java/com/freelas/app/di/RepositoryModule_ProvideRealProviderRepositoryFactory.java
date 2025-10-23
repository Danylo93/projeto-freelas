package com.freelas.app.di;

import com.freelas.app.data.repository.RealProviderRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

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
public final class RepositoryModule_ProvideRealProviderRepositoryFactory implements Factory<RealProviderRepository> {
  @Override
  public RealProviderRepository get() {
    return provideRealProviderRepository();
  }

  public static RepositoryModule_ProvideRealProviderRepositoryFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static RealProviderRepository provideRealProviderRepository() {
    return Preconditions.checkNotNullFromProvides(RepositoryModule.INSTANCE.provideRealProviderRepository());
  }

  private static final class InstanceHolder {
    private static final RepositoryModule_ProvideRealProviderRepositoryFactory INSTANCE = new RepositoryModule_ProvideRealProviderRepositoryFactory();
  }
}
