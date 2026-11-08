import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AlertCircle, X } from 'lucide-react'
import PaperTexture from './components/PaperTexture'
import { MobileTopBar, Sidebar } from './components/Sidebar'
import BottomNav from './components/BottomNav'
import Inbox from './pages/Inbox'
import NewDecision from './pages/NewDecision'
import Review from './pages/Review'
import DecisionList from './pages/DecisionList'
import DecisionDetail from './pages/DecisionDetail'
import Overview from './pages/Overview'
import Settings from './pages/Settings'
import { useDecisions } from './hooks/useDecisions'

function StorageNotice({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div
      className="archive-panel mb-5 flex items-start gap-3 px-4 py-3"
      style={{ borderColor: 'rgba(196,122,84,.42)' }}
      role="alert"
    >
      <AlertCircle size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--due)' }} />
      <p className="flex-1 text-[0.8rem] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
        {message}
      </p>
      {onClose && (
        <button
          type="button"
          aria-label="关闭提示"
          onClick={onClose}
          className="flex h-11 w-8 shrink-0 items-center justify-center"
          style={{ color: 'var(--text-faint)' }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}

export default function App() {
  const { storageError, lastWriteOk } = useDecisions()
  const [noticeClosed, setNoticeClosed] = useState(false)
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  return (
    <>
      <PaperTexture />
      <Sidebar />
      <MobileTopBar />
      <main className="app-main relative z-10 mx-auto w-full max-w-archive px-4 pt-6 sm:px-6 lg:px-10 lg:pt-11">
        {storageError && !noticeClosed && (
          <StorageNotice message={storageError} onClose={() => setNoticeClosed(true)} />
        )}
        {!lastWriteOk && (
          <StorageNotice message="写入本地存储失败，本次修改可能不会被保存。请检查浏览器隐私模式或存储空间后重试。" />
        )}
        <Routes>
          <Route path="/" element={<Inbox />} />
          <Route path="/new" element={<NewDecision />} />
          <Route path="/review/:id" element={<Review />} />
          <Route path="/list" element={<DecisionList />} />
          <Route path="/decision/:id" element={<DecisionDetail />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </>
  )
}
