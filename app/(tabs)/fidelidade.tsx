import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useSharedValue, 
  withSpring,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PontosFidelidade, NivelFidelidade } from '../../types';

const { width } = Dimensions.get('window');

const FidelidadeScreen = () => {
  const [pontos, setPontos] = useState<PontosFidelidade[]>([]);
  const [niveis, setNiveis] = useState<NivelFidelidade[]>([]);
  const [pontosAtuais, setPontosAtuais] = useState(2450);
  const [nivelAtual, setNivelAtual] = useState<NivelFidelidade | null>(null);
  const [proximoNivel, setProximoNivel] = useState<NivelFidelidade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabAtiva, setTabAtiva] = useState<'pontos' | 'historico' | 'recompensas'>('pontos');
  
  const scrollY = useSharedValue(0);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      
      // Simulando dados do programa de fidelidade
      const niveisData: NivelFidelidade[] = [
        {
          id: 1,
          nome: 'Bronze',
          pontos_minimos: 0,
          pontos_maximos: 999,
          percentual_cashback: 2,
          desconto_aniversario: 5,
          frete_gratis: false,
          cor_badge: '#CD7F32',
          beneficios: JSON.stringify([
            '2% de cashback em pontos',
            '5% de desconto no aniversário',
            'Acesso às promoções exclusivas'
          ]),
        },
        {
          id: 2,
          nome: 'Prata',
          pontos_minimos: 1000,
          pontos_maximos: 2999,
          percentual_cashback: 4,
          desconto_aniversario: 10,
          frete_gratis: false,
          cor_badge: '#C0C0C0',
          beneficios: JSON.stringify([
            '4% de cashback em pontos',
            '10% de desconto no aniversário',
            'Frete grátis em compras acima de R$ 50',
            'Acesso antecipado a promoções'
          ]),
        },
        {
          id: 3,
          nome: 'Ouro',
          pontos_minimos: 3000,
          pontos_maximos: 7999,
          percentual_cashback: 6,
          desconto_aniversario: 15,
          frete_gratis: true,
          cor_badge: '#FFD700',
          beneficios: JSON.stringify([
            '6% de cashback em pontos',
            '15% de desconto no aniversário',
            'Frete grátis em todas as compras',
            'Suporte prioritário',
            'Produtos exclusivos'
          ]),
        },
        {
          id: 4,
          nome: 'Platina',
          pontos_minimos: 8000,
          pontos_maximos: undefined,
          percentual_cashback: 8,
          desconto_aniversario: 20,
          frete_gratis: true,
          cor_badge: '#E5E4E2',
          beneficios: JSON.stringify([
            '8% de cashback em pontos',
            '20% de desconto no aniversário',
            'Frete grátis em todas as compras',
            'Atendimento VIP exclusivo',
            'Produtos exclusivos',
            'Eventos especiais',
            'Desconto progressivo por fidelidade'
          ]),
        },
      ];

      const pontosData: PontosFidelidade[] = [
        {
          id: 1,
          cliente_id: 1,
          pontos: 150,
          tipo: 'ganho',
          descricao: 'Compra no valor de R$ 75,00',
          pedido_id: 123,
          data_movimentacao: '2024-01-15T10:30:00',
          data_expiracao: '2025-01-15T10:30:00',
        },
        {
          id: 2,
          cliente_id: 1,
          pontos: -50,
          tipo: 'resgate',
          descricao: 'Resgate: Desconto de R$ 5,00',
          pedido_id: 124,
          data_movimentacao: '2024-01-14T14:20:00',
          data_expiracao: undefined,
        },
        {
          id: 3,
          cliente_id: 1,
          pontos: 200,
          tipo: 'bonus',
          descricao: 'Bônus de aniversário',
          pedido_id: undefined,
          data_movimentacao: '2024-01-10T09:00:00',
          data_expiracao: '2025-01-10T09:00:00',
        },
        {
          id: 4,
          cliente_id: 1,
          pontos: 100,
          tipo: 'ganho',
          descricao: 'Compra no valor de R$ 50,00',
          pedido_id: 122,
          data_movimentacao: '2024-01-08T16:45:00',
          data_expiracao: '2025-01-08T16:45:00',
        },
      ];

      setNiveis(niveisData);
      setPontos(pontosData);
      
      // Determinar nível atual e próximo
      const nivelAtualData = niveisData.find(n => 
        pontosAtuais >= n.pontos_minimos && 
        (!n.pontos_maximos || pontosAtuais <= n.pontos_maximos)
      );
      
      const proximoNivelData = niveisData.find(n => 
        n.pontos_minimos > pontosAtuais
      );
      
      setNivelAtual(nivelAtualData || niveisData[0]);
      setProximoNivel(proximoNivelData || null);
      
    } catch (error) {
      console.error('Erro ao carregar dados de fidelidade:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do programa de fidelidade');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  };

  const resgatarPontos = (pontosNecessarios: number, descricao: string) => {
    if (pontosAtuais >= pontosNecessarios) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Resgate Realizado!',
        `Você resgatou: ${descricao}\nPontos utilizados: ${pontosNecessarios}`,
        [{ text: 'OK', onPress: () => {} }]
      );
      setPontosAtuais(prev => prev - pontosNecessarios);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Pontos Insuficientes',
        `Você precisa de ${pontosNecessarios - pontosAtuais} pontos a mais para este resgate.`
      );
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0.9]);
    const translateY = interpolate(scrollY.value, [0, 100], [0, -10]);
    
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const renderCartaoFidelidade = () => {
    if (!nivelAtual) return null;
    
    const progressoProximoNivel = proximoNivel ? 
      ((pontosAtuais - nivelAtual.pontos_minimos) / (proximoNivel.pontos_minimos - nivelAtual.pontos_minimos)) * 100 : 100;
    
    return (
      <Animated.View entering={FadeInDown.delay(100)}>
        <Card style={{ margin: 20, marginBottom: 0 }}>
          <LinearGradient
            colors={[nivelAtual.cor_badge + '40', nivelAtual.cor_badge + '20']}
            style={{ borderRadius: 16 }}
          >
            <View style={{ padding: 24 }}>
              {/* Header do cartão */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <View>
                  <Text style={{ fontSize: 16, color: theme.colors.gray[600] }}>
                    Programa de Fidelidade
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: theme.colors.text }}>
                    Nível {nivelAtual.nome}
                  </Text>
                </View>
                
                <View
                  style={{
                    backgroundColor: nivelAtual.cor_badge,
                    borderRadius: 25,
                    padding: 12,
                  }}
                >
                  <Ionicons name="diamond" size={24} color={theme.colors.white} />
                </View>
              </View>

              {/* Pontos atuais */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 48, fontWeight: '800', color: theme.colors.primary[500] }}>
                  {pontosAtuais.toLocaleString()}
                </Text>
                <Text style={{ fontSize: 16, color: theme.colors.gray[600] }}>
                  pontos disponíveis
                </Text>
              </View>

              {/* Progresso para próximo nível */}
              {proximoNivel && (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, color: theme.colors.gray[600] }}>
                      Próximo nível: {proximoNivel.nome}
                    </Text>
                    <Text style={{ fontSize: 14, color: theme.colors.gray[600] }}>
                      {proximoNivel.pontos_minimos - pontosAtuais} pontos restantes
                    </Text>
                  </View>
                  
                  <View
                    style={{
                      height: 8,
                      backgroundColor: theme.colors.gray[200],
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <Animated.View
                      style={{
                        height: '100%',
                        width: `${Math.min(progressoProximoNivel, 100)}%`,
                        backgroundColor: nivelAtual.cor_badge,
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
          </LinearGradient>
        </Card>
      </Animated.View>
    );
  };

  const renderBeneficios = () => {
    if (!nivelAtual) return null;
    
    const beneficios = JSON.parse(nivelAtual.beneficios);
    
    return (
      <Animated.View entering={FadeInDown.delay(200)}>
        <View style={{ margin: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 16 }}>
            Seus Benefícios
          </Text>
          
          {beneficios.map((beneficio: string, index: number) => (
            <Animated.View key={index} entering={FadeInRight.delay(index * 100)}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                                      backgroundColor: theme.colors.success[500] + '10',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    backgroundColor: theme.colors.success[500],
                    borderRadius: 20,
                    padding: 6,
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                </View>
                
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: theme.colors.text,
                    lineHeight: 22,
                  }}
                >
                  {beneficio}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderHistoricoPontos = ({ item: ponto, index }: { item: PontosFidelidade; index: number }) => {
    const isGanho = ponto.tipo === 'ganho' || ponto.tipo === 'bonus';
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <Card style={{ marginBottom: 12 }}>
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View
                    style={{
                      backgroundColor: isGanho ? theme.colors.success[500] : theme.colors.warning[500],
                      borderRadius: 20,
                      padding: 6,
                      marginRight: 12,
                    }}
                  >
                    <Ionicons 
                      name={isGanho ? 'add' : 'remove'} 
                      size={16} 
                      color={theme.colors.white} 
                    />
                  </View>
                  
                  <View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                      }}
                    >
                      {ponto.descricao}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.gray[600],
                        marginTop: 2,
                      }}
                    >
                      {new Date(ponto.data_movimentacao).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                
                {ponto.data_expiracao && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.warning[500],
                      marginLeft: 42,
                    }}
                  >
                    Expira em: {new Date(ponto.data_expiracao).toLocaleDateString('pt-BR')}
                  </Text>
                )}
              </View>
              
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: isGanho ? theme.colors.success[500] : theme.colors.warning[500],
                }}
              >
                {isGanho ? '+' : ''}{ponto.pontos}
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderRecompensas = () => {
    const recompensas = [
      { id: 1, titulo: 'R$ 5 de desconto', pontos: 500, descricao: 'Desconto de R$ 5 em qualquer compra' },
      { id: 2, titulo: 'R$ 10 de desconto', pontos: 1000, descricao: 'Desconto de R$ 10 em qualquer compra' },
      { id: 3, titulo: 'Frete grátis', pontos: 300, descricao: 'Frete grátis na próxima compra' },
      { id: 4, titulo: 'Pão francês grátis', pontos: 200, descricao: '10 unidades de pão francês' },
      { id: 5, titulo: 'Café expresso grátis', pontos: 350, descricao: 'Um café expresso cortesia' },
      { id: 6, titulo: 'R$ 25 de desconto', pontos: 2500, descricao: 'Desconto de R$ 25 em qualquer compra' },
    ];
    
    return (
      <FlatList
        data={recompensas}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        renderItem={({ item: recompensa, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 100)}>
            <Card style={{ marginBottom: 16 }}>
              <View style={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: theme.colors.text,
                        marginBottom: 4,
                      }}
                    >
                      {recompensa.titulo}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.gray[600],
                        marginBottom: 8,
                      }}
                    >
                      {recompensa.descricao}
                    </Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="diamond" size={16} color={theme.colors.primary[500]} />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: theme.colors.primary[500],
                          marginLeft: 4,
                        }}
                      >
                        {recompensa.pontos} pontos
                      </Text>
                    </View>
                  </View>
                  
                  <Button
                    onPress={() => resgatarPontos(recompensa.pontos, recompensa.titulo)}
                    variant={pontosAtuais >= recompensa.pontos ? 'primary' : 'secondary'}
                    isDisabled={pontosAtuais < recompensa.pontos}
                    style={{ minWidth: 100 }}
                  >
                    Resgatar
                  </Button>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[500]]}
            tintColor={theme.colors.primary[500]}
          />
        }
      />
    );
  };

  const renderTabs = () => (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.gray[100],
        borderRadius: 25,
        padding: 4,
        marginHorizontal: 20,
        marginBottom: 20,
      }}
    >
      {[
        { key: 'pontos', title: 'Pontos', icon: 'diamond' },
        { key: 'historico', title: 'Histórico', icon: 'time' },
        { key: 'recompensas', title: 'Resgatar', icon: 'gift' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => {
            setTabAtiva(tab.key as any);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 20,
            backgroundColor: tabAtiva === tab.key ? theme.colors.white : 'transparent',
          }}
        >
          <Ionicons 
            name={tab.icon as any} 
            size={16} 
            color={tabAtiva === tab.key ? theme.colors.primary[500] : theme.colors.gray[500]} 
          />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 14,
              fontWeight: tabAtiva === tab.key ? '600' : '400',
              color: tabAtiva === tab.key ? theme.colors.primary[500] : theme.colors.gray[500],
            }}
          >
            {tab.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (tabAtiva) {
      case 'pontos':
        return (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary[500]]}
                tintColor={theme.colors.primary[500]}
              />
            }
            onScroll={(event) => {
              scrollY.value = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
          >
            {renderCartaoFidelidade()}
            {renderBeneficios()}
          </ScrollView>
        );
      
      case 'historico':
        return (
          <FlatList
            data={pontos}
            renderItem={renderHistoricoPontos}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary[500]]}
                tintColor={theme.colors.primary[500]}
              />
            }
          />
        );
      
      case 'recompensas':
        return renderRecompensas();
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.colors.text }}>Carregando programa de fidelidade...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <Animated.View style={[headerAnimatedStyle]}>
        <LinearGradient
          colors={[theme.colors.tertiary[500], theme.colors.primary[500]]}
          style={{ paddingHorizontal: 20, paddingBottom: 20 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View>
              <Text style={{ fontSize: 28, fontWeight: '700', color: theme.colors.white }}>
                Fidelidade
              </Text>
              <Text style={{ fontSize: 16, color: theme.colors.white + 'CC', marginTop: 4 }}>
                Ganhe pontos e troque por recompensas
              </Text>
            </View>
            
            <View
              style={{
                backgroundColor: theme.colors.white + '20',
                borderRadius: 20,
                padding: 12,
              }}
            >
              <Ionicons name="diamond" size={24} color={theme.colors.white} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      {renderContent()}
    </SafeAreaView>
  );
};

export default FidelidadeScreen; 