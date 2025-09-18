import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Tab {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
}

interface BottomTabNavigationProps {
  tabs: Tab[];
  activeTab: string;
}

export const BottomTabNavigation: React.FC<BottomTabNavigationProps> = ({
  tabs,
  activeTab,
}) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={tab.onPress}
        >
          <Text style={[
            styles.tabIcon,
            activeTab === tab.id && styles.activeTabIcon
          ]}>
            {tab.icon}
          </Text>
          <Text style={[
            styles.tabLabel,
            activeTab === tab.id && styles.activeTabLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabIcon: {
    fontSize: 20,
    color: '#8E8E93',
    marginBottom: 4,
  },
  activeTabIcon: {
    color: '#007AFF',
  },
  tabLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
