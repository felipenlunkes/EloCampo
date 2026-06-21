import { useEffect, useState, useMemo, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, useWindowDimensions,
} from 'react-native'
import { BarChart } from 'react-native-chart-kit'
import { useAuth } from '../../contexts/AuthContext'
import {
  buscarTodosUsuarios, buscarTodosProdutos,
  buscarTodosPedidos, buscarTodasContas,
} from '../../services/api'
import type { AccountResponse, ProductResponse, OrderResponse } from '../../types'
import { PRODUCT_CATEGORY, ORDER_STATUS_LABEL } from '../../types'
import { A } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Grafico     = 'contas' | 'produtos' | 'pedidos'
type Granularity = 'day' | 'week' | 'month' | 'year'

const ROLE_LABEL: Record<string, string> = { BUYER: 'Comprador', VENDOR: 'Produtor' }

const PRESETS = [
  { label: '7d',    days: 7   },
  { label: '30d',   days: 30  },
  { label: '90d',   days: 90  },
  { label: '1 ano', days: 365 },
] as const

const CHART_CFG = {
  backgroundColor:        '#1a2e1c',
  backgroundGradientFrom: '#1a2e1c',
  backgroundGradientTo:   '#1a2e1c',
  decimalPlaces: 0,
  color:      (opacity = 1) => `rgba(109, 191, 116, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(106, 154, 108, ${opacity})`,
  barPercentage: 0.6,
  propsForBackgroundLines: { stroke: '#264d29', strokeWidth: 0.5 },
}

function getGranularity(start: string, end: string): Granularity {
  const days = (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000
  if (days <= 31)  return 'day'
  if (days <= 90)  return 'week'
  if (days <= 365) return 'month'
  return 'year'
}

function getBucketKey(date: Date, g: Granularity): string {
  if (g === 'year')  return String(date.getFullYear())
  if (g === 'month') return date.toISOString().slice(0, 7)
  if (g === 'day')   return date.toISOString().slice(0, 10)
  const d = new Date(date)
  const dow = d.getDay()
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow))
  return d.toISOString().slice(0, 10)
}

function groupByPeriod(
  items: any[],
  getTs: (item: any) => number,
  filterFn: (item: any) => boolean,
  start: string,
  end: string,
  g: Granularity,
): { date: string; count: number }[] {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end   + 'T23:59:59')
  const counts: Record<string, number> = {}
  if (g === 'day') {
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1))
      counts[getBucketKey(new Date(d), g)] = 0
  } else if (g === 'week') {
    const mon = new Date(s)
    const dow = mon.getDay()
    mon.setDate(mon.getDate() + (dow === 0 ? -6 : 1 - dow))
    for (let d = new Date(mon); d <= e; d.setDate(d.getDate() + 7))
      counts[getBucketKey(new Date(d), g)] = 0
  } else if (g === 'month') {
    const cur = new Date(s.getFullYear(), s.getMonth(), 1)
    const last = new Date(e.getFullYear(), e.getMonth(), 1)
    for (; cur <= last; cur.setMonth(cur.getMonth() + 1))
      counts[getBucketKey(new Date(cur), g)] = 0
  } else {
    for (let y = s.getFullYear(); y <= e.getFullYear(); y++)
      counts[String(y)] = 0
  }
  items.forEach(item => {
    if (!filterFn(item)) return
    const ts = getTs(item)
    if (!ts) return
    const dt = new Date(ts)
    if (dt < s || dt > e) return
    const key = getBucketKey(dt, g)
    if (key in counts) counts[key]++
  })
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))
}

function fmtLabel(key: string, g: Granularity): string {
  if (g === 'year') return key
  if (g === 'month') { const [y, m] = key.split('-'); return `${m}/${y.slice(2)}` }
  const [, m, d] = key.split('-')
  return `${d}/${m}`
}

export default function AdminHomeScreen() {
  const { logout } = useAuth()
  const insets     = useSafeAreaInsets()
  const { width }  = useWindowDimensions()

  const [usuariosCount, setUsuariosCount] = useState(0)
  const [contas,   setContas]   = useState<AccountResponse[]>([])
  const [produtos, setProdutos] = useState<ProductResponse[]>([])
  const [pedidos,  setPedidos]  = useState<OrderResponse[]>([])
  const [loading,  setLoading]  = useState(true)

  const [grafico,      setGrafico]      = useState<Grafico>('contas')
  const [rangeDays,    setRangeDays]    = useState(30)
  const [roleFilter,   setRoleFilter]   = useState<string[]>([])
  const [catFilter,    setCatFilter]    = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const roleInit   = useRef(false)
  const catInit    = useRef(false)
  const statusInit = useRef(false)

  useEffect(() => {
    Promise.allSettled([
      buscarTodosUsuarios().then(u => setUsuariosCount(u.length)),
      buscarTodosProdutos().then(setProdutos),
      buscarTodosPedidos().then(setPedidos),
      buscarTodasContas().then(setContas),
    ]).finally(() => setLoading(false))
  }, [])

  const { relStart, relEnd } = useMemo(() => {
    const end   = new Date().toISOString().slice(0, 10)
    const start = new Date(Date.now() - rangeDays * 86_400_000).toISOString().slice(0, 10)
    return { relStart: start, relEnd: end }
  }, [rangeDays])

  const granularity = useMemo(() => getGranularity(relStart, relEnd), [relStart, relEnd])

  const roleOptions   = useMemo(() => [...new Set(contas.map(c => c.role))],              [contas])
  const catOptions    = useMemo(() => [...new Set(produtos.map(p => p.category))],         [produtos])
  const statusOptions = useMemo(() => [...new Set(pedidos.map(p => p.orderStatus))],       [pedidos])

  useEffect(() => { if (roleOptions.length   > 0 && !roleInit.current)   { roleInit.current   = true; setRoleFilter(roleOptions) } },   [roleOptions])
  useEffect(() => { if (catOptions.length    > 0 && !catInit.current)    { catInit.current    = true; setCatFilter(catOptions) } },      [catOptions])
  useEffect(() => { if (statusOptions.length > 0 && !statusInit.current) { statusInit.current = true; setStatusFilter(statusOptions) } }, [statusOptions])

  const contaChartData = useMemo(() =>
    groupByPeriod(contas,   c => c.createdAt, c => roleFilter.includes(c.role),             relStart, relEnd, granularity),
    [contas, roleFilter, relStart, relEnd, granularity])

  const produtoChartData = useMemo(() =>
    groupByPeriod(produtos, p => p.createdAt, p => catFilter.includes(p.category),          relStart, relEnd, granularity),
    [produtos, catFilter, relStart, relEnd, granularity])

  const pedidoChartData = useMemo(() =>
    groupByPeriod(pedidos,  p => p.createdAt, p => statusFilter.includes(p.orderStatus),    relStart, relEnd, granularity),
    [pedidos, statusFilter, relStart, relEnd, granularity])

  const activeData    = grafico === 'contas' ? contaChartData   : grafico === 'produtos' ? produtoChartData : pedidoChartData
  const activeFilter  = grafico === 'contas' ? roleFilter       : grafico === 'produtos' ? catFilter        : statusFilter
  const activeOptions = grafico === 'contas' ? roleOptions      : grafico === 'produtos' ? catOptions       : statusOptions

  function filterLabel(v: string): string {
    if (grafico === 'contas')   return ROLE_LABEL[v] ?? v
    if (grafico === 'produtos') return PRODUCT_CATEGORY.find(c => c.v === v)?.label ?? v
    return ORDER_STATUS_LABEL[v as keyof typeof ORDER_STATUS_LABEL] ?? v
  }

  function toggleFilter(opt: string) {
    const toggle = (f: string[]) => f.includes(opt) ? f.filter(x => x !== opt) : [...f, opt]
    if (grafico === 'contas')        setRoleFilter(toggle)
    else if (grafico === 'produtos') setCatFilter(toggle)
    else                             setStatusFilter(toggle)
  }

  const MAX_LABELS  = 7
  const step        = Math.max(1, Math.ceil(activeData.length / MAX_LABELS))
  const chartLabels = activeData.map((d, i) => i % step === 0 ? fmtLabel(d.date, granularity) : '')
  const chartValues = activeData.map(d => d.count)
  const hasData     = chartValues.some(v => v > 0)
  const granLabel   = { day: 'por dia', week: 'por semana', month: 'por mês', year: 'por ano' }[granularity]

  function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topbar}>
        <View style={s.titleRow}>
          <Text style={s.topTitle}>Painel Admin</Text>
          <View style={s.adminBadge}><Text style={s.adminBadgeText}>ADMIN</Text></View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={A.accent2} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.body}>

          <Text style={s.sectionLabel}>RESUMO GERAL</Text>
          <View style={s.statsGrid}>
            <View style={[s.statCard, { backgroundColor: '#1a2e1c', borderColor: '#264d29' }]}>
              <Text style={[s.statVal, { color: '#6dbf74' }]}>{usuariosCount}</Text>
              <Text style={[s.statLbl, { color: '#3d6b3f' }]}>Usuários</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: '#1a2e1c', borderColor: '#264d29' }]}>
              <Text style={[s.statVal, { color: '#6dbf74' }]}>{produtos.length}</Text>
              <Text style={[s.statLbl, { color: '#3d6b3f' }]}>Produtos</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: '#0a1520', borderColor: '#1a3050' }]}>
              <Text style={[s.statVal, { color: '#70aadd' }]}>{pedidos.length}</Text>
              <Text style={[s.statLbl, { color: '#1a3050' }]}>Pedidos</Text>
            </View>
          </View>

          <Text style={[s.sectionLabel, { marginTop: 4 }]}>RELATÓRIOS</Text>

          {/* Chart type tabs */}
          <View style={s.tabRow}>
            {([
              ['contas',   'Usuários'],
              ['produtos', 'Produtos'],
              ['pedidos',  'Pedidos'],
            ] as [Grafico, string][]).map(([id, label]) => (
              <TouchableOpacity key={id} onPress={() => setGrafico(id)}
                style={[s.tab, grafico === id && s.tabActive]}>
                <Text style={[s.tabText, grafico === id && s.tabTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Range presets + granularity chip */}
          <View style={s.presetRow}>
            <Text style={s.presetLabel}>Período:</Text>
            {PRESETS.map(p => (
              <TouchableOpacity key={p.days} onPress={() => setRangeDays(p.days)}
                style={[s.preset, rangeDays === p.days && s.presetActive]}>
                <Text style={[s.presetText, rangeDays === p.days && s.presetTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={s.granChip}>
              <Text style={s.granChipText}>{granLabel}</Text>
            </View>
          </View>

          {/* Filter pills */}
          {activeOptions.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.pillRow}>
              {activeOptions.map(opt => {
                const on = activeFilter.includes(opt)
                return (
                  <TouchableOpacity key={opt} onPress={() => toggleFilter(opt)}
                    style={[s.pill, on && s.pillOn]}>
                    <Text style={[s.pillText, on && s.pillTextOn]}>{filterLabel(opt)}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          )}

          {/* Bar chart */}
          <View style={s.chartCard}>
            {!hasData ? (
              <View style={s.noData}>
                <Text style={s.noDataText}>Sem dados no período</Text>
              </View>
            ) : (
              <BarChart
                data={{ labels: chartLabels, datasets: [{ data: chartValues }] }}
                width={width - 32}
                height={220}
                fromZero
                showValuesOnTopOfBars
                withInnerLines
                chartConfig={CHART_CFG}
                style={{ borderRadius: 8 }}
                yAxisLabel=""
                yAxisSuffix=""
              />
            )}
          </View>

        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: A.bg },
  topbar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: A.border },
  titleRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topTitle:        { fontSize: 15, fontWeight: '600', color: A.accent2 },
  adminBadge:      { backgroundColor: '#e8b84b', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  adminBadgeText:  { fontSize: 9, fontWeight: '700', color: '#1a1000' },
  logoutBtn:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 0.5, borderColor: '#7a2020', backgroundColor: '#3a1010' },
  logoutText:      { fontSize: 11, color: '#e07070', fontWeight: '600' },
  body:            { padding: 16, gap: 12, paddingBottom: 32 },
  sectionLabel:    { fontSize: 9, fontWeight: '700', color: A.text2, textTransform: 'uppercase', letterSpacing: 0.8 },

  statsGrid:       { flexDirection: 'row', gap: 8 },
  statCard:        { flex: 1, borderRadius: 8, borderWidth: 0.5, padding: 14, alignItems: 'center' },
  statVal:         { fontSize: 26, fontWeight: '700' },
  statLbl:         { fontSize: 10, marginTop: 2 },

  tabRow:          { flexDirection: 'row', gap: 4 },
  tab:             { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 7, borderWidth: 0.5, borderColor: '#1b341d' },
  tabActive:       { backgroundColor: '#1b341d', borderColor: '#2f6433' },
  tabText:         { fontSize: 10, fontWeight: '500', color: '#6a9a6c' },
  tabTextActive:   { color: '#a8dca9' },

  presetRow:       { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  presetLabel:     { fontSize: 10, color: '#6a9a6c' },
  preset:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, borderWidth: 0.5, borderColor: '#2a4a2c' },
  presetActive:    { backgroundColor: '#1b341d', borderColor: '#2f6433' },
  presetText:      { fontSize: 10, color: '#6a9a6c' },
  presetTextActive:{ color: '#a8dca9', fontWeight: '600' },
  granChip:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 0.5, borderColor: '#b8882b', backgroundColor: '#2e2410' },
  granChipText:    { fontSize: 9, color: '#e8b84b' },

  pillRow:         { flexDirection: 'row', gap: 6, paddingVertical: 2 },
  pill:            { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 0.5, borderColor: '#2a4a2c' },
  pillOn:          { borderColor: '#b8882b', backgroundColor: '#2e2410' },
  pillText:        { fontSize: 10, color: '#6a9a6c' },
  pillTextOn:      { color: '#e8b84b', fontWeight: '600' },

  chartCard:       { backgroundColor: '#1a2e1c', borderRadius: 10, borderWidth: 0.5, borderColor: '#2a4a2c', overflow: 'hidden' },
  noData:          { height: 180, alignItems: 'center', justifyContent: 'center' },
  noDataText:      { fontSize: 12, color: A.text3 },
})
