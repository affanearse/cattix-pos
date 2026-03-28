import { supabase } from './supabase.js'

let products = []
let filtered = []
let cart = []

// ================== CEK LOGIN ==================
async function checkAuth() {
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) {
    alert("Silakan login terlebih dahulu")
    window.location.href = "login.html"
    return
  }
}

// ================== LOAD PRODUK ==================
async function loadProduk() {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    alert("User tidak ditemukan, silakan login ulang")
    window.location.href = "login.html"
    return
  }

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)

  products = data || []
  filtered = products.filter(p => p.stock > 0)
  renderProduk()
}

// ================== RENDER PRODUK ==================
function renderProduk() {
  const list = document.getElementById('produk-list')
  list.innerHTML = ''

  filtered.forEach(p => {
    const discount = p.discount || 0
    const hargaDiskon = p.price - (p.price * discount / 100)

    const div = document.createElement('div')
    div.className = 'produk-item'

    div.innerHTML = `
      <h4>${p.name}</h4>
      ${
        discount > 0
        ? `
          <p style="text-decoration: line-through; font-size:12px;">
            Rp ${new Intl.NumberFormat('id-ID').format(p.price)}
          </p>
          <p>Rp ${new Intl.NumberFormat('id-ID').format(hargaDiskon)}</p>
          <small style="color:red;">-${discount}%</small>
        `
        : `<p>Rp ${new Intl.NumberFormat('id-ID').format(p.price)}</p>`
      }
    `

    div.onclick = () => tambahKeKeranjang(p)
    list.appendChild(div)
  })
}

// ================== SEARCH ==================
window.searchProduk = function(keyword) {
  keyword = keyword.toLowerCase()
  filtered = products.filter(p =>
    p.name.toLowerCase().includes(keyword) && p.stock > 0
  )
  renderProduk()
}

// ================== KERANJANG ==================
function tambahKeKeranjang(p) {
  const item = cart.find(i => i.id === p.id)

  if (item) {
    if (item.qty < p.stock) item.qty++
  } else {
    cart.push({ ...p, qty: 1 })
  }

  renderCart()
}

// ================== RENDER CART ==================
function renderCart() {
  const list = document.getElementById('cart-list')
  list.innerHTML = ''

  let total = 0

  cart.forEach(item => {
    const discount = item.discount || 0
    const hargaDiskon = item.price - (item.price * discount / 100)

    total += hargaDiskon * item.qty

    const div = document.createElement('div')
    div.className = 'cart-item'

    div.innerHTML = `
      <span>${item.name}</span>

      <div class="qty-box">
        <button onclick="kurang('${item.id}')">-</button>
        <span>${item.qty}</span>
        <button onclick="tambah('${item.id}')">+</button>
      </div>

      <span>
        Rp ${new Intl.NumberFormat('id-ID').format(hargaDiskon * item.qty)}
        ${discount > 0 ? `<br><small style="color:red;">-${discount}%</small>` : ''}
      </span>
    `

    list.appendChild(div)
  })

  document.getElementById('total').innerText =
    new Intl.NumberFormat('id-ID').format(total)
}

// ================== QTY ==================
window.tambah = function(id) {
  const item = cart.find(i => i.id === id)
  const produk = products.find(p => p.id === id)

  if (item.qty < produk.stock) {
    item.qty++
    renderCart()
  }
}

window.kurang = function(id) {
  const index = cart.findIndex(i => i.id === id)

  if (cart[index].qty > 1) {
    cart[index].qty--
  } else {
    cart.splice(index, 1)
  }

  renderCart()
}

// ================== LOAD TOKO ==================
async function loadStore() {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  const { data } = await supabase
    .from('store_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  document.getElementById('store-name').innerText =
    data?.name || "Cattix Store"

  document.getElementById('store-address').innerText =
    data?.address || "Alamat toko"

  document.getElementById('store-phone').innerText =
    data?.phone || "-"

  // ✅ LOGO
  if (data?.logo) {
    document.getElementById('struk-logo').src = data.logo
  }
}

// ================== BAYAR ==================
window.bayar = async function() {
  if (cart.length === 0) {
    alert("Keranjang kosong")
    return
  }

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    alert("User tidak ditemukan")
    return
  }

  await loadStore()

  const trxId = "TRX-" + Date.now()
  const date = new Date().toLocaleString()

  document.getElementById('trx-id').innerText = trxId
  document.getElementById('trx-date').innerText = date

  const itemsDiv = document.getElementById('struk-items')
  itemsDiv.innerHTML = ''

  let total = 0
  let itemsToInsert = []

  for (let item of cart) {
    const discount = item.discount || 0
    const hargaDiskon = item.price - (item.price * discount / 100)

    total += hargaDiskon * item.qty

    const div = document.createElement('div')
    div.innerHTML = `
      ${item.name} x${item.qty}<br>
      Rp ${new Intl.NumberFormat('id-ID').format(hargaDiskon * item.qty)}
      ${discount > 0 ? `<br><small>Diskon ${discount}%</small>` : ''}
    `
    itemsDiv.appendChild(div)

    itemsToInsert.push({
      transaction_id: trxId,
      product_id: item.id,
      name: item.name,
      price: hargaDiskon,
      qty: item.qty
    })

    const produk = products.find(p => p.id === item.id)
    const newStock = produk.stock - item.qty

    await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', item.id)
  }

  document.getElementById('struk-total').innerText =
    new Intl.NumberFormat('id-ID').format(total)

  const payment = document.getElementById('payment').value

  // SIMPAN TRANSAKSI
  const { error: trxError } = await supabase
    .from('transactions')
    .insert([{
      id: trxId,
      user_id: user.id,
      total: total,
      payment_method: payment
    }])

  if (trxError) {
    alert("Gagal simpan transaksi: " + trxError.message)
    return
  }

  // SIMPAN ITEM
  const { error: itemError } = await supabase
    .from('transaction_items')
    .insert(itemsToInsert)

  if (itemError) {
    alert("Gagal simpan item: " + itemError.message)
    return
  }

  // PRINT
  if (confirm("Print struk?")) {
    document.getElementById('struk').style.display = 'block'
    window.print()
    document.getElementById('struk').style.display = 'none'
  }

  // RESET
  cart = []
  loadProduk()
  renderCart()
}

// ================== MENU ==================
window.toggleMenu = function() {
  const menu = document.getElementById('menu-dropdown')
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block'
}

window.goTo = function(page) {
  window.location.href = page
}

window.logout = async function() {
  await supabase.auth.signOut()
  window.location.href = "login.html"
}

// ================== USER INFO ==================
async function loadUserInfo() {
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (user) {
    document.getElementById('user-info').innerText =
      "Login sebagai: " + user.email
  }
}

// ================== INIT ==================
checkAuth()
loadProduk()
loadStore()
loadUserInfo()