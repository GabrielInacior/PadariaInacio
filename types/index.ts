// ===== TIPOS DE USUÁRIOS =====
export type TipoUsuario = 'cliente' | 'fornecedor' | 'admin' | 'funcionario' | 'gerente';
export type UserType = TipoUsuario;

// Aliases para compatibilidade
export type User = Usuario;
export type LoginCredentials = {
  email: string;
  senha: string;
};
export type AuthUser = Usuario;
export type Banner = {
  id: number;
  titulo: string;
  descricao?: string;
  imagem: string;
  link?: string;
  ativo: boolean;
  ordem: number;
  data_inicio?: string;
  data_fim?: string;
};
export type Carrinho = ItemCarrinho[];
export type Cupom = CupomDesconto;
export type Entrega = EntregaPedido;
export type Configuracao = ConfiguracaoSistema;
export type Meta = {
  id: number;
  titulo: string;
  valor_objetivo: number;
  valor_atual: number;
  periodo: string;
  tipo: string;
};
export type ProgramaFidelidade = NivelFidelidade;
export type MovimentoPonto = PontosFidelidade;
export type DashboardData = DashboardKPI;

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  tipo: TipoUsuario;
  status: 'ativo' | 'inativo' | 'suspenso';
  foto_perfil?: string;
  data_criacao: string;
  ultimo_acesso?: string;
  nivel_acesso: number; // 1-5 (1=cliente, 5=admin)
  pontos_fidelidade?: number;
  nivel_fidelidade?: 'bronze' | 'prata' | 'ouro' | 'platina';
}

export interface Cliente extends Usuario {
  tipo: 'cliente';
  cpf?: string;
  data_nascimento?: string;
  endereco_principal?: number; // FK para enderecos
  preferencias_notificacao: string; // JSON
  historico_compras?: string; // JSON
}

export interface Fornecedor extends Usuario {
  tipo: 'fornecedor';
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  categoria_fornecedor: string;
  avaliacao_media: number;
  status_aprovacao: 'pendente' | 'aprovado' | 'rejeitado';
}

export interface Funcionario extends Usuario {
  tipo: 'funcionario' | 'gerente';
  cargo: string;
  departamento: string;
  salario?: number;
  data_admissao: string;
  supervisor_id?: number;
  permissoes: string; // JSON
}

// ===== ENDEREÇOS =====
export interface Endereco {
  id: number;
  usuario_id: number;
  tipo: 'residencial' | 'comercial' | 'entrega';
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  eh_principal: boolean;
  coordenadas?: string; // JSON lat/lng
}

// ===== PRODUTOS AVANÇADOS =====
export interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
  categoria_pai_id?: number; // Para subcategorias
  icone?: string;
  cor_tema?: string;
  ativo: boolean;
  ordem_exibicao: number;
  totalProdutos?: number; // Total de produtos na categoria
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  categoria_id: number;
  fornecedor_id?: number;
  sku: string;
  codigo_barras?: string;
  preco_custo: number;
  preco_venda: number;
  preco_promocional?: number;
  margem_lucro: number;
  peso?: number;
  dimensoes?: string; // JSON
  ingredientes?: string;
  informacoes_nutricionais?: string; // JSON
  alergenos?: string;
  validade_dias?: number;
  temperatura_armazenamento?: string;
  imagens: string; // JSON array
  status: 'ativo' | 'inativo' | 'descontinuado';
  destaque: boolean;
  novo: boolean;
  avaliacao_media: number;
  total_avaliacoes: number;
  total_vendas: number;
  data_criacao: string;
  data_atualizacao: string;
  seo_titulo?: string;
  seo_descricao?: string;
  tags?: string; // JSON array
  
  // Propriedades adicionais para compatibilidade
  preco: number; // alias para preco_venda
  categoria: string; // nome da categoria
  ativo: boolean; // alias para status === 'ativo'
  estoque: number; // quantidade em estoque
  estoqueMinimo?: number; // estoque mínimo
  vendas?: number; // alias para total_vendas
  promocao?: boolean; // se tem promoção ativa
  imagem?: string; // imagem principal
}

export interface EstoqueProduto {
  id: number;
  produto_id: number;
  quantidade_atual: number;
  quantidade_minima: number;
  quantidade_maxima: number;
  quantidade_reservada: number;
  localizacao_estoque?: string;
  lote?: string;
  data_fabricacao?: string;
  data_validade?: string;
  custo_medio: number;
  ultima_movimentacao: string;
}

export interface MovimentacaoEstoque {
  id: number;
  produto_id: number;
  tipo: 'entrada' | 'saida' | 'ajuste' | 'transferencia';
  quantidade: number;
  quantidade_anterior: number;
  motivo: string;
  documento_referencia?: string;
  usuario_id: number;
  fornecedor_id?: number;
  data_movimentacao: string;
  observacoes?: string;
}

// ===== PEDIDOS E VENDAS =====
export interface Pedido {
  id: number;
  numero_pedido: string;
  cliente_id: number;
  status: 'carrinho' | 'pendente' | 'confirmado' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';
  tipo: 'balcao' | 'delivery' | 'retirada' | 'online';
  subtotal: number;
  desconto: number;
  taxa_entrega: number;
  total: number;
  forma_pagamento?: string;
  status_pagamento: 'pendente' | 'aprovado' | 'rejeitado' | 'estornado';
  endereco_entrega_id?: number;
  previsao_entrega?: string;
  tempo_preparo_estimado?: number;
  observacoes?: string;
  cupom_desconto_id?: number;
  pontos_utilizados?: number;
  pontos_ganhos?: number;
  avaliacao_cliente?: number;
  comentario_avaliacao?: string;
  data_criacao: string;
  data_atualizacao: string;
  entregador_id?: number;
  comissao_entregador?: number;
}

export interface ItemPedido {
  id: number;
  pedido_id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  observacoes?: string;
  personalizacoes?: string; // JSON
  desconto_item?: number;
}

// ===== CARRINHO DE COMPRAS =====
export interface ItemCarrinho {
  id: number;
  usuario_id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  observacoes?: string;
  personalizacoes?: string; // JSON
  data_adicao: string;
  produto?: Produto; // Para joins
}

// ===== PROMOÇÕES E CUPONS =====
export interface Promocao {
  id: number;
  nome: string;
  descricao: string;
  tipo: 'percentual' | 'valor_fixo' | 'frete_gratis' | 'produto_gratis';
  valor_desconto: number;
  produto_gratis_id?: number;
  valor_minimo_pedido?: number;
  data_inicio: string;
  data_fim: string;
  limite_uso?: number;
  limite_por_cliente?: number;
  usos_realizados: number;
  ativo: boolean;
  produtos_aplicaveis?: string; // JSON array de IDs
  categorias_aplicaveis?: string; // JSON array de IDs
  primeira_compra_apenas: boolean;
}

export interface CupomDesconto {
  id: number;
  codigo: string;
  promocao_id: number;
  cliente_id?: number; // null = cupom público
  usado: boolean;
  data_uso?: string;
  pedido_id?: number;
  data_criacao: string;
  data_expiracao: string;
}

// ===== SISTEMA DE FIDELIDADE =====
export interface PontosFidelidade {
  id: number;
  cliente_id: number;
  pontos: number;
  tipo: 'ganho' | 'resgate' | 'expiracao' | 'bonus';
  descricao: string;
  pedido_id?: number;
  data_movimentacao: string;
  data_expiracao?: string;
}

export interface NivelFidelidade {
  id: number;
  nome: string;
  pontos_minimos: number;
  pontos_maximos?: number;
  percentual_cashback: number;
  desconto_aniversario: number;
  frete_gratis: boolean;
  cor_badge: string;
  beneficios: string; // JSON
}

// ===== AVALIAÇÕES =====
export interface Avaliacao {
  id: number;
  produto_id: number;
  cliente_id: number;
  pedido_id: number;
  nota: number; // 1-5
  comentario?: string;
  fotos?: string; // JSON array
  resposta_loja?: string;
  data_resposta?: string;
  util_positivo: number;
  util_negativo: number;
  data_criacao: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
}

// ===== ENTREGADORES =====
export interface Entregador {
  id: number;
  nome: string;
  telefone: string;
  email?: string;
  cpf: string;
  cnh: string;
  veiculo_tipo: 'moto' | 'bicicleta' | 'carro' | 'a_pe';
  veiculo_placa?: string;
  status: 'ativo' | 'inativo' | 'ocupado' | 'folga';
  avaliacao_media: number;
  total_entregas: number;
  localizacao_atual?: string; // JSON lat/lng
  raio_entrega_km: number;
  comissao_percentual: number;
  data_cadastro: string;
}

export interface EntregaPedido {
  id: number;
  pedido_id: number;
  entregador_id: number;
  status: 'atribuida' | 'coletada' | 'em_transito' | 'entregue' | 'cancelada';
  tempo_estimado_minutos: number;
  distancia_km: number;
  taxa_entrega: number;
  comissao_entregador: number;
  data_atribuicao: string;
  data_coleta?: string;
  data_entrega?: string;
  localizacao_atual?: string; // JSON
  observacoes?: string;
  foto_comprovante?: string;
  avaliacao_cliente?: number;
}

// ===== FINANCEIRO =====
export interface ContaReceber {
  id: number;
  pedido_id: number;
  cliente_id: number;
  valor_original: number;
  valor_pago: number;
  valor_pendente: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  forma_pagamento?: string;
  numero_parcela?: number;
  total_parcelas?: number;
  juros?: number;
  multa?: number;
  desconto?: number;
  observacoes?: string;
}

export interface ContaPagar {
  id: number;
  fornecedor_id: number;
  numero_documento: string;
  descricao: string;
  valor_original: number;
  valor_pago: number;
  valor_pendente: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  categoria: string;
  centro_custo?: string;
  numero_parcela?: number;
  total_parcelas?: number;
  juros?: number;
  multa?: number;
  desconto?: number;
  observacoes?: string;
  anexos?: string; // JSON
}

// ===== NOTIFICAÇÕES =====
export interface Notificacao {
  id: number;
  usuario_id: number;
  titulo: string;
  mensagem: string;
  tipo: 'pedido' | 'promocao' | 'sistema' | 'entrega' | 'pagamento';
  lida: boolean;
  data_criacao: string;
  data_leitura?: string;
  dados_extras?: string; // JSON
  push_enviado: boolean;
  email_enviado: boolean;
}

// ===== CONFIGURAÇÕES =====
export interface ConfiguracaoSistema {
  id: number;
  chave: string;
  valor: string;
  tipo: 'string' | 'number' | 'boolean' | 'json';
  categoria: string;
  descricao?: string;
  editavel: boolean;
  data_atualizacao: string;
  usuario_atualizacao: number;
}

// ===== LOGS E AUDITORIA =====
export interface LogSistema {
  id: number;
  usuario_id?: number;
  acao: string;
  tabela_afetada?: string;
  registro_id?: number;
  dados_anteriores?: string; // JSON
  dados_novos?: string; // JSON
  ip_origem?: string;
  user_agent?: string;
  data_acao: string;
  nivel: 'info' | 'warning' | 'error' | 'critical';
}

// ===== DASHBOARD E ANALYTICS =====
export interface DashboardKPI {
  vendas_hoje: number;
  vendas_mes: number;
  pedidos_pendentes: number;
  clientes_ativos: number;
  produtos_estoque_baixo: number;
  receita_total: number;
  ticket_medio: number;
  taxa_conversao: number;
  avaliacoes_media: number;
  entregas_tempo: number;
}

export interface RelatorioVendas {
  periodo: string;
  total_vendas: number;
  total_pedidos: number;
  ticket_medio: number;
  produto_mais_vendido: string;
  categoria_mais_vendida: string;
  horario_pico: string;
  crescimento_percentual: number;
}

// ===== TIPOS DE FILTROS E BUSCA =====
export interface FiltrosProdutos {
  categoria_id?: number;
  preco_min?: number;
  preco_max?: number;
  avaliacao_min?: number;
  apenas_promocao?: boolean;
  apenas_novos?: boolean;
  apenas_destaque?: boolean;
  ordenacao?: 'nome' | 'preco_asc' | 'preco_desc' | 'avaliacao' | 'vendas';
  busca?: string;
}

export interface FiltrosPedidos {
  status?: string[];
  data_inicio?: string;
  data_fim?: string;
  cliente_id?: number;
  valor_min?: number;
  valor_max?: number;
  tipo?: string;
  forma_pagamento?: string;
}

// ===== NAVEGAÇÃO E PERFIS =====
export interface PerfilNavegacao {
  usuario: Usuario;
  permissoes: string[];
  menu_items: MenuItem[];
  dashboard_widgets: string[];
}

export interface MenuItem {
  id: string;
  titulo: string;
  icone: string;
  rota: string;
  badge?: number;
  submenu?: MenuItem[];
  permissao_requerida?: string;
}

// ===== TIPOS DE RESPOSTA DA API =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== TIPOS DE CONTEXTO =====
export interface AuthContextType {
  user: Usuario | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: Partial<Usuario>) => Promise<boolean>;
  updateProfile: (userData: Partial<Usuario>) => Promise<boolean>;
  isLoading: boolean;
}

export interface CartContextType {
  items: ItemCarrinho[];
  total: number;
  itemCount: number;
  addItem: (produto: Produto, quantidade: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantidade: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyDiscount: (cupom: string) => Promise<boolean>;
}

// ===== TIPOS DE COMPONENTES UI =====
export interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: any;
  toggleTheme: () => void;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// ===== TIPOS DE FORMULÁRIOS =====
export interface FormularioProduto {
  nome: string;
  descricao: string;
  categoria_id: number;
  preco_venda: number;
  preco_custo: number;
  sku: string;
  peso?: number;
  ingredientes?: string;
  imagens: string[];
  status: 'ativo' | 'inativo';
}

export interface FormularioUsuario {
  nome: string;
  email: string;
  telefone?: string;
  tipo: TipoUsuario;
  senha?: string;
  confirmar_senha?: string;
}

export interface FormularioPedido {
  cliente_id: number;
  items: {
    produto_id: number;
    quantidade: number;
    observacoes?: string;
  }[];
  endereco_entrega_id?: number;
  observacoes?: string;
  cupom_desconto?: string;
}

// ===== EXPORTS PRINCIPAIS =====
export default {}; 