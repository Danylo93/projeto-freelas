package com.freelas.app.ui.payment;

import com.freelas.app.data.repository.PaymentRepository;
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
public final class PaymentViewModel_Factory implements Factory<PaymentViewModel> {
  private final Provider<PaymentRepository> paymentRepositoryProvider;

  public PaymentViewModel_Factory(Provider<PaymentRepository> paymentRepositoryProvider) {
    this.paymentRepositoryProvider = paymentRepositoryProvider;
  }

  @Override
  public PaymentViewModel get() {
    return newInstance(paymentRepositoryProvider.get());
  }

  public static PaymentViewModel_Factory create(
      Provider<PaymentRepository> paymentRepositoryProvider) {
    return new PaymentViewModel_Factory(paymentRepositoryProvider);
  }

  public static PaymentViewModel newInstance(PaymentRepository paymentRepository) {
    return new PaymentViewModel(paymentRepository);
  }
}
