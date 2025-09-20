import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../src/providers/ThemeProvider';

interface ModernBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: string[];
  onClose?: () => void;
  enablePanDownToClose?: boolean;
  backdropComponent?: React.ComponentType<any>;
}

export const ModernBottomSheet: React.FC<ModernBottomSheetProps> = ({
  children,
  snapPoints = ['20%', '45%', '85%'],
  onClose,
  enablePanDownToClose = true,
  backdropComponent
}) => {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPointsMemo = useMemo(() => snapPoints, [snapPoints]);

  const renderBackdrop = useMemo(
    () =>
      backdropComponent || (
        (props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
            onPress={onClose}
          />
        )
      ),
    [backdropComponent, onClose]
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPointsMemo}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={[styles.background, { backgroundColor: theme.colors.surface }]}
        handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: theme.colors.outline }]}
        onClose={onClose}
      >
        <BottomSheetView style={styles.content}>
          {children}
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
});
