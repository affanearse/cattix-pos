import { supabase } from './supabase.js'

let products = []

async function load() {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)

  products = data || []
  render()
}

function render() {
  const list = document.getElementById('list')
  list.innerHTML = ''

  products.forEach(p => {
    const discount = p.discount || 0
    const hargaDiskon = p.price - (p.price * discount / 100)

    const div = document.createElement('div')
    div.className = 'card'

    div.innerHTML = `
      <h4>${p.name}</h4>

      <div class="price-old">
        Rp ${new Intl.NumberFormat('id-ID').format(p.price)}
      </div>

      <div class="price-new" id="price-${p.id}">
        Rp ${new Intl.NumberFormat('id-ID').format(hargaDiskon)}
      </div>

      <div class="label">Diskon (%)</div>
      <input type="number"
      value="${discount}"
      min="0"
      max="100"
      oninput="this.value = Math.max(0, Math.min(100, this.value)); preview('${p.id}', ${p.price}, this.value)"
      onchange="save('${p.id}', this.value)">
    `

    list.appendChild(div)
  })
}

// ================= PREVIEW LANGSUNG =================
window.preview = function(id, price, value) {
  value = parseInt(value) || 0

  const hargaDiskon = price - (price * value / 100)

  document.getElementById(`price-${id}`).innerText =
    "Rp " + new Intl.NumberFormat('id-ID').format(hargaDiskon)
}

// ================= SIMPAN =================
window.save = async function(id, value) {
  value = parseInt(value)

  // VALIDASI
  if (isNaN(value) || value < 0) value = 0
  if (value > 100) value = 100

  // UPDATE
  const { error } = await supabase
    .from('products')
    .update({ discount: value })
    .eq('id', id)

  if (error) {
    alert("Gagal simpan diskon: " + error.message)
    return
  }

  // REFRESH DATA BIAR LANGSUNG UPDATE
  load()
}

// ================= NAV =================
window.goBack = function() {
  window.location.href = "kasir.html"
}

load()