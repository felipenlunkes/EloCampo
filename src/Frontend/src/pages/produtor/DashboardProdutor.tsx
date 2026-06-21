import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SidebarProdutor } from '../../components/layout/Sidebar';
import {
  buscarContaPorId,
  buscarPedidoPorIdComprador,
  buscarPedidoPorIdVendedor,
  buscarProdutos,
  buscarProdutosPorVendedor,
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  AccountResponse,
  OrderItem,
  OrderResponse,
  PRODUCT_CATEGORY,
  PRODUCT_SCALE,
  OrderStatusEnum,
  type ProductCategory,
  type ProductResponse,
} from '../../types';

export default function DashboardProdutor() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>();
  const [conta, setConta] = useState<AccountResponse>();
  const [evaluation, setEvaluation] = useState<number>();
  const [produtos, setProdutos] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    var accountId = session?.account?.id;

    accountId &&
      Promise.allSettled([
        buscarContaPorId(accountId).then((a) => {
          setConta(a);
          var evaluation = a?.evaluation?.reduce((sum, a) => sum + a.stars, 0) ?? 0;

          setEvaluation(0);

          if (evaluation != 0 && a.evaluation) {
            var evaluationMean = evaluation / a.evaluation.length;
            setEvaluation(evaluationMean);
          }
        }),

        buscarProdutosPorVendedor(accountId).then((p) => setProdutos(p)),
        buscarPedidoPorIdVendedor(accountId).then((o) => setOrders(o.content)),
      ]).finally(() => setLoading(false));
  }, []);

  const ativos = produtos.filter((p) => p.status === 'AVAILABLE').length;

  return (
    <div className="app-shell">
      <SidebarProdutor />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h2 className="topbar-title">Início</h2>
            <p className="topbar-sub">Olá, {session?.account?.name ?? session?.email}!</p>
            {session?.account?.businessName && (
              <p style={{ fontSize: 11, color: '#3d6b3f', marginTop: 1 }}>
                {session.account.businessName}
              </p>
            )}
          </div>
          <Link to="/produtor/produtos">
            <button className="btn btn-prim">+ Novo produto</button>
          </Link>
        </div>
        <div className="page-body">
          <div className="stat-grid">
            <div className="stat-card">
              <div style={{ fontSize: 20, marginBottom: 6 }}>🌾</div>
              <div className="stat-value">{ativos}</div>
              <div className="stat-label">Produtos ativos</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: 20, marginBottom: 6 }}>📦</div>
              <div className="stat-value">{produtos.length}</div>
              <div className="stat-label">Total cadastrado</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: 20, marginBottom: 6 }}>💬</div>
              <div className="stat-value">
                {orders?.filter((o) => OrderStatusEnum.PENDING === o.orderStatus).length}
              </div>
              <div className="stat-label">Em negociação</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: 20, marginBottom: 6 }}>⭐</div>
              <div className="stat-value" style={{ color: 'var(--gold)' }}>
                <div className="stat-value">{evaluation}</div>
              </div>
              <div className="stat-label">Avaliações</div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">
              Produtos recentes{' '}
              <Link
                to="/produtor/produtos"
                style={{ color: 'var(--g300)', fontSize: 12, fontWeight: 400 }}
              >
                Ver todos →
              </Link>
            </div>
            {loading && (
              <div className="empty">
                <div className="empty-icon">⏳</div>Carregando...
              </div>
            )}
            {!loading && produtos.length === 0 && (
              <div className="empty">
                <div className="empty-icon">🌱</div>
                Nenhum produto ainda.
                <br />
                <Link
                  to="/produtor/produtos"
                  className="btn btn-prim btn-sm"
                  style={{ marginTop: 12, display: 'inline-flex' }}
                >
                  Adicionar primeiro produto
                </Link>
              </div>
            )}
            {!loading && produtos.length > 0 && (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 12,
                  tableLayout: 'fixed',
                }}
              >
                <colgroup>
                  <col />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 80 }} />
                  <col style={{ width: 90 }} />
                </colgroup>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '5px 8px',
                        fontSize: 10,
                        color: 'var(--text4)',
                        fontWeight: 500,
                      }}
                    >
                      Descrição
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '5px 8px',
                        fontSize: 10,
                        color: 'var(--text4)',
                        fontWeight: 500,
                      }}
                    >
                      Categoria
                    </th>
                    <th
                      style={{
                        textAlign: 'center',
                        padding: '5px 8px',
                        fontSize: 10,
                        color: 'var(--text4)',
                        fontWeight: 500,
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        textAlign: 'right',
                        padding: '5px 8px',
                        fontSize: 10,
                        color: 'var(--text4)',
                        fontWeight: 500,
                      }}
                    >
                      Preço
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.slice(0, 5).map((p) => (
                    <tr key={p.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                      <td
                        style={{ padding: '8px', fontWeight: 500, color: 'var(--text)' }}
                      >
                        {p.description}
                      </td>
                      <td style={{ padding: '8px', color: 'var(--text2)' }}>
                        {PRODUCT_CATEGORY.find((c) => c.v === p.category)?.label ??
                          p.category}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span className="tag tag-green">Disponível</span>
                      </td>
                      <td
                        style={{
                          padding: '8px',
                          textAlign: 'right',
                          color: 'var(--g300)',
                          fontWeight: 500,
                        }}
                      >
                        R${' '}
                        {Number(p.price).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                        /{PRODUCT_SCALE.find((c) => c.v === p.scale)?.label ?? p.scale}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
