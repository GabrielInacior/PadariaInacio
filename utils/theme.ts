import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Breakpoints responsivos
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

// Sistema de design premium com todas as cores e componentes
export const colors = {
  // Paleta Principal - Tons de Marrom/Padaria
  primary: {
    50: '#FDF8F3',   // Creme muito claro
    100: '#F9E8D9',  // Bege claro
    200: '#F2D4B3',  // Bege
    300: '#E8B882',  // Dourado claro
    400: '#D49C51',  // Dourado
    500: '#C17817',  // Marrom dourado (cor principal)
    600: '#A66914',  // Marrom médio
    700: '#8B5513',  // Marrom escuro (saddlebrown)
    800: '#6D4210',  // Marrom muito escuro
    900: '#4A2C0A',  // Marrom chocolate escuro
  },
  
  // Secundária - Tons de Café/Chocolate
  secondary: {
    50: '#F7F3F0',   // Off-white quente
    100: '#E8DDD4',  // Bege rosado
    200: '#D4C4B0',  // Café com leite
    300: '#B8A082',  // Café claro
    400: '#9C7C54',  // Café médio
    500: '#8B4513',  // Marrom clássico (saddlebrown)
    600: '#7A3E11',  // Café escuro
    700: '#6B350F',  // Café torrado
    800: '#5C2D0D',  // Café muito escuro
    900: '#3D1E09',  // Café preto
  },
  
  // Terciária - Tons de Trigo/Dourado
  tertiary: {
    50: '#FFFEF7',   // Branco trigo
    100: '#FEF7E0',  // Palha muito clara
    200: '#FDECC4',  // Palha clara
    300: '#FBDB9A',  // Trigo claro
    400: '#F7C455',  // Dourado trigo
    500: '#F4A460',  // Sandy brown (cor do pão)
    600: '#E6935A',  // Crosta de pão
    700: '#D2691E',  // Chocolate (cor do pão assado)
    800: '#B8860B',  // Dark goldenrod
    900: '#8B4513',  // Saddle brown
  },
  
  // Cores de Suporte
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',  // Verde fresco
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',  // Âmbar/mel
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',  // Vermelho suave
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  info: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',  // Azul céu
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  
  // Neutros - Tons de Cinza Quente
  gray: {
    50: '#FAFAF9',   // Branco quente
    100: '#F5F5F4',  // Cinza muito claro quente
    200: '#E7E5E4',  // Cinza claro quente
    300: '#D6D3D1',  // Cinza médio claro
    400: '#A8A29E',  // Cinza médio
    500: '#78716C',  // Cinza
    600: '#57534E',  // Cinza escuro
    700: '#44403C',  // Cinza muito escuro
    800: '#292524',  // Quase preto quente
    900: '#1C1917',  // Preto quente
  },
  
  neutral: {
    0: '#FFFFFF',    // Branco puro para compatibilidade
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },
  
  // Cores Semânticas
  background: '#FEFDFB',      // Branco creme muito sutil
  surface: '#FFFFFF',         // Branco puro
  text: '#1C1917',           // Texto principal (quase preto quente)
  textSecondary: '#57534E',   // Texto secundário
  textMuted: '#A8A29E',       // Texto esmaecido
  border: '#E7E5E4',         // Bordas
  divider: '#F5F5F4',        // Divisores
  overlay: 'rgba(28, 25, 23, 0.5)', // Overlay escuro quente
  
  // Cores especiais da padaria
  bread: '#D2691E',          // Cor do pão (chocolate)
  crust: '#8B4513',          // Crosta do pão (saddle brown)
  flour: '#FDF8F3',          // Farinha (creme muito claro)
  wheat: '#F4A460',          // Trigo (sandy brown)
  honey: '#FFB347',          // Mel
  butter: '#FFDB58',         // Manteiga
  cream: '#FFFDD0',          // Creme
  
  // Cores básicas
  white: '#FFFFFF',
  black: '#1C1917',
  transparent: 'transparent',

  // Alias para compatibilidade
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',  // Vermelho suave
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Profiles para diferentes tipos de usuário
  profiles: {
    admin: {
      primary: '#A66914',    // primary[600]
      secondary: '#8B4513',  // secondary[500]
      background: '#FEFDFB', // background
      surface: '#FFFFFF',    // surface
    },
    supplier: {
      primary: '#C17817',    // primary[500]
      secondary: '#8B4513',  // secondary[500]
      background: '#FEFDFB', // background
      surface: '#FFFFFF',    // surface
    },
    customer: {
      primary: '#C17817',    // primary[500]
      secondary: '#8B4513',  // secondary[500]
      background: '#FEFDFB', // background
      surface: '#FFFFFF',    // surface
    },
  },

  // Gradientes para diferentes contextos
  gradients: {
    primary: ['#D49C51', '#A66914'],      // primary[400] to primary[600]
    secondary: ['#B8A082', '#8B4513'],    // secondary[300] to secondary[500]
    tertiary: ['#FBDB9A', '#C17817'],     // tertiary[300] to primary[500]
    warm: ['#F4A460', '#D2691E'],         // wheat to bread
    golden: ['#FFB347', '#F4A460'],       // honey to wheat
    cream: ['#FDF8F3', '#FFFDD0'],        // flour to cream
  },
};

// Sistema de tipografia premium
export const typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font sizes (novo formato)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  // Compatibilidade - formato antigo
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  // Font weights (para compatibilidade)
  fontWeights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
};

// Sistema de espaçamento premium
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
  // Compatibilidade - índices numéricos
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
};

// Sistema de bordas arredondadas
export const radii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

// Sistema de sombras premium
export const shadows = {
  none: 'none',
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  // Compatibilidade
  base: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  xl: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 10,
  },
};

// Sistema de z-index
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Configurações de animação
export const animations = {
  durations: {
    fastest: 50,
    faster: 100,
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 400,
    slowest: 500,
  },
  
  easings: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// Dimensões da tela
export const screen = {
  width,
  height,
  isSmall: width < breakpoints.sm,
  isMedium: width >= breakpoints.sm && width < breakpoints.lg,
  isLarge: width >= breakpoints.lg,
};

// Tema completo
export const theme = {
  colors: {
    ...colors,
    // Compatibilidade - profiles removidos mas com fallback
    profiles: {
      admin: {
        primary: colors.primary[600],
        secondary: colors.secondary[500],
        background: colors.background,
        surface: colors.surface,
      },
      supplier: {
        primary: colors.primary[500],
        secondary: colors.secondary[500],
        background: colors.background,
        surface: colors.surface,
      },
      customer: {
        primary: colors.primary[500],
        secondary: colors.secondary[500],
        background: colors.background,
        surface: colors.surface,
      },
    },
    // Gradientes antigos para compatibilidade
    gradients: {
      primary: [colors.primary[400], colors.primary[600]],
      secondary: [colors.secondary[300], colors.secondary[500]],
      tertiary: [colors.tertiary[300], colors.primary[500]],
    },
    // Adicionando cores com índices numéricos para compatibilidade
    primary: {
      ...colors.primary,
      0: colors.primary[50],
    },
    secondary: {
      ...colors.secondary,
      0: colors.secondary[50],
    },
    tertiary: {
      ...colors.tertiary,
      0: colors.tertiary[50],
    },
    gray: {
      ...colors.gray,
      0: colors.gray[50],
    },
    neutral: {
      ...colors.neutral,
      0: colors.neutral[50],
    },
  },
  spacing,
  typography,
  radii,
  shadows,
  
  // Gradientes temáticos da padaria
  gradients: {
    primary: [colors.primary[400], colors.primary[600]],
    secondary: [colors.secondary[300], colors.secondary[500]],
    warm: [colors.tertiary[300], colors.primary[500]],
    bread: [colors.bread, colors.crust],
    golden: [colors.honey, colors.wheat],
    cream: [colors.flour, colors.cream],
  },
  
  // Padrão de fundo com pãezinhos (será usado como background pattern)
  backgroundPattern: {
    bread: {
      opacity: 0.03,
      color: colors.primary[500],
      pattern: '🥖🥐🍞🥯', // Emojis de pães para pattern
    }
  }
};

export default theme; 