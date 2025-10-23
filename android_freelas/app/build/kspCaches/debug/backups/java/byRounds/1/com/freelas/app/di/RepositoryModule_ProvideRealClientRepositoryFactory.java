package com.freelas.app.di;

import com.freelas.app.data.repository.RealClientRepository;
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
public final class RepositoryModule_ProvideRealClientRepositoryFactory implements Factory<RealClientRepository> {
  @Override
  public RealClientRepository get() {
    return provideRealClientRepository();
  }

  public static RepositoryModule_ProvideRealClientRepositoryFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static RealClientRepository provideRealClientRepository() {
    return Preconditions.checkNotNullFromProvides(RepositoryModule.INSTANCE.provideRealClientRepository());
  }

  private static final class InstanceHolder {
    private static final RepositoryModule_ProvideRealClientRepositoryFactory INSTANCE = new RepositoryModule_ProvideRealClientRepositoryFactory();
  }
}
