import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'
import { khoiDongGiaoDien } from '@/lib/giaoDien'

// Mau sac, co chu, hieu ung... doc tu may cua nguoi dung
khoiDongGiaoDien()

const goc = document.getElementById('root')
if (!goc) throw new Error('Không tìm thấy thẻ #root trong index.html')

createRoot(goc).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
