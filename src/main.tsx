import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'
import { khoiDongGiaoDien } from '@/lib/giaoDien'
import { NhaCungCapNgonNgu, chuanBiNgonNgu } from '@/i18n'

// Mau sac, co chu, hieu ung... doc tu may cua nguoi dung
khoiDongGiaoDien()

const goc = document.getElementById('root')
if (!goc) throw new Error('Không tìm thấy thẻ #root trong index.html')

/*
 * Doi tai xong ban dich ROI MOI ve giao dien.
 * Ve truoc roi doi chu sau thi nguoi xem thay chu tieng Anh nhay mot cai
 * sang tieng cua ho - trong rat nghiep du.
 *
 * Tieng Anh nam san trong phan mem nen khong phai doi gi ca. Sau thu
 * tieng con lai moi phai tai, va cung chi tai dung thu tieng can dung.
 */
const banDau = await chuanBiNgonNgu()

createRoot(goc).render(
  <StrictMode>
    <NhaCungCapNgonNgu banDau={banDau}>
      <App />
    </NhaCungCapNgonNgu>
  </StrictMode>,
)
