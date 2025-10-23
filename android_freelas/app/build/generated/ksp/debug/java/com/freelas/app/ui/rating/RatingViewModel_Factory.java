package com.freelas.app.ui.rating;

import com.freelas.app.data.repository.RatingRepository;
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
public final class RatingViewModel_Factory implements Factory<RatingViewModel> {
  private final Provider<RatingRepository> ratingRepositoryProvider;

  public RatingViewModel_Factory(Provider<RatingRepository> ratingRepositoryProvider) {
    this.ratingRepositoryProvider = ratingRepositoryProvider;
  }

  @Override
  public RatingViewModel get() {
    return newInstance(ratingRepositoryProvider.get());
  }

  public static RatingViewModel_Factory create(
      Provider<RatingRepository> ratingRepositoryProvider) {
    return new RatingViewModel_Factory(ratingRepositoryProvider);
  }

  public static RatingViewModel newInstance(RatingRepository ratingRepository) {
    return new RatingViewModel(ratingRepository);
  }
}
