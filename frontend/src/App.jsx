import DashboardLayout from './components/layout/DashboardLayout'
import InventoryTable from './components/inventory/InventoryTable'
import RiskSummary from './components/inventory/RiskSummary'
import AlertPanel from './components/alerts/AlertPanel'
import TariffSimulator from './components/intelligence/TariffSimulator'
import AIQuery from './components/intelligence/AIQuery'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('inventory')

  useEffect(() => {
    fetch('http://localhost:8000/inventory')
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch inventory:", err)
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-nexus-dark flex items-center justify-center font-black text-nexus-accent animate-pulse uppercase tracking-widest">
      Synchronizing Data Fabric...
    </div>
  )

  if (!data || data.error) return (
    <div className="min-h-screen bg-nexus-dark flex items-center justify-center flex-col text-nexus-danger">
      <div className="text-4xl font-black mb-4 uppercase">Data Fabric Unavailable</div>
      <div className="text-xs text-slate-500 uppercase tracking-widest">Check Backend Status (uv run main.py)</div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return (
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1">
              <RiskSummary inventory={data.inventory} alerts={data.alerts} />
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 px-2">Unified Inventory Truth</h2>
              <InventoryTable inventory={data.inventory} />
            </div>
            <AlertPanel alerts={data.alerts} />
          </div>
        )
      case 'tariffs':
        return <TariffSimulator inventory={data.inventory} tariffs={data.tariffs} />
      case 'query':
        return <AIQuery />
      case 'parser':
        return (
          <div className="flex flex-col items-center justify-center h-96 opacity-40 border-2 border-dashed border-white/10 rounded-3xl">
            <div className="text-3xl font-black uppercase mb-2">Parser Demo Coming in Phase 4</div>
            <div className="text-xs uppercase tracking-[0.3em]">Document OCR & Extraction Layer</div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  )
}


export default App
