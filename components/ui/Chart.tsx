import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { colors, typography, spacing, radii } from '../../utils/theme';

const screenWidth = Dimensions.get('window').width;

interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface ChartProps {
  type: 'line' | 'bar' | 'pie';
  data: ChartData | PieChartData[];
  title?: string;
  height?: number;
  width?: number;
  showLegend?: boolean;
  style?: any;
}

const chartConfig = {
  backgroundColor: colors.white,
  backgroundGradientFrom: colors.white,
  backgroundGradientTo: colors.neutral[50],
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(193, 120, 23, ${opacity})`, // primary[500]
  labelColor: (opacity = 1) => `rgba(115, 115, 115, ${opacity})`, // neutral[500]
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: colors.primary[500],
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: colors.neutral[200],
    strokeWidth: 1,
  },
  propsForLabels: {
    fontSize: 12,
    fontFamily: 'System',
  },
};

export const Chart: React.FC<ChartProps> = ({
  type,
  data,
  title,
  height = 220,
  width = screenWidth - 40,
  showLegend = true,
  style,
}) => {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data as ChartData}
            width={width}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withDots={true}
            withShadow={false}
            withScrollableDot={false}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
          />
        );
      
      case 'bar':
        return (
          <BarChart
            data={data as ChartData}
            width={width}
            height={height}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            yAxisLabel=""
            yAxisSuffix=""
            yAxisInterval={1}
          />
        );
      
      case 'pie':
        return (
          <PieChart
            data={data as PieChartData[]}
            width={width}
            height={height}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 10]}
            style={styles.chart}
            hasLegend={showLegend}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}
      <View style={styles.chartContainer}>
        {renderChart()}
      </View>
    </View>
  );
};

// Componente específico para gráfico de vendas
export const SalesChart: React.FC<{
  data: { period: string; sales: number }[];
  title?: string;
}> = ({ data, title = 'Vendas por Período' }) => {
  const chartData: ChartData = {
    labels: data.map(item => item.period),
    datasets: [
      {
        data: data.map(item => item.sales),
        color: (opacity = 1) => `rgba(193, 120, 23, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  return (
    <Chart
      type="line"
      data={chartData}
      title={title}
      height={200}
    />
  );
};

// Componente específico para gráfico de categorias
export const CategoryChart: React.FC<{
  data: { categoria: string; total_vendas: number }[];
  title?: string;
}> = ({ data, title = 'Vendas por Categoria' }) => {
  const colors_pie = [
    colors.primary[500],
    colors.secondary[500],
    colors.tertiary[500],
    colors.success[500],
    colors.warning[500],
    colors.error[500],
    colors.info[500],
    colors.bread,
  ];

  const pieData: PieChartData[] = data.map((item, index) => ({
    name: item.categoria,
    population: item.total_vendas,
    color: colors_pie[index % colors_pie.length],
    legendFontColor: colors.neutral[700],
    legendFontSize: 12,
  }));

  return (
    <Chart
      type="pie"
      data={pieData}
      title={title}
      height={200}
      showLegend={true}
    />
  );
};

// Componente específico para gráfico de produtos
export const ProductChart: React.FC<{
  data: { nome: string; quantidade_vendida: number }[];
  title?: string;
}> = ({ data, title = 'Produtos Mais Vendidos' }) => {
  const chartData: ChartData = {
    labels: data.map(item => item.nome.substring(0, 8) + '...'),
    datasets: [
      {
        data: data.map(item => item.quantidade_vendida),
        color: (opacity = 1) => `rgba(139, 69, 19, ${opacity})`, // secondary[500]
      },
    ],
  };

  return (
    <Chart
      type="bar"
      data={chartData}
      title={title}
      height={220}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginVertical: spacing[2],
    shadowColor: colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    borderRadius: radii.md,
  },
});

export default Chart; 