package com.freelas.app.di;

import com.freelas.app.data.repository.RatingRepository;
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
public final class RepositoryModule_ProvideRatingRepositoryFactory implements Factory<RatingRepository> {
  @Override
  public RatingRepository get() {
    return provideRatingRepository();
  }

  public static RepositoryModule_ProvideRatingRepositoryFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static RatingRepository provideRatingRepository() {
    return Preconditions.checkNotNullFromProvides(RepositoryModule.INSTANCE.provideRatingRepository());
  }

  private static final class InstanceHolder {
    private static final RepositoryModule_ProvideRatingRepositoryFactory INSTANCE = new RepositoryModule_ProvideRatingRepositoryFactory();
  }
}
