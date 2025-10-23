package com.freelas.app.data.repository;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
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
public final class RatingRepository_Factory implements Factory<RatingRepository> {
  @Override
  public RatingRepository get() {
    return newInstance();
  }

  public static RatingRepository_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static RatingRepository newInstance() {
    return new RatingRepository();
  }

  private static final class InstanceHolder {
    private static final RatingRepository_Factory INSTANCE = new RatingRepository_Factory();
  }
}
