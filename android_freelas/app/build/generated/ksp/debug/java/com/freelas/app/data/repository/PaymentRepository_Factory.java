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
public final class PaymentRepository_Factory implements Factory<PaymentRepository> {
  @Override
  public PaymentRepository get() {
    return newInstance();
  }

  public static PaymentRepository_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static PaymentRepository newInstance() {
    return new PaymentRepository();
  }

  private static final class InstanceHolder {
    private static final PaymentRepository_Factory INSTANCE = new PaymentRepository_Factory();
  }
}
