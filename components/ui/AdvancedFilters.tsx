import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

import { colors, spacing, typography, radii, shadows } from '../../utils/theme';
import { Button } from './Button';

interface FilterOptions {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  categories: string[];
  minValue: number;
  maxValue: number;
  sortBy: 'vendas' | 'quantidade' | 'receita' | 'alfabetico';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  availableCategories: string[];
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
  availableCategories,
}) => {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleApply = () => {
    onApply(filters);
    onClose();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
        endDate: new Date(),
      },
      categories: [],
      minValue: 0,
      maxValue: 999999,
      sortBy: 'vendas',
      sortOrder: 'desc',
    };
    setFilters(resetFilters);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    setFilters(prev => ({
      ...prev,
      categories: newCategories,
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[colors.primary[500], colors.secondary[500]]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filtros Avançados</Text>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetText}>Limpar</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Período Personalizado */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Período Personalizado</Text>
            
            <View style={styles.dateRow}>
              <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>Data Inicial</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color={colors.primary[500]} />
                  <Text style={styles.dateText}>{formatDate(filters.dateRange.startDate)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>Data Final</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color={colors.primary[500]} />
                  <Text style={styles.dateText}>{formatDate(filters.dateRange.endDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Categorias */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏷️ Categorias</Text>
            <Text style={styles.sectionSubtitle}>
              Selecione as categorias que deseja incluir no relatório
            </Text>
            
            <View style={styles.categoriesGrid}>
              {availableCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    filters.categories.includes(category) && styles.categoryChipActive,
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      filters.categories.includes(category) && styles.categoryChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Faixa de Valores */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Faixa de Valores</Text>
            
            <View style={styles.valueRow}>
              <View style={styles.valueContainer}>
                <Text style={styles.valueLabel}>Valor Mínimo</Text>
                <TextInput
                  style={styles.valueInput}
                  value={filters.minValue.toString()}
                  onChangeText={(text) => {
                    const value = parseFloat(text) || 0;
                    setFilters(prev => ({ ...prev, minValue: value }));
                  }}
                  keyboardType="numeric"
                  placeholder="0,00"
                />
              </View>

              <View style={styles.valueContainer}>
                <Text style={styles.valueLabel}>Valor Máximo</Text>
                <TextInput
                  style={styles.valueInput}
                  value={filters.maxValue.toString()}
                  onChangeText={(text) => {
                    const value = parseFloat(text) || 999999;
                    setFilters(prev => ({ ...prev, maxValue: value }));
                  }}
                  keyboardType="numeric"
                  placeholder="999.999,99"
                />
              </View>
            </View>
          </View>

          {/* Ordenação */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Ordenação</Text>
            
            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Ordenar por:</Text>
              <View style={styles.sortOptions}>
                {[
                  { key: 'vendas', label: 'Vendas' },
                  { key: 'quantidade', label: 'Quantidade' },
                  { key: 'receita', label: 'Receita' },
                  { key: 'alfabetico', label: 'A-Z' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      filters.sortBy === option.key && styles.sortOptionActive,
                    ]}
                    onPress={() => {
                      setFilters(prev => ({ ...prev, sortBy: option.key as any }));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        filters.sortBy === option.key && styles.sortOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Ordem:</Text>
              <View style={styles.sortOptions}>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    filters.sortOrder === 'desc' && styles.sortOptionActive,
                  ]}
                  onPress={() => {
                    setFilters(prev => ({ ...prev, sortOrder: 'desc' }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons name="arrow-down" size={16} color={
                    filters.sortOrder === 'desc' ? colors.white : colors.neutral[600]
                  } />
                  <Text
                    style={[
                      styles.sortOptionText,
                      filters.sortOrder === 'desc' && styles.sortOptionTextActive,
                    ]}
                  >
                    Decrescente
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    filters.sortOrder === 'asc' && styles.sortOptionActive,
                  ]}
                  onPress={() => {
                    setFilters(prev => ({ ...prev, sortOrder: 'asc' }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons name="arrow-up" size={16} color={
                    filters.sortOrder === 'asc' ? colors.white : colors.neutral[600]
                  } />
                  <Text
                    style={[
                      styles.sortOptionText,
                      filters.sortOrder === 'asc' && styles.sortOptionTextActive,
                    ]}
                  >
                    Crescente
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer com botões */}
        <View style={styles.footer}>
          <Button
            variant="ghost"
            onPress={onClose}
            style={styles.footerButton}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onPress={handleApply}
            style={styles.footerButton}
          >
            Aplicar Filtros
          </Button>
        </View>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={filters.dateRange.startDate}
            mode="date"
            display="default"
            onChange={(event: any, selectedDate?: Date) => {
              setShowStartDatePicker(false);
              if (selectedDate) {
                setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, startDate: selectedDate },
                }));
              }
            }}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={filters.dateRange.endDate}
            mode="date"
            display="default"
            onChange={(event: any, selectedDate?: Date) => {
              setShowEndDatePicker(false);
              if (selectedDate) {
                setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, endDate: selectedDate },
                }));
              }
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.white,
  },
  resetButton: {
    padding: spacing[2],
  },
  resetText: {
    color: colors.white,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as any,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  section: {
    marginVertical: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[3],
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateContainer: {
    flex: 1,
    marginHorizontal: spacing[1],
  },
  dateLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    ...shadows.sm,
  },
  dateText: {
    marginLeft: spacing[2],
    fontSize: typography.fontSizes.base,
    color: colors.neutral[900],
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    marginRight: spacing[2],
    marginBottom: spacing[2],
  },
  categoryChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  categoryChipText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueContainer: {
    flex: 1,
    marginHorizontal: spacing[1],
  },
  valueLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  valueInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: typography.fontSizes.base,
    color: colors.neutral[900],
    ...shadows.sm,
  },
  sortContainer: {
    marginBottom: spacing[3],
  },
  sortLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    marginRight: spacing[2],
    marginBottom: spacing[2],
  },
  sortOptionActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  sortOptionText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
    marginLeft: spacing[1],
  },
  sortOptionTextActive: {
    color: colors.white,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: spacing[2],
  },
});

export default AdvancedFilters; 