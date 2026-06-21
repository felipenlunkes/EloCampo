import { useEffect, useRef, useState } from 'react';
import { SidebarProdutor } from '../../components/layout/Sidebar';
import {
  buscarProdutosPorVendedor,
  criarProduto,
  deletarProduto,
  ativarProduto,
  desativarProduto,
  buscarArquivosPorEntidade,
  uploadArquivo,
  deletarArquivo,
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  type ProductResponse,
  type ProductCategory,
  type ProductScale,
  type FileUploadResponse,
  PRODUCT_CATEGORY,
  PRODUCT_SCALE,
} from '../../types';

const catLabel = (v: ProductCategory) =>
  PRODUCT_CATEGORY.find((c) => c.v === v)?.label ?? v;
const escLabel = (v: ProductScale) => PRODUCT_SCALE.find((s) => s.v === v)?.label ?? v;
const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('pt-BR');
const fmtPrice = (v: number) =>
  `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function MeusProdutos() {
  const { session } = useAuth();
  const vendorId = session?.account?.id;

  const [produtos, setProdutos] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionado, setSelecionado] = useState<ProductResponse | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    description: '',
    category: '' as ProductCategory,
    scale: '' as ProductScale,
    quantity: 0 as number,
    price: '',
    availabilityDate: '',
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [produtoCriado, setProdutoCriado] = useState<ProductResponse | null>(null);
  const [imagens, setImagens] = useState<FileUploadResponse[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [uploadandoImg, setUploadandoImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inp: React.CSSProperties = {
    width: '100%',
    height: 28,
    background: '#111f12',
    border: '0.5px solid #2a4a2c',
    borderRadius: 6,
    padding: '0 8px',
    fontSize: 11,
    color: '#a8dca9',
    outline: 'none',
  };
  const lbl: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 600,
    color: '#6a9a6c',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: 3,
  };

  useEffect(() => {
    if (!vendorId) return;
    setLoading(true);
    buscarProdutosPorVendedor(vendorId)
      .then(setProdutos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vendorId]);

  useEffect(() => {
    if (!selecionado) {
      setImagens([]);
      setCarouselIdx(0);
      return;
    }
    buscarArquivosPorEntidade('PRODUCT', selecionado.id)
      .then(setImagens)
      .catch(() => {});
  }, [selecionado?.id]);

  async function handleUploadImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const targetId = selecionado?.id ?? produtoCriado?.id;
    if (!file || !targetId) return;
    if (imagens.length >= 5) return;
    setUploadandoImg(true);
    try {
      const novo = await uploadArquivo(file, 'PRODUCT', targetId);
      setImagens((prev) => {
        setCarouselIdx(prev.length);
        return [...prev, novo];
      });
    } catch {
      /* user can retry */
    } finally {
      setUploadandoImg(false);
      e.target.value = '';
    }
  }

  async function handleDeletarImagem(imgId: string) {
    await deletarArquivo(imgId);
    setImagens((prev) => {
      const next = prev.filter((i) => i.id !== imgId);
      setCarouselIdx((idx) => Math.min(idx, Math.max(0, next.length - 1)));
      return next;
    });
  }

  async function handlePublicar() {
    if (
      !form.description ||
      !form.category ||
      !form.scale ||
      !form.price ||
      !form.availabilityDate
    ) {
      setErro('Preencha todos os campos obrigatórios');
      return;
    }
    if (!vendorId) {
      setErro('Conta não encontrada');
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      const novo = await criarProduto({
        vendorAccountId: vendorId,
        description: form.description,
        category: form.category,
        scale: form.scale,
        quantity: Number(form.quantity),
        price: Number(form.price),
        availabilityDate: new Date(form.availabilityDate).getTime(),
      });
      setProdutos((p) => [novo, ...p]);
      setProdutoCriado(novo);
      setImagens([]);
      setCarouselIdx(0);
      setForm({
        description: '',
        category: '' as ProductCategory,
        scale: '' as ProductScale,
        quantity: 0 as number,
        price: '',
        availabilityDate: '',
      });
    } catch (err: any) {
      setErro(err.response?.data?.message ?? 'Erro ao publicar produto');
    } finally {
      setSalvando(false);
    }
  }

  async function handleToggleStatus(produto: ProductResponse) {
    setToggleLoading(true);
    try {
      if (produto.status === 'AVAILABLE') {
        await desativarProduto(produto.id);
        const atualizado: ProductResponse = { ...produto, status: 'UNAVAILABLE' };
        setProdutos((p) => p.map((x) => (x.id === produto.id ? atualizado : x)));
        setSelecionado(atualizado);
      } else {
        await ativarProduto(produto.id);
        const atualizado: ProductResponse = { ...produto, status: 'AVAILABLE' };
        setProdutos((p) => p.map((x) => (x.id === produto.id ? atualizado : x)));
        setSelecionado(atualizado);
      }
    } catch {
      /* status reverts on next fetch */
    } finally {
      setToggleLoading(false);
    }
  }

  async function handleDeletar(id: string) {
    if (!confirm('Remover este produto?')) return;
    await deletarProduto(id);
    setProdutos((p) => p.filter((x) => x.id !== id));
    if (selecionado?.id === id) setSelecionado(null);
  }

  return (
    <div className="app-shell">
      <SidebarProdutor />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h2 className="topbar-title">Meus Produtos</h2>
            <p className="topbar-sub">{produtos.length} produto(s) cadastrado(s)</p>
          </div>
          <button
            className="btn btn-prim"
            onClick={() => {
              setMostrarForm((f) => !f);
              setSelecionado(null);
              setProdutoCriado(null);
              setImagens([]);
            }}
          >
            + Adicionar produto
          </button>
        </div>

        <div className="page-body">
          {mostrarForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                {produtoCriado ? `Imagens — ${produtoCriado.description}` : 'Novo produto'}
              </div>
              {produtoCriado ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <span style={lbl}>Adicionar imagens ({imagens.length}/5)</span>
                    {imagens.length < 5 && (
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ fontSize: 10, padding: '2px 8px' }}
                        disabled={uploadandoImg}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadandoImg ? '...' : '+ Adicionar'}
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    style={{ display: 'none' }}
                    onChange={handleUploadImagem}
                  />
                  {imagens.length === 0 ? (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text4)',
                        fontStyle: 'italic',
                        marginBottom: 12,
                      }}
                    >
                      Nenhuma imagem adicionada ainda.
                    </div>
                  ) : (
                    <div style={{ marginBottom: 12 }}>
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
                            border: '0.5px solid var(--border)',
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
                      <div style={{ display: 'flex', gap: 4 }}>
                        {imagens.map((img, i) => (
                          <div key={img.id} style={{ position: 'relative' }}>
                            <img
                              src={img.secureUrl}
                              alt=""
                              onClick={() => setCarouselIdx(i)}
                              style={{
                                width: 44,
                                height: 44,
                                objectFit: 'cover',
                                borderRadius: 4,
                                cursor: 'pointer',
                                border: `1.5px solid ${i === carouselIdx ? 'var(--g400)' : 'var(--border)'}`,
                              }}
                            />
                            <button
                              onClick={() => handleDeletarImagem(img.id)}
                              style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: '#e07070',
                                border: 'none',
                                color: '#fff',
                                fontSize: 8,
                                cursor: 'pointer',
                                lineHeight: '14px',
                                textAlign: 'center',
                                padding: 0,
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    className="btn btn-prim"
                    onClick={() => {
                      setMostrarForm(false);
                      setProdutoCriado(null);
                      setImagens([]);
                    }}
                  >
                    Concluir
                  </button>
                </div>
              ) : (
                <>
                  {erro && <div className="alert alert-danger">{erro}</div>}
                  <div style={{ marginBottom: 10 }}>
                    <label style={lbl}>Descrição</label>
                    <input
                      style={inp}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="Ex: Soja em grão, safra 2025"
                    />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={lbl}>Categoria</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {PRODUCT_CATEGORY.map((c) => (
                        <button
                          type="button"
                          key={c.v}
                          onClick={() => setForm((f) => ({ ...f, category: c.v }))}
                          className="btn btn-sm"
                          style={{
                            background:
                              form.category === c.v ? 'var(--g700)' : 'var(--bg)',
                            border: `1.5px solid ${form.category === c.v ? 'var(--g400)' : 'var(--border)'}`,
                            color: form.category === c.v ? 'var(--g200)' : 'var(--text3)',
                          }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <label style={lbl}>Escala</label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {PRODUCT_SCALE.map((s) => (
                          <button
                            type="button"
                            key={s.v}
                            onClick={() => setForm((f) => ({ ...f, scale: s.v }))}
                            className="btn btn-sm"
                            style={{
                              background: form.scale === s.v ? 'var(--g700)' : 'var(--bg)',
                              border: `1.5px solid ${form.scale === s.v ? 'var(--g400)' : 'var(--border)'}`,
                              color: form.scale === s.v ? 'var(--g200)' : 'var(--text3)',
                            }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Quantidade (volume)</label>
                      <input
                        style={inp}
                        type="number"
                        step="0.01"
                        value={form.quantity}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, quantity: Number(e.target.value) }))
                        }
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <label style={lbl}>Preço (R$)</label>
                      <input
                        style={inp}
                        type="number"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <label style={lbl}>Disponível a partir de</label>
                      <input
                        style={inp}
                        type="date"
                        value={form.availabilityDate}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, availabilityDate: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-prim"
                    onClick={handlePublicar}
                    disabled={salvando}
                  >
                    {salvando ? 'Publicando...' : 'Publicar produto'}
                  </button>
                </>
              )}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: selecionado ? '1fr 320px' : '1fr',
              gap: 12,
              alignItems: 'start',
            }}
          >
            <div className="card">
              {loading && (
                <div className="empty">
                  <div className="empty-icon">⏳</div>Carregando...
                </div>
              )}
              {!loading && produtos.length === 0 && (
                <div className="empty">
                  <div className="empty-icon">📦</div>Nenhum produto cadastrado ainda.
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
                    <col style={{ width: 100 }} />
                    <col style={{ width: 72 }} />
                    <col style={{ width: 130 }} />
                    <col style={{ width: 90 }} />
                  </colgroup>
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                      {['Descrição', 'Categoria', 'Status', 'Escala', 'Preço'].map(
                        (h, i) => (
                          <th
                            key={i}
                            style={{
                              textAlign: i >= 4 ? 'right' : 'left',
                              padding: '5px 8px',
                              fontSize: 10,
                              color: 'var(--text4)',
                              fontWeight: 500,
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => {
                          setSelecionado(p);
                          setMostrarForm(false);
                        }}
                        style={{
                          borderBottom: '0.5px solid var(--border)',
                          cursor: 'pointer',
                          background:
                            selecionado?.id === p.id ? 'var(--g900)' : 'transparent',
                        }}
                      >
                        <td
                          style={{ padding: '8px', fontWeight: 500, color: 'var(--text)' }}
                        >
                          {p.description}
                        </td>
                        <td style={{ padding: '8px', color: 'var(--text2)' }}>
                          {catLabel(p.category)}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span
                            className={`tag ${p.status === 'AVAILABLE' ? 'tag-green' : 'tag-red'}`}
                          >
                            {p.status === 'AVAILABLE' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span className="tag tag-gold" style={{ textWrap: 'nowrap' }}>
                            {escLabel(p.scale)}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '8px',
                            textAlign: 'right',
                            color: 'var(--g300)',
                            fontWeight: 500,
                          }}
                        >
                          {fmtPrice(p.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {selecionado && (
              <div className="card" style={{ alignSelf: 'start' }}>
                <div className="card-title">
                  Detalhes
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelecionado(null)}
                    style={{ fontSize: 11, padding: '2px 8px' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <DetalheItem label="Descrição" value={selecionado.description} />
                  <DetalheItem label="Categoria" value={catLabel(selecionado.category)} />
                  <DetalheItem label="Escala" value={escLabel(selecionado.scale)} />
                  <DetalheItem
                    label="Quantidade (volume)"
                    value={String(selecionado.quantity)}
                  />
                  <DetalheItem label="Preço" value={fmtPrice(selecionado.price)} />
                  <DetalheItem
                    label="Avaliação (nota)"
                    value={
                      selecionado.evaluations?.length
                        ? (
                            selecionado.evaluations.reduce((s, a) => s + a.stars, 0) /
                            selecionado.evaluations.length
                          ).toFixed(1)
                        : '—'
                    }
                  />
                  <DetalheItem
                    label="Disponível a partir de"
                    value={fmtDate(selecionado.availabilityDate)}
                  />
                  <DetalheItem
                    label="Cidade / Estado"
                    value={`${selecionado.vendorCity} – ${selecionado.vendorState}`}
                  />
                  <DetalheItem
                    label="Cadastrado em"
                    value={fmtDate(selecionado.createdAt)}
                  />
                  <DetalheItem
                    label="Atualizado em"
                    value={fmtDate(selecionado.updatedAt)}
                  />

                  <div>
                    <span style={{ ...lbl, marginBottom: 5 }}>Status</span>
                    <span
                      className={`tag ${selecionado.status === 'AVAILABLE' ? 'tag-green' : 'tag-red'}`}
                    >
                      {selecionado.status === 'AVAILABLE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                      }}
                    >
                      <span style={lbl}>Imagens ({imagens.length}/5)</span>
                      {imagens.length < 5 && (
                        <button
                          className="btn btn-sm btn-ghost"
                          style={{ fontSize: 10, padding: '2px 8px' }}
                          disabled={uploadandoImg}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploadandoImg ? '...' : '+ Adicionar'}
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      style={{ display: 'none' }}
                      onChange={handleUploadImagem}
                    />
                    {imagens.length === 0 ? (
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text4)',
                          fontStyle: 'italic',
                        }}
                      >
                        Nenhuma imagem adicionada.
                      </div>
                    ) : (
                      <div>
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
                              border: '0.5px solid var(--border)',
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
                                  setCarouselIdx((i) =>
                                    Math.min(imagens.length - 1, i + 1),
                                  )
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
                        <div style={{ display: 'flex', gap: 4 }}>
                          {imagens.map((img, i) => (
                            <div key={img.id} style={{ position: 'relative' }}>
                              <img
                                src={img.secureUrl}
                                alt=""
                                onClick={() => setCarouselIdx(i)}
                                style={{
                                  width: 44,
                                  height: 44,
                                  objectFit: 'cover',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  border: `1.5px solid ${i === carouselIdx ? 'var(--g400)' : 'var(--border)'}`,
                                }}
                              />
                              <button
                                onClick={() => handleDeletarImagem(img.id)}
                                style={{
                                  position: 'absolute',
                                  top: -4,
                                  right: -4,
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  background: '#e07070',
                                  border: 'none',
                                  color: '#fff',
                                  fontSize: 8,
                                  cursor: 'pointer',
                                  lineHeight: '14px',
                                  textAlign: 'center',
                                  padding: 0,
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selecionado.evaluations && selecionado.evaluations.length > 0 && (
                    <div>
                      <span style={lbl}>
                        Avaliações ({selecionado.evaluations.length})
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          marginTop: 4,
                        }}
                      >
                        {selecionado.evaluations.map((ev) => (
                          <div
                            key={ev.id}
                            style={{
                              background: 'var(--bg)',
                              border: '0.5px solid var(--border)',
                              borderRadius: 6,
                              padding: '6px 8px',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--gold)',
                                marginBottom: 2,
                              }}
                            >
                              {'★'.repeat(ev.stars)}
                              {'☆'.repeat(Math.max(0, 5 - ev.stars))}
                            </div>
                            {ev.content && (
                              <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                                {ev.content}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      paddingTop: 4,
                    }}
                  >
                    <button
                      className={`btn btn-sm ${selecionado.status === 'AVAILABLE' ? 'btn-ghost' : 'btn-prim'}`}
                      onClick={() => handleToggleStatus(selecionado)}
                      disabled={toggleLoading}
                    >
                      {toggleLoading
                        ? '...'
                        : selecionado.status === 'AVAILABLE'
                          ? 'Desativar'
                          : 'Ativar'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeletar(selecionado.id)}
                      style={{ color: '#e07070', borderColor: '#4a1818' }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function DetalheItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: '#6a9a6c',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          display: 'block',
          marginBottom: 2,
        }}
      >
        {label}
      </span>
      <div style={{ fontSize: 12, color: 'var(--text)', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}
