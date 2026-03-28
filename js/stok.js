import { supabase } from './supabase.js'

let products = []
let filtered = []
let selectedId = null

function formatInputRupiah(input) {
  let value = input.value.replace(/\D/g, '')
  input.value = new Intl.NumberFormat('id-ID').format(value)
}

function getAngka(value) {
  return parseInt(value.replace(/\./g, '')) || 0
}

async function loadProduk() {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)

  products = data || []
  filtered = products
  render()
}

function render() {
  const list = document.getElementById('list')
  list.innerHTML = ''

  filtered.forEach(p => {

    let stockClass = 'stock-ok'
    let stockText = p.stock

    if (p.stock === 0) {
      stockClass = 'stock-zero'
      stockText = 'Habis'
    } else if (p.stock <= 5) {
      stockClass = 'stock-low'
    }

    const tr = document.createElement('tr')

    tr.innerHTML = `
      <td>${p.name}</td>
      <td>Rp ${new Intl.NumberFormat('id-ID').format(p.price)}</td>
      <td><span class="stock-badge ${stockClass}">${stockText}</span></td>
      <td>
        <div class="actions">
          <button class="edit" onclick="editProduk('${p.id}')">Edit</button>
          <button class="delete" onclick="hapus('${p.id}')">Hapus</button>
        </div>
      </td>
    `

    list.appendChild(tr)
  })
}

window.search = function(keyword) {
  keyword = keyword.toLowerCase()
  filtered = products.filter(p =>
    p.name.toLowerCase().includes(keyword)
  )
  render()
}

window.tambahProduk = async function () {
  const name = document.getElementById('name').value
  const price = getAngka(document.getElementById('price').value)
  const stock = parseInt(document.getElementById('stock').value)

  if (!name || !price || !stock) {
    alert("Isi semua data")
    return
  }

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  await supabase.from('products').insert([{
    user_id: user.id,
    name,
    price,
    stock
  }])

  document.getElementById('name').value = ''
  document.getElementById('price').value = ''
  document.getElementById('stock').value = ''

  loadProduk()
}

window.editProduk = function(id) {
  const produk = products.find(p => p.id === id)

  selectedId = id

  document.getElementById('edit-name').value = produk.name
  document.getElementById('edit-price').value =
    new Intl.NumberFormat('id-ID').format(produk.price)
  document.getElementById('edit-stock').value = produk.stock

  document.getElementById('modal').style.display = 'flex'
}

window.saveEdit = async function () {
  const name = document.getElementById('edit-name').value
  const price = getAngka(document.getElementById('edit-price').value)
  const stock = parseInt(document.getElementById('edit-stock').value)

  if (!name || !price || !stock) {
    alert("Isi semua data")
    return
  }

  await supabase
    .from('products')
    .update({ name, price, stock })
    .eq('id', selectedId)

  closeModal()
  loadProduk()
}

window.closeModal = function () {
  document.getElementById('modal').style.display = 'none'
}

window.hapus = async function(id) {
  if (!confirm("Hapus produk?")) return

  await supabase
    .from('products')
    .delete()
    .eq('id', id)

  loadProduk()
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('price').addEventListener('input', function() {
    formatInputRupiah(this)
  })

  document.getElementById('edit-price').addEventListener('input', function() {
    formatInputRupiah(this)
  })
})

loadProduk()

// BACK KE KASIR
window.goBack = function() {
  window.location.href = "kasir.html"
}
