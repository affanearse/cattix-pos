import { supabase } from './supabase.js'

let transactions = []
let filtered = []

// ================= LOAD =================
async function load() {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    alert("Silakan login ulang")
    window.location.href = "login.html"
    return
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    alert("Error: " + error.message)
    return
  }

  transactions = data || []
  filtered = [] // kosong dulu

  render()
}

// ================= RENDER =================
function render() {
  const list = document.getElementById('list')
  list.innerHTML = ''

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty">Tidak ada transaksi</p>'
    return
  }

  filtered.forEach(trx => {
    const div = document.createElement('div')
    div.className = 'card'

    const badgeClass = trx.payment_method === 'cash' ? 'cash' : 'qris'

    div.innerHTML = `
      <div class="card-top">
        <span class="trx-id">${trx.id}</span>
        <span class="badge ${badgeClass}">
          ${trx.payment_method.toUpperCase()}
        </span>
      </div>

      <p class="small">${new Date(trx.created_at).toLocaleString()}</p>

      <h3>Rp ${new Intl.NumberFormat('id-ID').format(trx.total)}</h3>
    `

    div.onclick = () => showDetail(trx.id)

    list.appendChild(div)
  })
}

// ================= FILTER TANGGAL =================
window.filterTanggal = function() {
  const selectedDate = document.getElementById('date').value

  if (!selectedDate) {
    filtered = []
    render()
    return
  }

  filtered = transactions.filter(trx => {
    const trxDate = new Date(trx.created_at)
      .toISOString()
      .split('T')[0]

    return trxDate === selectedDate
  })

  render()
}

// ================= SEARCH =================
window.search = function(keyword) {
  keyword = keyword.toLowerCase()

  if (!keyword) {
    filtered = []
    render()
    return
  }

  filtered = transactions.filter(t =>
    t.id.toLowerCase().includes(keyword)
  )

  render()
}

// ================= DETAIL =================
async function showDetail(trxId) {
  const { data, error } = await supabase
    .from('transaction_items')
    .select('*')
    .eq('transaction_id', trxId)

  if (error) {
    alert("Gagal load detail")
    return
  }

  const trx = transactions.find(t => t.id === trxId)

  document.getElementById('detail-id').innerText = trxId
  document.getElementById('detail-date').innerText =
    new Date(trx.created_at).toLocaleString()

  const itemsDiv = document.getElementById('detail-items')
  itemsDiv.innerHTML = ''

  data.forEach(item => {
    const div = document.createElement('div')
    div.innerHTML = `
      ${item.name} x${item.qty} <br>
      Rp ${new Intl.NumberFormat('id-ID').format(item.price * item.qty)}
    `
    itemsDiv.appendChild(div)
  })

  document.getElementById('detail-total').innerText =
    new Intl.NumberFormat('id-ID').format(trx.total)

  document.getElementById('modal').style.display = 'flex'
}

// ================= CLOSE MODAL =================
window.closeModal = function() {
  document.getElementById('modal').style.display = 'none'
}

// ================= NAV =================
window.goBack = function() {
  window.location.href = "kasir.html"
}

// INIT
load()