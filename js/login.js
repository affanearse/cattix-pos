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
    errorText.innerText = error.message
    return
  }

  errorText.innerText = "Login berhasil!"

  // pindah ke kasir
  window.location.href = "kasir.html"
}