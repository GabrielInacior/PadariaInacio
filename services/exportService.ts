import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface RelatorioData {
  vendas_periodo: {
    total_vendas: number;
    total_pedidos: number;
    total_itens: number;
  };
  produtos_mais_vendidos: Array<{
    nome: string;
    quantidade_vendida: number;
    receita_total: number;
  }>;
  vendas_por_categoria: Array<{
    categoria: string;
    total_produtos: number;
    total_vendas: number;
    preco_medio: number;
  }>;
  periodo_analise: string;
}

class ExportService {
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private generateReportHTML(data: RelatorioData): string {
    const now = new Date();
    const ticketMedio = data.vendas_periodo.total_pedidos > 0 
      ? data.vendas_periodo.total_vendas / data.vendas_periodo.total_pedidos 
      : 0;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório de Vendas - Padaria Inácio</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #fefdfb;
          color: #1c1917;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #C17817;
          padding-bottom: 20px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #C17817;
          margin-bottom: 5px;
        }
        .subtitle {
          color: #8B4513;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .report-info {
          background: linear-gradient(135deg, #C17817, #8B4513);
          color: white;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .period {
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .date {
          font-size: 12px;
          opacity: 0.9;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-left: 4px solid #C17817;
        }
        .summary-label {
          font-size: 12px;
          color: #737373;
          margin-bottom: 5px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: #1c1917;
        }
        .section {
          background: white;
          margin-bottom: 25px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .section-header {
          background: #F4A460;
          color: #4A2C0A;
          padding: 15px 20px;
          font-size: 16px;
          font-weight: bold;
          border-bottom: 2px solid #C17817;
        }
        .section-content {
          padding: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e5e5;
        }
        th {
          background-color: #fdf8f3;
          font-weight: 600;
          color: #4A2C0A;
          font-size: 14px;
        }
        td {
          font-size: 13px;
        }
        .number {
          text-align: right;
          font-weight: 600;
        }
        .currency {
          color: #059669;
          font-weight: bold;
        }
        .ranking {
          width: 30px;
          height: 30px;
          background: #C17817;
          color: white;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          color: #737373;
          font-size: 12px;
        }
        .progress-bar {
          background: #e5e5e5;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 5px;
        }
        .progress-fill {
          background: #C17817;
          height: 100%;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🥖 Padaria Inácio</div>
        <div class="subtitle">Tradição em cada pão</div>
        <div class="report-info">
          <div class="period">Relatório de Vendas - ${data.periodo_analise}</div>
          <div class="date">Gerado em ${this.formatDate(now)}</div>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Total de Vendas</div>
          <div class="summary-value">${this.formatCurrency(data.vendas_periodo.total_vendas)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total de Pedidos</div>
          <div class="summary-value">${this.formatNumber(data.vendas_periodo.total_pedidos)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Itens Vendidos</div>
          <div class="summary-value">${this.formatNumber(data.vendas_periodo.total_itens)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Ticket Médio</div>
          <div class="summary-value">${this.formatCurrency(ticketMedio)}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">🏆 Produtos Mais Vendidos</div>
        <div class="section-content">
          <table>
            <thead>
              <tr>
                <th>Pos.</th>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Receita Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.produtos_mais_vendidos.map((produto, index) => `
                <tr>
                  <td><span class="ranking">${index + 1}</span></td>
                  <td>${produto.nome}</td>
                  <td class="number">${this.formatNumber(produto.quantidade_vendida)} un.</td>
                  <td class="number currency">${this.formatCurrency(produto.receita_total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <div class="section-header">📊 Vendas por Categoria</div>
        <div class="section-content">
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Produtos</th>
                <th>Total Vendas</th>
                <th>Preço Médio</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              ${data.vendas_por_categoria.map((categoria) => {
                const maxVendas = Math.max(...data.vendas_por_categoria.map(c => c.total_vendas));
                const percentage = maxVendas > 0 ? (categoria.total_vendas / maxVendas) * 100 : 0;
                return `
                  <tr>
                    <td><strong>${categoria.categoria}</strong></td>
                    <td class="number">${categoria.total_produtos}</td>
                    <td class="number currency">${this.formatCurrency(categoria.total_vendas)}</td>
                    <td class="number">${this.formatCurrency(categoria.preco_medio)}</td>
                    <td>
                      <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                      </div>
                      <small>${percentage.toFixed(1)}%</small>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="footer">
        <p><strong>Padaria Inácio</strong> - Sistema de Gestão</p>
        <p>Relatório gerado automaticamente em ${this.formatDate(now)}</p>
        <p>© 2024 Padaria Inácio. Todos os direitos reservados.</p>
      </div>
    </body>
    </html>
    `;
  }

  async exportToPDF(data: RelatorioData): Promise<void> {
    try {
      const html = this.generateReportHTML(data);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 612, // A4 width in points
        height: 792, // A4 height in points
      });

      // Criar nome do arquivo
      const fileName = `relatorio-vendas-${data.periodo_analise}-${new Date().toISOString().split('T')[0]}.pdf`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;

      // Mover arquivo para documentos
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      // Compartilhar arquivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar Relatório de Vendas',
        });
      }

      console.log('PDF exportado com sucesso:', newUri);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      throw new Error('Não foi possível exportar o relatório em PDF');
    }
  }

  async exportToHTML(data: RelatorioData): Promise<void> {
    try {
      const html = this.generateReportHTML(data);
      
      // Criar nome do arquivo
      const fileName = `relatorio-vendas-${data.periodo_analise}-${new Date().toISOString().split('T')[0]}.html`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Salvar HTML
      await FileSystem.writeAsStringAsync(fileUri, html, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Compartilhar arquivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'Compartilhar Relatório de Vendas',
        });
      }

      console.log('HTML exportado com sucesso:', fileUri);
    } catch (error) {
      console.error('Erro ao exportar HTML:', error);
      throw new Error('Não foi possível exportar o relatório em HTML');
    }
  }

  async shareReport(data: RelatorioData, format: 'pdf' | 'html' = 'pdf'): Promise<void> {
    if (format === 'pdf') {
      await this.exportToPDF(data);
    } else {
      await this.exportToHTML(data);
    }
  }
}

export const exportService = new ExportService(); 