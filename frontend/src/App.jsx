import { useState, useEffect } from 'react'
import DashboardLayout from './components/layout/DashboardLayout'
import InventoryTable from './components/inventory/InventoryTable'
import RiskSummary from './components/inventory/RiskSummary'
import AlertPanel from './components/alerts/AlertPanel'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1">
          <RiskSummary inventory={data.inventory} alerts={data.alerts} />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 px-2">Unified Inventory Truth</h2>
          <InventoryTable inventory={data.inventory} />
        </div>
        <AlertPanel alerts={data.alerts} />
      </div>
    </DashboardLayout>
  )
}

export default App
