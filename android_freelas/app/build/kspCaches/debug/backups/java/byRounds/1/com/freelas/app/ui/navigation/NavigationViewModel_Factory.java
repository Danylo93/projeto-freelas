package com.freelas.app.ui.navigation;

import com.freelas.app.data.repository.AuthRepository;
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
public final class NavigationViewModel_Factory implements Factory<NavigationViewModel> {
  private final Provider<AuthRepository> authRepositoryProvider;

  public NavigationViewModel_Factory(Provider<AuthRepository> authRepositoryProvider) {
    this.authRepositoryProvider = authRepositoryProvider;
  }

  @Override
  public NavigationViewModel get() {
    return newInstance(authRepositoryProvider.get());
  }

  public static NavigationViewModel_Factory create(
      Provider<AuthRepository> authRepositoryProvider) {
    return new NavigationViewModel_Factory(authRepositoryProvider);
  }

  public static NavigationViewModel newInstance(AuthRepository authRepository) {
    return new NavigationViewModel(authRepository);
  }
}
