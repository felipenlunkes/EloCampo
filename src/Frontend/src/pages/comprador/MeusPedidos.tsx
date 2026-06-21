import { useEffect, useState } from 'react';
import { SidebarComprador } from '../../components/layout/Sidebar';
import {
  buscarPedidoPorIdComprador,
  criarAvaliacaoProduto,
  buscarArquivosPorEntidade,
  buscarProdutoPorId,
} from '../../services/api';
import type { OrderResponse, ProductEvaluation, FileUploadResponse } from '../../types';
import { ORDER_STATUS_LABEL } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function MeusPedidos() {
  const { session } = useAuth();
  const [pedidos, setPedidos] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionado, setSel] = useState<OrderResponse | null>(null);
  const [msg, setMsg] = useState('');
  const [msgs, setMsgs] = useState<{ de: string; texto: string }[]>([
    { de: 'produtor', texto: 'Enviarei na sexta-feira!' },
  ]);
  const [avaliacoes, setAvaliacoes] = useState<Record<string, ProductEvaluation[]>>({});
  const [avaliandoProduto, setAvaliandoProduto] = useState<string | null>(null);
  const [estrelasAvaliacao, setEstrelasAvaliacao] = useState(5);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [fotoVendedor, setFotoVendedor] = useState<FileUploadResponse | null>(null);

  useEffect(() => {
    const buyerId = session?.account?.id;

    buyerId &&
      buscarPedidoPorIdComprador(buyerId)
        .then((p) => setPedidos(p.content))
        .catch(() => {})
        .finally(() => setLoading(false));
  }, []);

  function enviarMsg() {
    if (!msg.trim()) return;
    setMsgs((m) => [...m, { de: 'eu', texto: msg }]);
    setMsg('');
  }

  async function selecionarPedido(pedido: OrderResponse | null) {
    setSel(pedido);
    setAvaliandoProduto(null);
    setEstrelasAvaliacao(5);
    setComentarioAvaliacao('');
    setFotoVendedor(null);
    if (pedido)
      buscarArquivosPorEntidade('PROFILE', pedido.sellerAccountId)
        .then((imgs) => setFotoVendedor(imgs[0] ?? null))
        .catch(() => {});

    if (pedido && pedido.orderStatus === 'COMPLETED') {
      const resultados = await Promise.all(
        pedido.products.map((item) =>
          buscarProdutoPorId(item.productId).catch(() => null),
        ),
      );
      const novasAvaliacoes: Record<string, ProductEvaluation[]> = {};
      pedido.products.forEach((item, index) => {
        novasAvaliacoes[item.productId] = resultados[index]?.evaluations ?? [];
      });
      setAvaliacoes(novasAvaliacoes);
    }
  }

  async function enviarAvaliacao(produtoId: string) {
    if (!selecionado) return;

    const buyerId = session?.account?.id;

    if (!buyerId) {
      return;
    }

    setEnviandoAvaliacao(true);
    try {
      let evaluation: ProductEvaluation = {
        stars: estrelasAvaliacao,
        content: comentarioAvaliacao.trim() || undefined,
        reviewerAccountId: buyerId,
      };

      await criarAvaliacaoProduto(produtoId, evaluation);

      const produto = await buscarProdutoPorId(produtoId);
      setAvaliacoes((prev) => ({ ...prev, [produtoId]: produto.evaluations ?? [] }));

      setAvaliandoProduto(null);
      setComentarioAvaliacao('');
      setEstrelasAvaliacao(5);
    } catch (err: any) {
      console.error('Erro ao enviar avaliação:', err);
    } finally {
      setEnviandoAvaliacao(false);
    }
  }

  const tagCls = (s: string) =>
    s === 'PENDING'
      ? 'tag tag-gold'
      : s === 'COMPLETED'
        ? 'tag tag-green'
        : 'tag tag-gold';


  const inp: React.CSSProperties = {
    width: '100%',
    height: 28,
    background: '#0a1520',
    border: '0.5px solid #1a3050',
    borderRadius: 6,
    padding: '0 8px',
    fontSize: 11,
    color: '#70aadd',
    outline: 'none',
  };

  return (
    <div className="app-shell">
      <SidebarComprador />
      <main className="main-content" style={{ background: 'var(--buyer-bg)' }}>
        <div
          className="topbar"
          style={{
            background: 'var(--buyer-bg)',
            borderBottomColor: 'var(--buyer-border)',
          }}
        >
          <div>
            <h2 className="topbar-title">Meus Pedidos</h2>
            <p className="topbar-sub" style={{ color: '#4a7090' }}>
              {pedidos.length} pedido(s)
            </p>
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
          <div className="card buyer" style={{ margin: 0 }}>
            {loading && (
              <div className="empty">
                <div className="empty-icon">⏳</div>Carregando...
              </div>
            )}
            {!loading && pedidos.length === 0 && (
              <div className="empty">
                <div className="empty-icon">📋</div>Nenhum pedido ainda.
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
                  <col style={{ width: 90 }} />
                  <col style={{ width: 80 }} />
                  <col style={{ width: 70 }} />
                </colgroup>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--buyer-border)' }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '5px 8px',
                        fontSize: 10,
                        color: '#4a7090',
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
                        color: '#4a7090',
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
                        color: '#4a7090',
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
                        color: '#4a7090',
                        fontWeight: 500,
                      }}
                    >
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p, i) => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '0.5px solid var(--buyer-border)' }}
                    >
                      <td
                        style={{
                          padding: '8px',
                          fontWeight: 500,
                          color: '#a8c5aa',
                          fontSize: 10,
                          fontFamily: 'monospace',
                        }}
                      >
                        {p.id.substring(0, 12)}…
                      </td>
                      <td
                        style={{
                          padding: '8px',
                          textAlign: 'right',
                          color: 'var(--sky-l)',
                          fontWeight: 500,
                        }}
                      >
                        R${' '}
                        {Number(p.price).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span className={tagCls(p.orderStatus)}>
                          {ORDER_STATUS_LABEL[p.orderStatus] ?? p.orderStatus}
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--sky-l)', borderColor: '#1a3050' }}
                          onClick={() =>
                            selecionarPedido(selecionado?.id === p.id ? null : p)
                          }
                        >
                          {selecionado?.id === p.id ? 'Fechar' : 'Detalhes'}
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
              <div className="card buyer" style={{ margin: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#e8f5e9',
                    marginBottom: 3,
                  }}
                >
                  Pedido — R${' '}
                  {Number(selecionado.price).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div style={{ fontSize: 11, color: '#4a7090', marginBottom: 10 }}>
                  {selecionado.products.length} item(s)
                </div>
                {selecionado.products.map((item, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#a8c5aa', marginBottom: 4 }}>
                    • {item.description} × {item.quantity} — R${' '}
                    {Number(item.price).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                  </div>
                ))}
              </div>

              <div className="card buyer" style={{ margin: 0 }}>
                <div className="card-title">Chat</div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    marginBottom: 12,
                    minHeight: 80,
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
                            background: '#0a1520',
                            border: '0.5px solid #1a3050',
                            flexShrink: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            color: '#4a7090',
                          }}
                        >
                          {fotoVendedor ? (
                            <img
                              src={fotoVendedor.secureUrl}
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
                          background: m.de === 'eu' ? '#0d1f2e' : '#0a1520',
                          border: '0.5px solid #1a3050',
                          borderRadius: 8,
                          padding: '6px 10px',
                          maxWidth: '75%',
                          fontSize: 11,
                          color: m.de === 'eu' ? '#70aadd' : '#a8c5aa',
                        }}
                      >
                        {m.texto}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{ ...inp, flex: 1 }}
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && enviarMsg()}
                    placeholder="Digite uma mensagem..."
                  />
                  <button className="btn btn-buyer btn-sm" onClick={enviarMsg}>
                    Enviar
                  </button>
                </div>
              </div>

              {selecionado?.orderStatus === 'COMPLETED' && (
                <div className="card buyer" style={{ margin: 0 }}>
                  <div className="card-title">Avaliações</div>

                  {selecionado.products.map((item, index) => {
                    const produtoAvaliacoes = avaliacoes[item.productId] || [];
                    const mediaAvaliacoes =
                      produtoAvaliacoes.length > 0
                        ? produtoAvaliacoes.reduce((sum, a) => sum + a.stars, 0) /
                          produtoAvaliacoes.length
                        : 0;

                    return (
                      <div
                        key={item.productId}
                        style={{
                          marginBottom: index < selecionado.products.length - 1 ? 16 : 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: '#a8c5aa',
                            marginBottom: 6,
                          }}
                        >
                          {item.description}
                        </div>

                        {produtoAvaliacoes.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <div
                              style={{ fontSize: 10, color: '#4a7090', marginBottom: 4 }}
                            >
                              Média:{' '}
                              <span style={{ color: 'var(--gold)' }}>
                                ⭐ {mediaAvaliacoes.toFixed(1)} ({produtoAvaliacoes.length}{' '}
                                avaliação{produtoAvaliacoes.length !== 1 ? 'ões' : ''})
                              </span>
                            </div>
                            <div style={{ maxHeight: 80, overflowY: 'auto' }}>
                              {produtoAvaliacoes.slice(0, 3).map((avaliacao) => (
                                <div
                                  key={avaliacao.id}
                                  style={{
                                    background: '#0a1520',
                                    border: '0.5px solid #1a3050',
                                    borderRadius: 4,
                                    padding: 6,
                                    marginBottom: 4,
                                    fontSize: 10,
                                  }}
                                >
                                  <div style={{ color: 'var(--gold)', marginBottom: 2 }}>
                                    {'★'.repeat(avaliacao.stars)}
                                    {'☆'.repeat(5 - avaliacao.stars)}
                                  </div>
                                  {avaliacao.content && (
                                    <div style={{ color: '#70aadd' }}>
                                      {avaliacao.content}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {produtoAvaliacoes.length > 3 && (
                                <div
                                  style={{
                                    fontSize: 9,
                                    color: '#4a7090',
                                    textAlign: 'center',
                                  }}
                                >
                                  +{produtoAvaliacoes.length - 3} avaliação
                                  {produtoAvaliacoes.length - 3 !== 1 ? 'ões' : ''}...
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {avaliandoProduto === item.productId ? (
                          <div
                            style={{
                              background: '#0a1520',
                              border: '0.5px solid #1a3050',
                              borderRadius: 6,
                              padding: 10,
                            }}
                          >
                            <div
                              style={{ fontSize: 10, color: '#4a7090', marginBottom: 6 }}
                            >
                              Sua avaliação
                            </div>

                            <div style={{ marginBottom: 8 }}>
                              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => setEstrelasAvaliacao(star)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color:
                                        star <= estrelasAvaliacao
                                          ? 'var(--gold)'
                                          : '#4a7090',
                                      fontSize: 14,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>

                            <textarea
                              style={{
                                ...inp,
                                height: 50,
                                resize: 'none',
                                marginBottom: 8,
                                fontSize: 10,
                              }}
                              placeholder="Comentário opcional..."
                              value={comentarioAvaliacao}
                              onChange={(e) => setComentarioAvaliacao(e.target.value)}
                              maxLength={300}
                            />

                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn btn-buyer btn-sm"
                                style={{ flex: 1 }}
                                onClick={() => enviarAvaliacao(item.productId)}
                                disabled={enviandoAvaliacao}
                              >
                                {enviandoAvaliacao ? 'Enviando...' : 'Enviar'}
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setAvaliandoProduto(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="btn btn-buyer btn-sm"
                            style={{ width: '100%' }}
                            onClick={() => setAvaliandoProduto(item.productId)}
                          >
                            {produtoAvaliacoes.length > 0
                              ? 'Avaliar novamente'
                              : 'Avaliar produto'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
