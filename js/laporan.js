import { supabase } from './supabase.js'

let chart = null

let lastReport = {
  type: "",
  total: 0,
  trx: 0,
  best: "-",
  worst: "-",
  analisis: ""
}

// ================= INPUT SWITCH =================
window.changeInput = function() {
  const type = document.getElementById('type').value

  document.getElementById('input-harian').style.display = 'none'
  document.getElementById('input-bulanan').style.display = 'none'
  document.getElementById('input-tahun').style.display = 'none'

  if (type === 'harian') {
    document.getElementById('input-harian').style.display = 'block'
  }

  if (type === 'bulanan') {
    document.getElementById('input-bulanan').style.display = 'flex'
  }

  if (type === 'tahunan') {
    document.getElementById('input-tahun').style.display = 'block'
  }
}

// ================= HITUNG PRODUK =================
function hitungProduk(items) {
  let map = {}

  items.forEach(i => {
    if (!map[i.name]) {
      map[i.name] = {
        name: i.name,
        price: i.price,
        qty: 0,
        total: 0
      }
    }

    map[i.name].qty += i.qty
    map[i.name].total += i.price * i.qty
  })

  return Object.values(map)
}

// ================= LOAD LAPORAN =================
window.loadLaporan = async function() {
  const type = document.getElementById('type').value

  let selectedDate, selectedMonth, selectedYear

  if (type === 'harian') {
    selectedDate = document.getElementById('input-harian').value
    if (!selectedDate) return
  }

  if (type === 'bulanan') {
    selectedMonth = document.getElementById('bulan').value
    selectedYear = document.getElementById('tahun-bulan').value
    if (!selectedYear) return
  }

  if (type === 'tahunan') {
    selectedYear = document.getElementById('input-tahun').value
    if (!selectedYear) return
  }

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  const { data: trx } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)

  const { data: items } = await supabase
    .from('transaction_items')
    .select('*')

  let filtered = [], labels = [], values = []

  // ===== FILTER =====
  if (type === 'harian') {
    filtered = trx.filter(t =>
      new Date(t.created_at).toISOString().split('T')[0] === selectedDate
    )

    for (let i = 0; i < 24; i++) {
      labels.push(i + ":00")
      values.push(filtered
        .filter(t => new Date(t.created_at).getHours() === i)
        .reduce((s, t) => s + t.total, 0))
    }
  }

  if (type === 'bulanan') {
    filtered = trx.filter(t => {
      const d = new Date(t.created_at)
      return d.getMonth() == selectedMonth && d.getFullYear() == selectedYear
    })

    const days = new Date(selectedYear, parseInt(selectedMonth)+1, 0).getDate()

    for (let i = 1; i <= days; i++) {
      labels.push("Tgl " + i)
      values.push(filtered
        .filter(t => new Date(t.created_at).getDate() === i)
        .reduce((s, t) => s + t.total, 0))
    }
  }

  if (type === 'tahunan') {
    filtered = trx.filter(t =>
      new Date(t.created_at).getFullYear() == selectedYear
    )

    for (let i = 0; i < 12; i++) {
      labels.push("Bulan " + (i+1))
      values.push(filtered
        .filter(t => new Date(t.created_at).getMonth() === i)
        .reduce((s, t) => s + t.total, 0))
    }
  }

  const total = filtered.reduce((s,t)=>s+t.total,0)

  document.getElementById('total').innerText = "Rp " + new Intl.NumberFormat('id-ID').format(total)
  document.getElementById('trx').innerText = filtered.length

  // ===== PRODUK TERLARIS =====
  let map = {}
  items.forEach(i=>{
    if(!map[i.name]) map[i.name]=0
    map[i.name]+=i.qty
  })

  let sorted = Object.entries(map).sort((a,b)=>b[1]-a[1])

  let best = sorted[0]?.[0] || "-"
  let worst = sorted[sorted.length-1]?.[0] || "-"

  document.getElementById('best').innerText = best
  document.getElementById('worst').innerText = worst

  let message = total > 0
    ? (filtered.length > 10 ? "Penjualan sangat ramai 🔥" : "Penjualan cukup baik 👍")
    : "Belum ada transaksi 😢"

  document.getElementById('analisis').innerText = message

  lastReport = { type, total, trx: filtered.length, best, worst, analisis: message }

  // ===== CHART =====
  if (chart) chart.destroy()

  chart = new Chart(document.getElementById('chart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Omset',
        data: values,
        borderWidth: 2,
        tension: 0.3
      }]
    }
  })
}

// ================= DOWNLOAD PDF (TABEL) =================
window.downloadPDF = async function() {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: "landscape" })

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  const { data: trx } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)

  const { data: items } = await supabase
    .from('transaction_items')
    .select('*')

  let filteredTrx = trx

  if (lastReport.type === 'bulanan') {
    const bulan = document.getElementById('bulan').value
    const tahun = document.getElementById('tahun-bulan').value

    filteredTrx = trx.filter(t => {
      const d = new Date(t.created_at)
      return d.getMonth() == bulan && d.getFullYear() == tahun
    })
  }

  const trxIds = filteredTrx.map(t => t.id)

  const filteredItems = items.filter(i =>
    trxIds.includes(i.transaction_id)
  )

  const produk = hitungProduk(filteredItems)

  // ===== JUDUL =====
  let y = 15
  doc.setFontSize(16)
  doc.text("Laporan Penjualan", 148, y, null, null, "center")

  y += 8
  doc.setFontSize(12)
  doc.text("Cattix Store", 148, y, null, null, "center")

  y += 10

  // ===== TABLE =====
  const startX = 15
  let x = startX

  const col = {
    nama: 70,
    harga: 50,
    qty: 50,
    total: 60
  }

  doc.setFontSize(10)

  // header
  doc.rect(x, y, col.nama, 10)
  doc.text("Nama Barang", x+2, y+7)

  x += col.nama
  doc.rect(x, y, col.harga, 10)
  doc.text("Harga", x+2, y+7)

  x += col.harga
  doc.rect(x, y, col.qty, 10)
  doc.text("Jumlah Terjual", x+2, y+7)

  x += col.qty
  doc.rect(x, y, col.total, 10)
  doc.text("Total", x+2, y+7)

  y += 10

  let grandTotal = 0

  produk.forEach(p => {
    let x = startX

    doc.rect(x, y, col.nama, 10)
    doc.text(p.name, x+2, y+7)

    x += col.nama
    doc.rect(x, y, col.harga, 10)
    doc.text("Rp " + new Intl.NumberFormat('id-ID').format(p.price), x+2, y+7)

    x += col.harga
    doc.rect(x, y, col.qty, 10)
    doc.text(String(p.qty), x+2, y+7)

    x += col.qty
    doc.rect(x, y, col.total, 10)
    doc.text("Rp " + new Intl.NumberFormat('id-ID').format(p.total), x+2, y+7)

    grandTotal += p.total
    y += 10
  })

  // total
  let xTotal = startX

  doc.rect(xTotal, y, col.nama + col.harga + col.qty, 10)
  doc.text("Total Penjualan", xTotal+2, y+7)

  xTotal += col.nama + col.harga + col.qty
  doc.rect(xTotal, y, col.total, 10)
  doc.text("Rp " + new Intl.NumberFormat('id-ID').format(grandTotal), xTotal+2, y+7)

  doc.save("laporan-tabel.pdf")
}

// NAV
window.goBack = function() {
  window.location.href = "kasir.html"
}

// INIT
changeInput()