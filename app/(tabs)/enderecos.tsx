import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../utils/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Endereco } from '../../types';

const EnderecosScreen = () => {
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [enderecoEditando, setEnderecoEditando] = useState<Endereco | null>(null);

  useEffect(() => {
    carregarEnderecos();
  }, []);

  const carregarEnderecos = async () => {
    try {
      setIsLoading(true);
      
      // Simulando dados de endereços
      const enderecosData: Endereco[] = [
        {
          id: 1,
          usuario_id: 1,
          tipo: 'residencial',
          cep: '01234-567',
          logradouro: 'Rua das Flores, 123',
          numero: '123',
          complemento: 'Apto 45',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          pais: 'Brasil',
          eh_principal: true,
          coordenadas: JSON.stringify({ lat: -23.5505, lng: -46.6333 }),
        },
        {
          id: 2,
          usuario_id: 1,
          tipo: 'comercial',
          cep: '04567-890',
          logradouro: 'Av. Paulista, 1000',
          numero: '1000',
          complemento: '10º andar',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
          pais: 'Brasil',
          eh_principal: false,
          coordenadas: JSON.stringify({ lat: -23.5618, lng: -46.6565 }),
        },
      ];

      setEnderecos(enderecosData);
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
      Alert.alert('Erro', 'Não foi possível carregar os endereços');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarEnderecos();
    setRefreshing(false);
  };

  const definirComoPrincipal = (endereco: Endereco) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const enderecosAtualizados = enderecos.map(e => ({
      ...e,
      eh_principal: e.id === endereco.id
    }));
    setEnderecos(enderecosAtualizados);
    Alert.alert('Sucesso', 'Endereço principal alterado!');
  };

  const editarEndereco = (endereco: Endereco) => {
    setEnderecoEditando(endereco);
    setModalVisible(true);
  };

  const novoEndereco = () => {
    setEnderecoEditando(null);
    setModalVisible(true);
  };

  const excluirEndereco = (endereco: Endereco) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este endereço?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            const enderecosAtualizados = enderecos.filter(e => e.id !== endereco.id);
            setEnderecos(enderecosAtualizados);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      ]
    );
  };

  const renderEndereco = ({ item: endereco, index }: { item: Endereco; index: number }) => {
    const getIconeTipo = (tipo: string) => {
      switch (tipo) {
        case 'residencial':
          return 'home';
        case 'comercial':
          return 'business';
        case 'entrega':
          return 'location';
        default:
          return 'location-outline';
      }
    };

    const getCorTipo = (tipo: string) => {
      switch (tipo) {
        case 'residencial':
          return colors.success[500];
        case 'comercial':
          return colors.info[500];
        case 'entrega':
          return colors.warning[500];
        default:
          return colors.neutral[500];
      }
    };

    return (
      <Animated.View entering={FadeInDown.delay(index * 100)}>
        <Card style={{ marginBottom: spacing[4] }}>
          <View style={{ padding: spacing[5] }}>
            {/* Header do endereço */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[4] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    backgroundColor: getCorTipo(endereco.tipo) + '20',
                    borderRadius: 20,
                    padding: spacing[3],
                    marginRight: spacing[3],
                  }}
                >
                  <Ionicons name={getIconeTipo(endereco.tipo) as any} size={20} color={getCorTipo(endereco.tipo)} />
                </View>
                
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: typography.fontSizes.lg,
                        fontWeight: '600',
                        color: colors.neutral[900],
                        marginRight: spacing[2],
                      }}
                    >
                      {endereco.tipo.charAt(0).toUpperCase() + endereco.tipo.slice(1)}
                    </Text>
                    {endereco.eh_principal && (
                      <View
                        style={{
                          backgroundColor: colors.primary[500],
                          borderRadius: 12,
                          paddingHorizontal: spacing[2],
                          paddingVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.neutral[0],
                            fontSize: 10,
                            fontWeight: '600',
                          }}
                        >
                          PRINCIPAL
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: typography.fontSizes.sm,
                      color: colors.neutral[600],
                      marginTop: 2,
                    }}
                  >
                    CEP: {endereco.cep}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={() => editarEndereco(endereco)}
                style={{
                  backgroundColor: colors.neutral[100],
                  borderRadius: 20,
                  padding: spacing[2],
                }}
              >
                <Ionicons name="pencil" size={16} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            {/* Endereço completo */}
            <View style={{ marginBottom: spacing[4] }}>
              <Text
                style={{
                  fontSize: typography.fontSizes.base,
                  color: colors.neutral[800],
                  lineHeight: 22,
                }}
              >
                {endereco.logradouro}, {endereco.numero}
                {endereco.complemento && `, ${endereco.complemento}`}
              </Text>
              <Text
                style={{
                  fontSize: typography.fontSizes.sm,
                  color: colors.neutral[600],
                  marginTop: 4,
                }}
              >
                {endereco.bairro}, {endereco.cidade} - {endereco.estado}
              </Text>
            </View>

            {/* Ações */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {!endereco.eh_principal && (
                <Button
                  variant="secondary"
                  onPress={() => definirComoPrincipal(endereco)}
                  style={{ flex: 1, marginRight: spacing[3] }}
                >
                  Definir como Principal
                </Button>
              )}
              
              <TouchableOpacity
                onPress={() => excluirEndereco(endereco)}
                style={{
                  backgroundColor: colors.error[50],
                  borderRadius: 20,
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 100,
                }}
              >
                <Text
                  style={{
                    color: colors.error[500],
                    fontSize: typography.fontSizes.sm,
                    fontWeight: '600',
                  }}
                >
                  Excluir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.neutral[600] }}>Carregando endereços...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
      {/* Header */}
      <LinearGradient
        colors={[colors.tertiary[500], colors.primary[500]]}
        style={{ paddingHorizontal: spacing[6], paddingBottom: spacing[6] }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
          <View>
            <Text
              style={{
                fontSize: typography.fontSizes['3xl'],
                fontWeight: '700',
                color: colors.neutral[0],
              }}
            >
              Meus Endereços
            </Text>
            <Text
              style={{
                fontSize: typography.fontSizes.base,
                color: colors.neutral[0] + 'CC',
                marginTop: 4,
              }}
            >
              Gerencie seus endereços de entrega
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={novoEndereco}
            style={{
              backgroundColor: colors.neutral[0] + '20',
              borderRadius: 20,
              padding: spacing[4],
            }}
          >
            <Ionicons name="add" size={24} color={colors.neutral[0]} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Lista de endereços */}
      <FlatList
        data={enderecos}
        renderItem={renderEndereco}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          paddingHorizontal: spacing[6],
          paddingTop: spacing[4],
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
            <Ionicons name="location-outline" size={64} color={colors.neutral[300]} />
            <Text
              style={{
                fontSize: typography.fontSizes.lg,
                color: colors.neutral[500],
                marginTop: spacing[4],
                textAlign: 'center',
              }}
            >
              Nenhum endereço cadastrado
            </Text>
            <Text
              style={{
                fontSize: typography.fontSizes.sm,
                color: colors.neutral[400],
                textAlign: 'center',
                marginTop: spacing[2],
                marginBottom: spacing[6],
              }}
            >
              Adicione um endereço para facilitar suas entregas
            </Text>
            <Button variant="primary" onPress={novoEndereco}>
              Adicionar Endereço
            </Button>
          </View>
        )}
      />

      {/* FAB para adicionar novo endereço */}
      <TouchableOpacity
        onPress={novoEndereco}
        style={{
          position: 'absolute',
          bottom: 30,
          right: 30,
          backgroundColor: colors.primary[500],
          borderRadius: 28,
          width: 56,
          height: 56,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 8,
          shadowColor: colors.neutral[900],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <Ionicons name="add" size={24} color={colors.neutral[0]} />
      </TouchableOpacity>

      {/* Modal para adicionar/editar endereço */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[0] }}>
          <View style={{ padding: spacing[6] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
              <Text
                style={{
                  fontSize: typography.fontSizes['2xl'],
                  fontWeight: '700',
                  color: colors.neutral[900],
                }}
              >
                {enderecoEditando ? 'Editar Endereço' : 'Novo Endereço'}
              </Text>
              
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  backgroundColor: colors.neutral[100],
                  borderRadius: 20,
                  padding: spacing[3],
                }}
              >
                <Ionicons name="close" size={20} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <Text
              style={{
                fontSize: typography.fontSizes.base,
                color: colors.neutral[600],
                textAlign: 'center',
                marginTop: spacing[8],
              }}
            >
              Funcionalidade em desenvolvimento...
            </Text>
            
            <Button
              variant="primary"
              onPress={() => setModalVisible(false)}
              style={{ marginTop: spacing[6] }}
            >
              Fechar
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default EnderecosScreen;
