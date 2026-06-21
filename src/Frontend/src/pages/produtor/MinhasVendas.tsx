import { useEffect, useState } from 'react';
import { SidebarProdutor } from '../../components/layout/Sidebar';
import {
  buscarPedidoPorIdVendedor,
  finalizarPedidoVendedor,
  buscarArquivosPorEntidade,
} from '../../services/api';
import {
  type OrderResponse,
  type OrderStatusChangeInput,
  OrderStatusEnum,
  ORDER_STATUS_LABEL,
  type FileUploadResponse,
} from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function MinhasVendas() {
  const { session } = useAuth();
  const [pedidos, setPedidos] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionado, setSelecionado] = useState<OrderResponse | null>(null);
  const [msg, setMsg] = useState('');
  const [msgs, setMsgs] = useState<{ de: string; texto: string }[]>([
    { de: 'comprador', texto: 'Podemos fechar o pedido?' },
  ]);
  const [fotoComprador, setFotoComprador] = useState<FileUploadResponse | null>(null);

  useEffect(() => {
    const sellerId = session?.account?.id;
    sellerId &&
      buscarPedidoPorIdVendedor(sellerId)
        .then((p) => setPedidos(p.content))
        .catch(() => {})
        .finally(() => setLoading(false));
  }, [selecionado?.orderStatus]);

  useEffect(() => {
    setFotoComprador(null);
    if (selecionado)
      buscarArquivosPorEntidade('PROFILE', selecionado.buyerAccountId)
        .then((imgs) => setFotoComprador(imgs[0] ?? null))
        .catch(() => {});
  }, [selecionado?.id]);

  function enviar() {
    if (!msg.trim()) return;
    setMsgs((m) => [...m, { de: 'eu', texto: msg }]);
    setMsg('');
  }

  // TODO: atualizar a listagem após a troca de status
  async function finalizarVenda() {
    let finishData: OrderStatusChangeInput = {
      status: OrderStatusEnum.COMPLETED,
      note: 'Aceitei essa porcaria e é isso',
    };

    let orderId = selecionado?.id;

    orderId && (await finalizarPedidoVendedor(orderId, finishData));

    setSelecionado((prev) =>
      prev ? { ...prev, orderStatus: OrderStatusEnum.COMPLETED } : null,
    );
  }

  const statusCls = (s: string) =>
    s === 'PENDING'
      ? 'tag tag-gold'
      : s === 'COMPLETED'
        ? 'tag tag-green'
        : 'tag tag-gold';


  return (
    <div className="app-shell">
      <SidebarProdutor />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h2 className="topbar-title">Minhas Vendas</h2>
            <p className="topbar-sub">{pedidos.length} pedido(s)</p>
          </div>
        </div>
        <div
          className="page-body"
          style={{
            display: 'grid',
            gridTemplateColumns: selecionado ? '1fr 1fr' : '1fr',
            gap: 16,
          }}
        >
          <div className="card" style={{ margin: 0 }}>
            {loading && (
              <div className="empty">
                <div className="empty-icon">⏳</div>Carregando...
              </div>
            )}
            {!loading && pedidos.length === 0 && (
              <div className="empty">
                <div className="empty-icon">📋</div>Nenhuma venda ainda.
              </div>
            )}
            {!loading && pedidos.length > 0 && (
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
                  <col style={{ width: 80 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 70 }} />
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
                      Pedido
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
                      Valor
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
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((o, i) => (
                    <tr key={o.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                      <td
                        style={{
                          padding: '8px',
                          fontWeight: 500,
                          color: 'var(--text)',
                          fontSize: 10,
                          fontFamily: 'monospace',
                        }}
                      >
                        {o.id.substring(0, 12)}…
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
                        {Number(o.price).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span className={statusCls(o.orderStatus)}>
                          {ORDER_STATUS_LABEL[o.orderStatus] ?? o.orderStatus}
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() =>
                            setSelecionado(selecionado?.id === o.id ? null : o)
                          }
                        >
                          {selecionado?.id === o.id ? 'Fechar' : 'Detalhes'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selecionado && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card" style={{ margin: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--text)',
                    marginBottom: 4,
                  }}
                >
                  Pedido — R${' '}
                  {Number(selecionado.price).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
                  {selecionado.products.length} item(s) no pedido
                </div>
                <div style={{ marginBottom: 12 }}>
                  {selecionado.products.map((item, i) => (
                    <div
                      key={i}
                      style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}
                    >
                      • {item.description} × {item.quantity} — R${' '}
                      {Number(item.price).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}{' '}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button className="btn btn-prim" onClick={finalizarVenda}>
                    Finalizar venda
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ color: '#e07070', borderColor: '#4a1818' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              <div
                className="card"
                style={{ margin: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <div className="card-title">Chat</div>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    marginBottom: 12,
                    minHeight: 120,
                  }}
                >
                  {msgs.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: 6,
                        flexDirection: m.de === 'eu' ? 'row-reverse' : 'row',
                      }}
                    >
                      {m.de !== 'eu' && (
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: 'var(--bg)',
                            border: '0.5px solid var(--border)',
                            flexShrink: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            color: 'var(--text4)',
                          }}
                        >
                          {fotoComprador ? (
                            <img
                              src={fotoComprador.secureUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            '👤'
                          )}
                        </div>
                      )}
                      <div
                        style={{
                          background: m.de === 'eu' ? '#1b341d' : 'var(--bg3)',
                          borderRadius: 8,
                          padding: '6px 10px',
                          maxWidth: '75%',
                          fontSize: 11,
                          color: m.de === 'eu' ? '#a8dca9' : 'var(--text)',
                        }}
                      >
                        {m.texto}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && enviar()}
                    placeholder="Digite uma mensagem..."
                    className="form-input"
                    style={{ flex: 1, height: 32, fontSize: 11 }}
                  />
                  <button className="btn btn-prim btn-sm" onClick={enviar}>
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
