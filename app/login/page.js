'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const NICHOS = ['Refrigeração','Climatização','Elétrica','Segurança','TI','Predial','Eng. Clínica']

export default function LoginPage() {
  const [aba, setAba] = useState('login')        // 'login' | 'cadastro'
  const [view, setView] = useState('form')        // cadastro: 'form' | 'codigo' | 'nichos'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)             // {type:'ok'|'erro', text}

  function avisar(type, text) { setMsg({ type, text }); setTimeout(() => setMsg(null), 5000) }

  // ---------- LOGIN ----------
  async function handleLogin(e) {
    e?.preventDefault?.()
    const emailLimpo = email.toLowerCase().trim()
    const senhaLimpa = senha.trim()
    if (!emailLimpo || !senhaLimpa) return avisar('erro', 'Preencha email e senha')
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailLimpo, password: senhaLimpa })
    setLoading(false)
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return avisar('erro', 'Senha incorreta. Clique em Esqueci minha senha para redefinir, ou cadastre de novo com a mesma senha.')
      }
      return avisar('erro', 'Erro: ' + error.message)
    }
    const { data: tenant } = await supabase.from('tenants').select('*').eq('email', emailLimpo).single()
    if (!tenant?.nicho_trial) { setView('nichos'); return }
    window.location.href = '/dashboard'
  }

  // ---------- CADASTRO ----------
  async function enviarCodigo(e) {
    e?.preventDefault?.()
    const emailLimpo = email.toLowerCase().trim()
    if (!nome || !emailLimpo) return avisar('erro', 'Preencha nome e email')
    setLoading(true)
    try {
      const res = await fetch('/api/enviar-codigo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLimpo })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao enviar código')
      setView('codigo')
      avisar('ok', json.dev_codigo ? `Código de teste: ${json.dev_codigo}` : 'Código enviado ao seu email')
    } catch (err) { avisar('erro', err.message) }
    finally { setLoading(false) }
  }

  async function verificarCodigo(e) {
    e?.preventDefault?.()
    const emailLimpo = email.toLowerCase().trim()
    if (!codigo || !senha) return avisar('erro', 'Preencha código e senha')
    setLoading(true)
    try {
      const res = await fetch('/api/verificar-codigo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLimpo, codigo, nome, empresa, senha })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao verificar')
      // sign in com a conta recém-criada
      const { error } = await supabase.auth.signInWithPassword({ email: emailLimpo, password: senha.trim() })
      if (error) { setAba('login'); avisar('ok', 'Conta criada! Faça login.'); return }
      setView('nichos')
    } catch (err) { avisar('erro', err.message) }
    finally { setLoading(false) }
  }

  async function escolherNicho(nicho) {
    const emailLimpo = email.toLowerCase().trim()
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const tenantEmail = session?.user?.email || emailLimpo
      const { error } = await supabase.from('tenants').update({ nicho_trial: nicho }).eq('email', tenantEmail)
      if (error) throw error
      window.location.href = '/dashboard'
    } catch (err) { avisar('erro', err.message) }
    finally { setLoading(false) }
  }

  // ---------- RENDER ----------
  if (view === 'nichos') {
    return (
      <div style={styles.page}>
        <div className="card-nichos">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0b1426', marginBottom: 8 }}>Escolha seu nicho</h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>7 dias grátis com 1 nicho à sua escolha.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
            {NICHOS.map(n => (
              <button key={n} onClick={() => escolherNicho(n)} disabled={loading}
                style={{ padding: 18, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#0b1426' }}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <style jsx>{`
          .card-nichos { max-width: 560px; margin: 80px auto; background:#fff; padding:32px; border-radius:16px; box-shadow:0 8px 30px rgba(0,0,0,.08); animation: fadeUp .5s ease; }
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
      </div>
    )
  }

  return (
    <div style={styles.split}>
      {/* ---------- PAINEL ESCURO ---------- */}
      <div className="left-panel" style={styles.left}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={styles.logo}>F</div>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: 16 }}>FieldOpsPro</div>
            <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: 1 }}>V3.4 UNIVERSAL • LUKE SOLUTION</div>
          </div>
        </div>

        <div className="copy">
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 14 }}>Sua operação de campo, sob controle total.</h1>
          <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6, maxWidth: 420 }}>Gestão de equipes, ativos e OS em 7 nichos. 7 dias grátis com 1 nicho à sua escolha.</p>
        </div>

        <div className="features" style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 36, maxWidth: 420 }}>
          <div style={styles.featureCard}>
            <span style={{ fontSize: 22 }}>📍</span>
            <div><div style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>Rastreio em tempo real</div><div style={{ color: '#94a3b8', fontSize: 11 }}>Tipo Uber, cliente vê técnico chegando</div></div>
          </div>
          <div style={styles.featureCard}>
            <span style={{ fontSize: 22 }}>📋</span>
            <div><div style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>OS com fotos e assinatura</div><div style={{ color: '#94a3b8', fontSize: 11 }}>Comprovação visual + assinatura digital</div></div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', color: '#64748b', fontSize: 11 }}>
          Planos: Básico R$97 • PRO R$197 • Enterprise R$597/mês com Sistema de Locação
        </div>
      </div>

      {/* ---------- PAINEL FORMULÁRIO ---------- */}
      <div className="right-panel" style={styles.right}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            <button onClick={() => { setAba('login'); setView('form') }}
              style={aba === 'login' ? styles.tabActive : styles.tab}>Login</button>
            <button onClick={() => { setAba('cadastro'); setView('form') }}
              style={aba === 'cadastro' ? styles.tabActive : styles.tab}>Cadastro Gestor</button>
          </div>

          {aba === 'login' && (
            <form onSubmit={handleLogin} className="fade">
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0b1426', marginBottom: 4 }}>Bem-vindo de volta</h2>
              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>Sistema detecta seu perfil automaticamente.</p>

              <label style={styles.label}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teste@teste.com" style={styles.input} />

              <label style={{ ...styles.label, marginTop: 16 }}>SENHA</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="......" style={styles.input} />

              {msg && <div style={{ ...styles.msg, color: msg.type === 'ok' ? '#059669' : '#dc2626' }}>{msg.text}</div>}

              <button type="submit" disabled={loading} style={styles.btnPrimary}>
                {loading ? 'Entrando...' : 'Entrar no FieldOpsPro'}
              </button>

              <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 20, textAlign: 'center' }}>
                Primeiro acesso? Vá em <strong style={{ color: '#0b1426' }}>Cadastro Gestor</strong>. Ele será dono da conta.
              </p>
            </form>
          )}

          {aba === 'cadastro' && view === 'form' && (
            <form onSubmit={enviarCodigo} className="fade">
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0b1426', marginBottom: 4 }}>Criar conta gestor</h2>
              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>O gestor é o dono da conta com acesso total.</p>

              <label style={styles.label}>NOME</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" style={styles.input} />

              <label style={{ ...styles.label, marginTop: 16 }}>EMPRESA</label>
              <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Nome da empresa" style={styles.input} />

              <label style={{ ...styles.label, marginTop: 16 }}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teste@teste.com" style={styles.input} />

              {msg && <div style={{ ...styles.msg, color: msg.type === 'ok' ? '#059669' : '#dc2626' }}>{msg.text}</div>}

              <button type="submit" disabled={loading} style={styles.btnPrimary}>
                {loading ? 'Enviando...' : 'Enviar código de verificação'}
              </button>
            </form>
          )}

          {aba === 'cadastro' && view === 'codigo' && (
            <form onSubmit={verificarCodigo} className="fade">
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0b1426', marginBottom: 4 }}>Verifique seu email</h2>
              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>Digite o código de 6 dígitos enviado para {email}.</p>

              <label style={styles.label}>CÓDIGO</label>
              <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="000000" maxLength={6} style={{ ...styles.input, letterSpacing: 4, textAlign: 'center', fontSize: 18 }} />

              <label style={{ ...styles.label, marginTop: 16 }}>SENHA</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="......" style={styles.input} />

              {msg && <div style={{ ...styles.msg, color: msg.type === 'ok' ? '#059669' : '#dc2626' }}>{msg.text}</div>}

              <button type="submit" disabled={loading} style={styles.btnPrimary}>
                {loading ? 'Verificando...' : 'Criar conta'}
              </button>
              <button type="button" onClick={() => setView('form')} style={{ ...styles.btnGhost, marginTop: 10 }}>Voltar</button>
            </form>
          )}
        </div>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes floatPulse { 0%,100%{opacity:.9} 50%{opacity:1} }
        .left-panel { animation: fadeUp .6s ease both; }
        .left-panel .copy { animation: fadeUp .7s ease .15s both; }
        .left-panel .features > * { animation: fadeUp .7s ease .3s both; }
        .left-panel .features > *:nth-child(2) { animation-delay: .42s; }
        .right-panel { animation: slideIn .55s ease both; }
        .fade { animation: fadeUp .4s ease both; }
      `}</style>
    </div>
  )
}

const styles = {
  split: { display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' },
  left: { flex: '0 0 60%', background: '#0b1426', padding: '48px 56px', display: 'flex', flexDirection: 'column', color: '#fff' },
  right: { flex: 1, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 },
  logo: { width: 34, height: 34, background: '#fff', color: '#0b1426', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18 },
  featureCard: { display: 'flex', alignItems: 'center', gap: 14, background: '#162137', borderRadius: 12, padding: '14px 16px' },
  tab: { flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #e5e7eb', background: 'transparent', color: '#9ca3af', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  tabActive: { flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #0b1426', background: '#0b1426', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: '#6b7280', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' },
  input: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, color: '#0b1426', outline: 'none', background: '#fff' },
  btnPrimary: { width: '100%', marginTop: 22, padding: 13, background: '#0b1426', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' },
  btnGhost: { width: '100%', padding: 11, background: 'transparent', color: '#6b7280', borderRadius: 10, fontWeight: 600, fontSize: 13, border: '1px solid #e5e7eb', cursor: 'pointer' },
  msg: { marginTop: 14, fontSize: 12, fontWeight: 600, lineHeight: 1.5 },
  page: { minHeight: '100vh', background: '#f4f7fa', fontFamily: 'Inter, system-ui, sans-serif', padding: 24 },
}
