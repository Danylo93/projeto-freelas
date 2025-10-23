package com.freelas.app.ui.components;

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
public final class SocketManager_Factory implements Factory<SocketManager> {
  @Override
  public SocketManager get() {
    return newInstance();
  }

  public static SocketManager_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static SocketManager newInstance() {
    return new SocketManager();
  }

  private static final class InstanceHolder {
    private static final SocketManager_Factory INSTANCE = new SocketManager_Factory();
  }
}
