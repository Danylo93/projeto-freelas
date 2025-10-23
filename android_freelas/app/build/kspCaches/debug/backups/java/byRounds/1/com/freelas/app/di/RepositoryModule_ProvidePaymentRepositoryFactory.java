package com.freelas.app.di;

import com.freelas.app.data.repository.PaymentRepository;
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
public final class RepositoryModule_ProvidePaymentRepositoryFactory implements Factory<PaymentRepository> {
  @Override
  public PaymentRepository get() {
    return providePaymentRepository();
  }

  public static RepositoryModule_ProvidePaymentRepositoryFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static PaymentRepository providePaymentRepository() {
    return Preconditions.checkNotNullFromProvides(RepositoryModule.INSTANCE.providePaymentRepository());
  }

  private static final class InstanceHolder {
    private static final RepositoryModule_ProvidePaymentRepositoryFactory INSTANCE = new RepositoryModule_ProvidePaymentRepositoryFactory();
  }
}
