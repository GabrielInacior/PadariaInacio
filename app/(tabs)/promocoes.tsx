import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Clipboard } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../../utils/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Promocao, CupomDesconto, Produto } from '../../types';

const PromocoesScreen = () => {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [cupons, setCupons] = useState<CupomDesconto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabAtiva, setTabAtiva] = useState<'promocoes' | 'cupons'>('promocoes');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      
      // Dados mockados
      const promocoesData: Promocao[] = [
        {
          id: 1,
          nome: 'Black Friday',
          descricao: '50% de desconto em produtos selecionados',
          tipo: 'percentual',
          valor_desconto: 50,
          data_inicio: '2024-01-15',
          data_fim: '2024-01-31',
          limite_uso: 100,
          limite_por_cliente: 1,
          usos_realizados: 75,
          ativo: true,
          produtos_aplicaveis: undefined,
          categorias_aplicaveis: undefined,
          primeira_compra_apenas: false,
        },
        {
          id: 2,
          nome: 'Frete Grátis',
          descricao: 'Frete grátis para pedidos acima de R$ 50',
          tipo: 'frete_gratis',
          valor_desconto: 0,
          data_inicio: '2024-01-01',
          data_fim: '2024-12-31',
          limite_uso: undefined,
          limite_por_cliente: undefined,
          usos_realizados: 1250,
          ativo: true,
          produtos_aplicaveis: undefined,
          categorias_aplicaveis: undefined,
          primeira_compra_apenas: false,
        },
      ];

      const cuponsData: CupomDesconto[] = [
        {
          id: 1,
          codigo: 'BEMVINDO10',
          promocao_id: 1,
          cliente_id: undefined,
          usado: false,
          data_uso: undefined,
          pedido_id: undefined,
          data_criacao: '2024-01-01',
          data_expiracao: '2024-12-31',
        },
        {
          id: 2,
          codigo: 'FRETEGRATIS',
          promocao_id: 2,
          cliente_id: undefined,
          usado: false,
          data_uso: undefined,
          pedido_id: undefined,
          data_criacao: '2024-01-01',
          data_expiracao: '2024-12-31',
        },
      ];

      setPromocoes(promocoesData);
      setCupons(cuponsData);
    } catch (error) {
      console.error('Erro ao carregar promoções:', error);
      Alert.alert('Erro', 'Não foi possível carregar as promoções');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  };

  const copiarCupom = async (codigo: string) => {
    try {
      Clipboard.setString(codigo);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copiado!', `Cupom ${codigo} copiado para a área de transferência`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar o cupom');
    }
  };

  const aplicarPromocao = (promocao: Promocao) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Promoção Aplicada!',
      `${promocao.nome} será aplicada no seu próximo pedido.`,
      [{ text: 'OK' }]
    );
  };

  const renderPromocao = ({ item: promocao, index }: { item: Promocao; index: number }) => {
    const diasRestantes = Math.ceil((new Date(promocao.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 100)}>
        <Card style={{ marginBottom: 16 }}>
          <LinearGradient
            colors={[theme.colors.primary[500] + '20', theme.colors.secondary[500] + '10']}
            style={{ borderRadius: 16 }}
          >
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View
                      style={{
                        backgroundColor: theme.colors.primary[500],
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        marginRight: 8,
                      }}
                    >
                      <Text style={{ color: theme.colors.white, fontSize: 12, fontWeight: '600' }}>
                        {promocao.tipo === 'percentual' ? `${promocao.valor_desconto}% OFF` :
                         promocao.tipo === 'valor_fixo' ? `R$ ${promocao.valor_desconto} OFF` :
                         promocao.tipo === 'frete_gratis' ? 'FRETE GRÁTIS' : 'PROMOÇÃO'}
                      </Text>
                    </View>
                    {diasRestantes <= 3 && (
                      <View
                        style={{
                          backgroundColor: theme.colors.error[500],
                          borderRadius: 20,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        }}
                      >
                        <Text style={{ color: theme.colors.white, fontSize: 10, fontWeight: '600' }}>
                          ÚLTIMOS DIAS
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: theme.colors.text,
                      marginBottom: 8,
                    }}
                  >
                    {promocao.nome}
                  </Text>
                  
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.gray[600],
                      marginBottom: 12,
                      lineHeight: 20,
                    }}
                  >
                    {promocao.descricao}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 12, color: theme.colors.gray[500] }}>
                    Válida até
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
                    {new Date(promocao.data_fim).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                
                <View>
                  <Text style={{ fontSize: 12, color: theme.colors.gray[500] }}>
                    Restam
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
                    {diasRestantes} dias
                  </Text>
                </View>
              </View>

              <Button
                onPress={() => aplicarPromocao(promocao)}
                variant="primary"
                style={{ marginTop: 8 }}
              >
                Aplicar Promoção
              </Button>
            </View>
          </LinearGradient>
        </Card>
      </Animated.View>
    );
  };

  const renderCupom = ({ item: cupom, index }: { item: CupomDesconto; index: number }) => {
    const promocao = promocoes.find(p => p.id === cupom.promocao_id);
    if (!promocao) return null;

    return (
      <Animated.View entering={FadeInDown.delay(index * 100)}>
        <Card style={{ marginBottom: 16 }}>
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.colors.text,
                    marginBottom: 4,
                  }}
                >
                  {promocao.nome}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.colors.gray[600],
                  }}
                >
                  {promocao.descricao}
                </Text>
              </View>
              
              <View
                style={{
                  backgroundColor: theme.colors.primary[500] + '20',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: theme.colors.primary[500], fontSize: 12, fontWeight: '600' }}>
                  CUPOM
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: theme.colors.gray[100],
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: theme.colors.primary[500],
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: theme.colors.gray[500], marginBottom: 4 }}>
                    Código do cupom
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: theme.colors.primary[500],
                      letterSpacing: 2,
                    }}
                  >
                    {cupom.codigo}
                  </Text>
                </View>
                
                <TouchableOpacity
                  onPress={() => copiarCupom(cupom.codigo)}
                  style={{
                    backgroundColor: theme.colors.primary[500],
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ color: theme.colors.white, fontWeight: '600' }}>
                    Copiar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 12, color: theme.colors.gray[500] }}>
                  Válido até
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
                  {new Date(cupom.data_expiracao).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              
              <View>
                <Text style={{ fontSize: 12, color: theme.colors.gray[500] }}>
                  Status
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.colors.success[500],
                  }}
                >
                  Disponível
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </Animated.View>
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
        { key: 'promocoes', label: 'Promoções' },
        { key: 'cupons', label: 'Cupons' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => setTabAtiva(tab.key as any)}
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 20,
            backgroundColor: tabAtiva === tab.key ? theme.colors.white : 'transparent',
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontWeight: '600',
              color: tabAtiva === tab.key ? theme.colors.primary[500] : theme.colors.gray[500],
            }}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.colors.text }}>Carregando promoções...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header com gradiente */}
      <LinearGradient
        colors={[theme.colors.secondary[500], theme.colors.error[500]]}
        style={{ paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: theme.colors.white }}>
              Promoções
            </Text>
            <Text style={{ fontSize: 16, color: theme.colors.white + 'CC', marginTop: 4 }}>
              Ofertas especiais para você
            </Text>
          </View>
          
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.white + '20',
              borderRadius: 20,
              padding: 12,
            }}
          >
            <Ionicons name="gift" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      {renderTabs()}

      {/* Conteúdo */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[500]]}
            tintColor={theme.colors.primary[500]}
          />
        }
      >
        {tabAtiva === 'promocoes' && promocoes.map((promocao, index) => (
          <View key={promocao.id}>
            {renderPromocao({ item: promocao, index })}
          </View>
        ))}

        {tabAtiva === 'cupons' && cupons.map((cupom, index) => (
          <View key={cupom.id}>
            {renderCupom({ item: cupom, index })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PromocoesScreen; 