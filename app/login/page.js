async function handleLogin(){
  const emailLimpo = email.toLowerCase().trim();
  const senhaLimpa = senha.trim();
  if(!emailLimpo||!senhaLimpa) return alert('Preencha email e senha')
  setLoading(true)
  const { data, error } = await supabase.auth.signInWithPassword({email: emailLimpo, password: senhaLimpa})
  setLoading(false)
  if(error) {
    console.error(error);
    // Mostra erro real
    if(error.message.includes('Invalid login credentials')){
      return alert('Senha incorreta. Clique em Esqueci minha senha para redefinir, ou cadastre de novo com a mesma senha.')
    }
    return alert('Erro: '+error.message)
  }
  const { data: tenant } = await supabase.from('tenants').select('*').eq('email', emailLimpo).single()
  if(!tenant?.nicho_trial) setView('nichos')
  else window.location.href='/dashboard'
}
