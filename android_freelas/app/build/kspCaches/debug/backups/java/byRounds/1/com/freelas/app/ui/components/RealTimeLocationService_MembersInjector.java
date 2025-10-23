package com.freelas.app.ui.components;

import com.google.android.gms.location.FusedLocationProviderClient;
import dagger.MembersInjector;
import dagger.internal.DaggerGenerated;
import dagger.internal.InjectedFieldSignature;
import dagger.internal.QualifierMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

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
public final class RealTimeLocationService_MembersInjector implements MembersInjector<RealTimeLocationService> {
  private final Provider<FusedLocationProviderClient> fusedLocationClientProvider;

  public RealTimeLocationService_MembersInjector(
      Provider<FusedLocationProviderClient> fusedLocationClientProvider) {
    this.fusedLocationClientProvider = fusedLocationClientProvider;
  }

  public static MembersInjector<RealTimeLocationService> create(
      Provider<FusedLocationProviderClient> fusedLocationClientProvider) {
    return new RealTimeLocationService_MembersInjector(fusedLocationClientProvider);
  }

  @Override
  public void injectMembers(RealTimeLocationService instance) {
    injectFusedLocationClient(instance, fusedLocationClientProvider.get());
  }

  @InjectedFieldSignature("com.freelas.app.ui.components.RealTimeLocationService.fusedLocationClient")
  public static void injectFusedLocationClient(RealTimeLocationService instance,
      FusedLocationProviderClient fusedLocationClient) {
    instance.fusedLocationClient = fusedLocationClient;
  }
}
