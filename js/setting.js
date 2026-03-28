import { supabase } from './supabase.js'

// ================= LOAD DATA =================
async function load() {
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    alert("User tidak ditemukan, silakan login ulang")
    window.location.href = "login.html"
    return
  }

  const user = userData.user

  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    alert("Gagal load data: " + error.message)
    return
  }

  if (!data) {
    document.getElementById('name').value = "Cattix Store"
    document.getElementById('address').value = "Alamat toko"
    document.getElementById('phone').value = "08xxxxxxxxxx"
    return
  }

  document.getElementById('name').value = data.name || ""
  document.getElementById('address').value = data.address || ""
  document.getElementById('phone').value = data.phone || ""

  if (data.logo) {
    document.getElementById('preview-logo').src = data.logo
  }
}

// ================= PREVIEW LOGO =================
document.getElementById('logo').addEventListener('change', function () {
  const file = this.files[0]
  if (!file) return

  if (!file.type.startsWith("image/")) {
    alert("File harus berupa gambar")
    this.value = ""
    return
  }

  const url = URL.createObjectURL(file)
  document.getElementById('preview-logo').src = url
})

// ================= SAVE =================
window.save = async function () {
  const name = document.getElementById('name').value
  const address = document.getElementById('address').value
  const phone = document.getElementById('phone').value
  const file = document.getElementById('logo').files[0]

  if (!name || !address || !phone) {
    alert("Semua field wajib diisi")
    return
  }

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    alert("User tidak ditemukan")
    return
  }

  let logoUrl = null

  // ================= UPLOAD LOGO =================
  if (file) {
    // VALIDASI FILE
    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar")
      return
    }

    if (file.size > 1024 * 1024) {
      alert("Ukuran maksimal 1MB")
      return
    }

    const ext = file.name.split('.').pop()

    // 🔥 NAMA UNIK (ANTI CACHE & ERROR)
    const fileName = `${user.id}/logo-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase
      .storage
      .from('logos')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: 'no-cache'
      })

    if (uploadError) {
      alert("Gagal upload logo: " + uploadError.message)
      console.error(uploadError)
      return
    }

    const { data } = supabase
      .storage
      .from('logos')
      .getPublicUrl(fileName)

    logoUrl = data.publicUrl
  }

  // ================= CEK DATA =================
  const { data: existing } = await supabase
    .from('store_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('store_settings')
      .update({
        name,
        address,
        phone,
        ...(logoUrl && { logo: logoUrl })
      })
      .eq('user_id', user.id)

    if (error) {
      alert("Gagal update: " + error.message)
      return
    }

  } else {
    const { error } = await supabase
      .from('store_settings')
      .insert([{
        user_id: user.id,
        name,
        address,
        phone,
        logo: logoUrl
      }])

    if (error) {
      alert("Gagal simpan: " + error.message)
      return
    }
  }

  alert("Berhasil disimpan ✅")

  // REFRESH
  load()
}

// ================= NAV =================
window.goBack = function () {
  window.location.href = "kasir.html"
}

// ================= INIT =================
load()