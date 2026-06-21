import { useEffect, useState } from 'react';
import { SidebarComprador } from '../../components/layout/Sidebar';
import {
  buscarProdutos,
  criarPedido,
  buscarArquivosPorEntidade,
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  type ProductResponse,
  type ProductCategory,
  type FileUploadResponse,
  PRODUCT_CATEGORY,
  PRODUCT_SCALE,
} from '../../types';

export default function BuscarProdutos() {
  const { session } = useAuth();
  const [resultado, setResultado] = useState<ProductResponse[] | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const totalPages = resultado ? Math.ceil(resultado.length / PAGE_SIZE) : 0;
  const paginaAtual = resultado
    ? resultado.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : [];
  const [loading, setLoading] = useState(false);
  const [detalhe, setDetalhe] = useState<ProductResponse | null>(null);
  const [qtd, setQtd] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<ProductCategory | ''>('');
  const [imagens, setImagens] = useState<FileUploadResponse[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    if (!detalhe) {
      setImagens([]);
      setCarouselIdx(0);
      return;
    }
    buscarArquivosPorEntidade('PRODUCT', detalhe.id)
      .then(setImagens)
      .catch(() => {});
  }, [detalhe?.id]);

  function fetchProdutos(description?: string, category?: ProductCategory | '') {
    setLoading(true);
    buscarProdutos({
      ...(description ? { description } : {}),
      ...(category ? { category } : {}),
    })
      .then(setResultado)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchProdutos();
  }, []);

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    fetchProdutos(busca, categoriaAtiva);
  }

  function handleCategoria(cat: ProductCategory | '') {
    setCategoriaAtiva(cat);
    setPage(0);
    fetchProdutos(busca, cat);
  }

  async function handleFazerPedido() {
    if (!detalhe || !qtd) {
      setErro('Informe a quantidade');
      return;
    }
    if (!session?.account?.id) {
      setErro('Conta não encontrada');
      return;
    }
    setErro('');
    setEnviando(true);
    setSucesso(false);
    try {
      await criarPedido({
        buyerAccountId: session.account.id,
        sellerAccountId: detalhe.vendorAccountId,
        productsIds: [
          {
            productId: detalhe.id,
            description: detalhe.description,
            quantity: Number(qtd),
            price: detalhe.price,
          },
        ],
      });
      setSucesso(true);
      setQtd('');
    } catch (err: any) {
      setErro(err.response?.data?.message ?? 'Erro ao criar pedido');
    } finally {
      setEnviando(false);
    }
  }

  const inp = {
    width: '100%',
    height: 30,
    background: '#0a1520',
    border: '0.5px solid #1a3050',
    borderRadius: 6,
    padding: '0 8px',
    fontSize: 11,
    color: '#70aadd',
    outline: 'none',
  } as React.CSSProperties;
  const lbl = {
    fontSize: 9,
    fontWeight: 600,
    color: '#4a7090',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: 3,
  } as React.CSSProperties;

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
            <h2 className="topbar-title">Produtos disponíveis</h2>
            <p className="topbar-sub" style={{ color: '#4a7090' }}>
              {resultado ? `${resultado.length} produto(s)` : 'Buscando...'}
            </p>
          </div>
        </div>

        <div
          className="page-body"
          style={{
            display: 'grid',
            gridTemplateColumns: detalhe ? '1fr 300px' : '1fr',
            gap: 16,
          }}
        >
          <div>
            <div className="card buyer" style={{ marginBottom: 12 }}>
              <div
                style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}
              >
                {PRODUCT_CATEGORY.map((c) => (
                  <button
                    key={c.v}
                    type="button"
                    className="btn btn-sm"
                    style={{
                      background:
                        categoriaAtiva === c.v
                          ? 'var(--buyer-accent, #1a4a7a)'
                          : 'var(--buyer-card)',
                      border:
                        categoriaAtiva === c.v
                          ? '0.5px solid var(--sky-l)'
                          : '0.5px solid var(--buyer-border)',
                      color: 'var(--sky-l)',
                    }}
                    onClick={() => handleCategoria(c.v)}
                  >
                    {c.label}
                  </button>
                ))}

                <form
                  onSubmit={handleBuscar}
                  style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}
                >
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar produto..."
                    style={{
                      height: 28,
                      background: '#0a1520',
                      border: '0.5px solid var(--buyer-border)',
                      borderRadius: 6,
                      padding: '0 10px',
                      fontSize: 11,
                      color: '#70aadd',
                      outline: 'none',
                      width: 180,
                    }}
                  />
                  <button type="submit" className="btn btn-buyer btn-sm">
                    Buscar
                  </button>
                </form>
              </div>
            </div>

            <div className="card buyer">
              {loading && (
                <div className="empty">
                  <div className="empty-icon">⏳</div>Buscando...
                </div>
              )}
              {!loading && paginaAtual.length === 0 && (
                <div className="empty">
                  <div className="empty-icon">🔍</div>Nenhum produto encontrado.
                </div>
              )}
              {!loading && paginaAtual.length > 0 && (
                <>
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
                      <col style={{ width: 60 }} />
                      <col style={{ width: 130 }} />
                      <col style={{ width: 60 }} />
                    </colgroup>
                    <thead>
                      <tr style={{ borderBottom: '0.5px solid var(--buyer-border)' }}>
                        {['Produto', 'Categoria', 'Escala', 'Preço', ''].map((h, i) => (
                          <th
                            key={i}
                            style={{
                              textAlign: i >= 3 ? 'right' : 'left',
                              padding: '5px 8px',
                              fontSize: 10,
                              color: '#4a7090',
                              fontWeight: 500,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginaAtual.map((p: ProductResponse) => (
                        <tr
                          key={p.id}
                          style={{ borderBottom: '0.5px solid var(--buyer-border)' }}
                        >
                          <td
                            style={{ padding: '8px', fontWeight: 500, color: '#a8c5aa' }}
                          >
                            {p.description}
                          </td>
                          <td style={{ padding: '8px', color: '#4a7090' }}>
                            {PRODUCT_CATEGORY.find((c) => c.v === p.category)?.label ??
                              p.category}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <span className="tag tag-blue" style={{ textWrap: 'nowrap' }}>
                              {PRODUCT_SCALE.find((c) => c.v === p.scale)?.label ??
                                p.scale}
                            </span>
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
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            <button
                              className="btn btn-buyer btn-sm"
                              onClick={() => {
                                setDetalhe(detalhe?.id === p.id ? null : p);
                                setSucesso(false);
                                setErro('');
                                setQtd('');
                              }}
                            >
                              {detalhe?.id === p.id ? 'Fechar' : 'Ver'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalPages > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        justifyContent: 'center',
                        marginTop: 12,
                      }}
                    >
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={page === 0}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        ← Anterior
                      </button>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--text3)',
                          padding: '0 8px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        Pág. {page + 1} / {totalPages}
                      </span>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Próxima →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {detalhe && (
            <div
              className="card buyer"
              style={{ margin: 0, alignSelf: 'start', position: 'sticky', top: 80 }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#e8f5e9',
                  marginBottom: 2,
                }}
              >
                {detalhe.description}
              </div>
              <div style={{ fontSize: 10, color: '#4a7090', marginBottom: 12 }}>
                {detalhe.vendorCity}, {detalhe.vendorState}
              </div>

              {imagens.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: 160,
                      marginBottom: 6,
                    }}
                  >
                    <img
                      src={imagens[carouselIdx].secureUrl}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 6,
                        border: '0.5px solid #1a3050',
                      }}
                    />
                    {imagens.length > 1 && (
                      <>
                        <button
                          onClick={() => setCarouselIdx((i) => Math.max(0, i - 1))}
                          disabled={carouselIdx === 0}
                          style={{
                            position: 'absolute',
                            left: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: 4,
                            padding: '2px 6px',
                            cursor: 'pointer',
                            fontSize: 14,
                            opacity: carouselIdx === 0 ? 0.3 : 1,
                          }}
                        >
                          ‹
                        </button>
                        <button
                          onClick={() =>
                            setCarouselIdx((i) => Math.min(imagens.length - 1, i + 1))
                          }
                          disabled={carouselIdx === imagens.length - 1}
                          style={{
                            position: 'absolute',
                            right: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: 4,
                            padding: '2px 6px',
                            cursor: 'pointer',
                            fontSize: 14,
                            opacity: carouselIdx === imagens.length - 1 ? 0.3 : 1,
                          }}
                        >
                          ›
                        </button>
                      </>
                    )}
                  </div>
                  {imagens.length > 1 && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      {imagens.map((img, i) => (
                        <img
                          key={img.id}
                          src={img.secureUrl}
                          alt=""
                          onClick={() => setCarouselIdx(i)}
                          style={{
                            width: 44,
                            height: 44,
                            objectFit: 'cover',
                            borderRadius: 4,
                            cursor: 'pointer',
                            border: `1.5px solid ${i === carouselIdx ? 'var(--sky-l)' : '#1a3050'}`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {[
                  {
                    l: 'Categoria',
                    v:
                      PRODUCT_CATEGORY.find((c) => c.v === detalhe.category)?.label ??
                      detalhe.category,
                  },
                  {
                    l: 'Escala',
                    v:
                      PRODUCT_SCALE.find((c) => c.v === detalhe.scale)?.label ??
                      detalhe.scale,
                  },
                  { l: 'Quantidade disponível', v: String(detalhe.quantity) },
                  {
                    l: 'Preço unitário',
                    v: `R$ ${Number(detalhe.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  },
                  { l: 'Status', v: 'Disponível' },
                ].map((c) => (
                  <div
                    key={c.l}
                    style={{
                      background: '#0a1520',
                      border: '0.5px solid #1a3050',
                      borderRadius: 7,
                      padding: 8,
                    }}
                  >
                    <div style={{ fontSize: 9, color: '#4a7090', marginBottom: 2 }}>
                      {c.l}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#70aadd' }}>
                      {c.v}
                    </div>
                  </div>
                ))}
              </div>

              {sucesso ? (
                <div
                  style={{
                    background: '#122114',
                    border: '0.5px solid #264d29',
                    borderRadius: 8,
                    padding: 14,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>✅</div>
                  <div style={{ fontSize: 12, color: '#6dbf74', fontWeight: 500 }}>
                    Pedido criado com sucesso!
                  </div>
                  <button
                    className="btn btn-buyer btn-sm"
                    style={{ marginTop: 12 }}
                    onClick={() => setSucesso(false)}
                  >
                    Fazer outro pedido
                  </button>
                </div>
              ) : (
                <>
                  {erro && (
                    <div
                      className="alert alert-danger"
                      style={{ marginBottom: 10, fontSize: 11 }}
                    >
                      {erro}
                    </div>
                  )}
                  <div style={{ marginBottom: 12 }}>
                    <label style={lbl}>Quantidade</label>
                    <input
                      style={inp}
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={detalhe.quantity}
                      value={qtd}
                      onChange={(e) => setQtd(e.target.value)}
                      placeholder="Ex: 100"
                    />
                  </div>
                  <button
                    className="btn btn-buyer"
                    style={{ width: '100%' }}
                    onClick={handleFazerPedido}
                    disabled={enviando}
                  >
                    {enviando ? 'Criando pedido...' : '📩 Fazer pedido'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
