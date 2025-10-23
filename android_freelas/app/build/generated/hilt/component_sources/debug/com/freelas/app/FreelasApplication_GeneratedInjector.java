package com.freelas.app;

import dagger.hilt.InstallIn;
import dagger.hilt.codegen.OriginatingElement;
import dagger.hilt.components.SingletonComponent;
import dagger.hilt.internal.GeneratedEntryPoint;

@OriginatingElement(
    topLevelClass = FreelasApplication.class
)
@GeneratedEntryPoint
@InstallIn(SingletonComponent.class)
public interface FreelasApplication_GeneratedInjector {
  void injectFreelasApplication(FreelasApplication freelasApplication);
}
