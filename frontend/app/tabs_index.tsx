import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const serviceCategories = [
  { id: 'eletricista', name: 'Eletricista', icon: '⚡', description: 'Serviços elétricos' },
  { id: 'encanador', name: 'Encanador', icon: '🔧', description: 'Serviços hidráulicos' },
  { id: 'pintor', name: 'Pintor', icon: '🎨', description: 'Pintura e decoração' },
  { id: 'marceneiro', name: 'Marceneiro', icon: '🔨', description: 'Móveis e madeira' },
  { id: 'jardineiro', name: 'Jardineiro', icon: '🌱', description: 'Jardim e paisagismo' },
  { id: 'faxineiro', name: 'Faxineiro', icon: '✨', description: 'Limpeza geral' },
];

export default function HomeScreen() {
  const handleRequestService = (categoryId: string) => {
    alert(`Solicitar serviço: ${categoryId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Olá! 👋</Text>
        <Text style={styles.subtitleText}>Que serviço você precisa?</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Categorias de Serviços</Text>
        
        <View style={styles.categoriesGrid}>
          {serviceCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleRequestService(category.id)}
            >
              <View style={styles.categoryIcon}>
                <Text style={styles.iconText}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f2ff',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});