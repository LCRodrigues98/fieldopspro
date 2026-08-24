
'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const NICHOS = [
  { id: 'Eng Clínica', icon: '🏥', desc: 'Autoclave, bisturi, monitor' },
  { id: 'Refrigeração', icon: '❄️', desc: 'Câmaras frias, balcões' },
  { id: 'Climatização', icon: '🌬️', desc: 'Split, VRF, Chiller' },
  { id: 'Elétrica', icon: '⚡', desc: 'Quadros, nobreaks' },
  { id: 'Segurança', icon: '🛡️', desc: 'CFTV, alarmes' },
  { id: 'TI', icon: '💻', desc: 'Servidores, redes' },
  { id: 'Predial', icon: '🏢', desc: 'Elevadores, facilities' },
]

export default function LoginPage(){
  const [view, setView] = useState('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [devCodigo, setDevCodigo] = useState(null)

  async function handleLogin(){
    if(!email||!senha) return alert('Preencha email e senha')
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({email, password:senha})
    setLoading(false)
    if(error) return alert('Erro: '+error.message)
    const { data: tenant } = await supabase.from('tenants').select('*').eq('email', email.toLowerCase()).single()
    if(!tenant?.nicho_trial) setView('nichos')
    else window.location.href='/dashboard'
  }

  async function handleCadastro(){
    if(!email||!nome||!empresa||!senha) return alert('Preencha nome, empresa, email e crie sua senha')
    if(senha.length<6) return alert('Senha mínimo 6 caracteres')
    setLoading(true)
    try{
      const res = await fetch('/api/enviar-codigo',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, nome, empresa})})
      const json = await res.json()
      if(!res.ok) throw new Error(json.error)
      setDevCodigo(json.dev_codigo || null)
      setView('verificar')
    }catch(e){ alert(e.message) }
    setLoading(false)
  }

  async function handleVerificar(){
    if(!codigo) return alert('Digite o código de 6 dígitos')
    setLoading(true)
    try{
      const res = await fetch('/api/verificar-codigo',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, codigo, nome, empresa, senha})})
      const json = await res.json()
      if(!res.ok) throw new Error(json.error)
      const { error } = await supabase.auth.signInWithPassword({email, password:senha})
      if(error) throw error
      setView('nichos')
    }catch(e){ alert(e.message) }
    setLoading(false)
  }

  async function escolherNicho(nichoId){
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('tenants').update({nicho_trial:nichoId, trial_inicio:new Date().toISOString(), trial_fim:new Date(Date.now()+7*24*60*60*1000).toISOString()}).eq('email', session.user.email)
    window.location.href='/dashboard'
  }

  if(view==='nichos'){
    return (
      <div style={{minHeight:'100vh', background:'#f8fafc', padding:24, fontFamily:'Inter'}}>
        <div style={{maxWidth:900, margin:'0 auto'}}>
          <h1 style={{fontSize:26, fontWeight:900, textAlign:'center'}}>Escolha 1 nicho para testar 7 dias grátis</h1>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:16, marginTop:24}}>
            {NICHOS.map(n=>(<div key={n.id} onClick={()=>escolherNicho(n.id)} style={{background:'white', border:'1px solid #e2e8f0', borderRadius:16, padding:20, cursor:'pointer'}}><div style={{fontSize:32}}>{n.icon}</div><div style={{fontWeight:800, marginTop:8}}>{n.id}</div><div style={{fontSize:12, color:'#64748b'}}>{n.desc}</div></div>))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh', display:'flex', fontFamily:'Inter, sans-serif'}}>
      <div style={{width:'55%', background:'#0f172a', color:'white', padding:40, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
        <div>
          <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <div style={{width:36, height:36, background:'white', color:'#0f172a', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18}}>F</div>
            <div><div style={{fontWeight:800, fontSize:14}}>FieldOpsPro</div><div style={{fontSize:10, opacity:0.6}}>UNIVERSAL</div></div>
          </div>
          <div style={{marginTop:80}}>
            <h1 style={{fontSize:44, fontWeight:900, lineHeight:1.1}}>Sua operação de<br/>campo,<br/><span style={{color:'#94a3b8'}}>sob controle total.</span></h1>
            <p style={{marginTop:16, color:'#94a3b8', fontSize:14, maxWidth:380}}>Plataforma universal para gestão de equipes, PMOC e manutenção em 7 nichos.</p>
          </div>
        </div>
        <div style={{fontSize:11, color:'#475569'}}>Sistema operacional • 99.9% uptime</div>
      </div>
      <div style={{flex:1, background:'white', display:'flex', alignItems:'center', justifyContent:'center', padding:24}}>
        <div style={{width:'100%', maxWidth:380}}>
          <h2 style={{fontSize:24, fontWeight:800}}>Bem vindo.</h2>
          <p style={{fontSize:13, color:'#64748b', marginTop:6}}>Sistema detecta seu perfil automaticamente.</p>
          {view==='login' && (
            <>
              <div style={{marginTop:24}}><label style={{fontSize:11, fontWeight:700}}>E-MAIL</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" style={{width:'100%', marginTop:6, padding:'12px 14px', border:'1px solid #e2e8f0', borderRadius:10}}/></div>
              <div style={{marginTop:14}}><label style={{fontSize:11, fontWeight:700}}>SENHA</label><input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" style={{width:'100%', marginTop:6, padding:'12px 14px', border:'1px solid #e2e8f0', borderRadius:10}}/></div>
              <button onClick={handleLogin} disabled={loading} style={{width:'100%', marginTop:20, background:'#0f172a', color:'white', padding:12, borderRadius:10, fontWeight:700, border:'none'}}>{loading?'Entrando...':'Entrar no FieldOpsPro'}</button>
              <div style={{textAlign:'center', marginTop:16, fontSize:13, color:'#64748b'}}>Primeiro acesso? <span onClick={()=>setView('cadastro')} style={{color:'#0f172a', fontWeight:700, cursor:'pointer', textDecoration:'underline'}}>Crie sua conta.</span></div>
              <div style={{marginTop:20, padding:12, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, fontSize:11, color:'#166534'}}>🔒 Verificação por email - código de 6 dígitos para sua segurança.</div>
            </>
          )}
          {view==='cadastro' && (
            <>
              <div style={{marginTop:24}}><label style={{fontSize:11, fontWeight:700}}>NOME COMPLETO</label><input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Seu nome" style={{width:'100%', marginTop:6, padding:'12px 14px', border:'1px solid #e2e8f0', borderRadius:10}}/></div>
              <div style={{marginTop:12}}><label style={{fontSize:11, fontWeight:700}}>EMPRESA</label><input value={empresa} onChange={e=>setEmpresa(e.target.value)} placeholder="Sua empresa" style={{width:'100%', marginTop:6, padding:'12px 14px', border:'1px solid #e2e8f0', borderRadius:10}}/></div>
              <div style={{marginTop:12}}><label style={{fontSize:11, fontWeight:700}}>E-MAIL</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" style={{width:'100%', marginTop:6, padding:'12px 14px', border:'1px solid #e2e8f0', borderRadius:10}}/></div>
              <div style={{marginTop:12}}><label style={{fontSize:11, fontWeight:700}}>CRIE SUA SENHA</label><input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" style={{width:'100%', marginTop:6, padding:'12px 14px', border:'1px solid #e2e8f0', borderRadius:10}}/></div>
              <button onClick={handleCadastro} disabled={loading} style={{width:'100%', marginTop:20, background:'#0f172a', color:'white', padding:12, borderRadius:10, fontWeight:700, border:'none'}}>{loading?'Enviando código...':'Enviar código de verificação'}</button>
              <div onClick={()=>setView('login')} style={{textAlign:'center', marginTop:12, fontSize:12, cursor:'pointer', textDecoration:'underline'}}>← Voltar ao login</div>
            </>
          )}
          {view==='verificar' && (
            <>
              <div style={{marginTop:24, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, padding:16}}>
                <div style={{fontSize:13, fontWeight:700}}>Verifique seu email</div>
                <div style={{fontSize:12, color:'#64748b', marginTop:4}}>Enviamos código de 6 dígitos para <b>{email}</b></div>
                {devCodigo && (<div style={{marginTop:12, background:'#fef3c7', padding:10, borderRadius:8, fontSize:12}}>🧪 TESTE: Código <b style={{fontSize:18}}>{devCodigo}</b></div>)}
              </div>
              <div style={{marginTop:16}}><label style={{fontSize:11, fontWeight:700}}>CÓDIGO 6 DÍGITOS</label><input value={codigo} onChange={e=>setCodigo(e.target.value)} placeholder="123456" maxLength={6} style={{width:'100%', marginTop:6, padding:'14px', border:'1px solid #e2e8f0', borderRadius:10, fontSize:22, letterSpacing:6, textAlign:'center', fontWeight:800}}/></div>
              <button onClick={handleVerificar} disabled={loading} style={{width:'100%', marginTop:16, background:'#0f172a', color:'white', padding:12, borderRadius:10, fontWeight:700, border:'none'}}>{loading?'Verificando...':'Verificar e criar conta'}</button>
              <div onClick={()=>handleCadastro()} style={{textAlign:'center', marginTop:12, fontSize:12, cursor:'pointer', textDecoration:'underline'}}>Reenviar código</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
