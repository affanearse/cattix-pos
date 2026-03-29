import { supabase } from './supabase.js'

window.login = async function () {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const errorText = document.getElementById('error')

  errorText.innerText = "Loading..."

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })

  if (error) {
  const msg = error.message.toLowerCase()

  if (
    msg.includes("banned") ||
    msg.includes("blocked") ||
    msg.includes("suspended")
  ) {
    errorText.innerText = "Akun Anda telah diblokir"
  } else if (msg.includes("invalid login")) {
    errorText.innerText = "Email atau password salah"
  } else {
    errorText.innerText = "Terjadi kesalahan, coba lagi"
  }

  return
}

  errorText.innerText = "Login berhasil!"

  // pindah ke kasir
  window.location.href = "kasir.html"
}