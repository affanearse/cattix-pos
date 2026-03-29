import { supabase } from './supabase.js'

let products = []

// ================= LOAD =================
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

// ================= RENDER =================
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

      <div class="discount-box">
        <label>Diskon</label>

        <div class="input-discount ${discount > 0 ? 'active' : ''}">
          <input type="number"
            value="${discount}"
            min="0"
            max="100"
            oninput="handleInput(this, '${p.id}', ${p.price})"
            onchange="save('${p.id}', this.value)">
          <span>%</span>
        </div>

        <small class="discount-info">
          Harga otomatis berubah saat diisi
        </small>
      </div>
    `

    list.appendChild(div)
  })
}

// ================= ANIMASI HARGA =================
function animatePrice(el, start, end) {
  let current = start
  const step = (end - start) / 10

  const interval = setInterval(() => {
    current += step

    if ((step > 0 && current >= end) || (step < 0 && current <= end)) {
      current = end
      clearInterval(interval)
    }

    el.innerText =
      'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(current))
  }, 20)
}

// ================= HANDLE INPUT =================
window.handleInput = function(el, id, price) {
  let value = parseInt(el.value) || 0

  // batasi 0 - 100
  value = Math.max(0, Math.min(100, value))
  el.value = value

  const hargaDiskon = price - (price * value / 100)

  const priceEl = document.getElementById(`price-${id}`)

  // ambil harga sekarang
  const currentText = priceEl.innerText.replace(/\D/g, '')
  const currentPrice = parseInt(currentText) || 0

  // animasi angka
  animatePrice(priceEl, currentPrice, hargaDiskon)

  // animasi highlight
  priceEl.classList.add('price-animate')
  setTimeout(() => {
    priceEl.classList.remove('price-animate')
  }, 300)

  // efek aktif input
  const wrapper = el.parentElement
  if (value > 0) {
    wrapper.classList.add('active')
  } else {
    wrapper.classList.remove('active')
  }
}

// ================= SAVE =================
window.save = async function(id, value) {
  value = parseInt(value) || 0

  const { error } = await supabase
    .from('products')
    .update({ discount: value })
    .eq('id', id)

  if (error) {
    alert("Gagal simpan: " + error.message)
  }
}

window.goBack = function() {
  window.location.href = "kasir.html"
}

// ================= INIT =================
load()