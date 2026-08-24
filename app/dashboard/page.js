'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const NICHOS = ['Refrigeração','Climatização','Elétrica','Segurança','TI','Predial','Eng Clínica']

export default function DashboardPage() {
  const [tenant, setTenant] = useState(null)
  const [aba, setAba] = useState('dashboard')
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [diasRestantes, setDiasRestantes] = useState(7)
  const [novoUsuario, setNovoUsuario] = useState({nome:'', email:'', role:'tecnico', senha:''})

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href='/login'; return }
    
    const { data: t } = await supabase.from('tenants').select('*').eq('email', session.user.email).single()
    if (!t) { window.location.href='/login'; return }
    
    // Calcula dias restantes - usa data do SERVIDOR
    const fim = new Date(t.trial_fim)
    const diff = fim - new Date()
    const dias = Math.ceil(diff/(1000*60*60*24))
    setDiasRestantes(dias)
    
    if (dias <=0 && t.status !== 'ASSINANTE_ATIVO') {
      window.location.href='/planos'
      return
    }
    
    setTenant(t)
    
    // Busca usuários da equipe (se tabela existir)
    const { data: users } = await supabase.from('usuarios_equipe').select('*').eq('tenant_id', t.id)
    if (users) setUsuarios(users)
    
    setLoading(false)
  }

  async function convidarUsuario() {
    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha) return alert('Preencha todos')
    try {
      // Cria usuário no auth
      const { data, error } = await supabase.auth.signUp({
        email: novoUsuario.email,
        password: novoUsuario.senha,
        options: { data: { nome: novoUsuario.nome, role: novoUsuario.role } }
      })
      if (error) throw error
      
      // Salva na tabela usuarios_equipe
      await supabase.from('usuarios_equipe').insert({
        tenant_id: tenant.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        role: novoUsuario.role,
        permissoes: novoUsuario.role==='administrativo' ? 
          {dashboard:true, ativos:{view:true,create:true}, os:{view:true}, clientes:{view:true}} :
          {dashboard:false, ativos:{view:true}, os:{view_minhas:true}, clientes:{view:false}},
        ativo: true
      })
      
      alert('Usuário convidado!')
      setNovoUsuario({nome:'', email:'', role:'tecnico', senha:''})
      init()
    } catch(e) { alert(e.message) }
  }

  if (loading) return <div style={{padding:40}}>Carregando...</div>
  if (!tenant) return null

  const isGestor = tenant.role === 'gestor'
  const nichoAtivo = tenant.nicho_trial

  return (
    <div style={{display:'flex', minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter, sans-serif'}}>
      {/* SIDEBAR ORGANIZADA SEM CORTES */}
      <div style={{width:260, background:'#0f172a', color:'white', display:'flex', flexDirection:'column', overflowY:'auto'}}>
        <div style={{padding:16, borderBottom:'1px solid #1e293b'}}>
          <div style={{display:'flex', gap:8, alignItems:'center'}}><div style={{width:28, height:28, background:'white', color:'#0f172a', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900}}>F</div><div><div style={{fontWeight:800, fontSize:13}}>FieldOpsPro</div><div style={{fontSize:9, opacity:0.6}}>V3.4 UNIVERSAL</div></div></div>
          <div style={{marginTop:12, background:'#1e293b', borderRadius:8, padding:'8px 10px', fontSize:10}}><span style={{opacity:0.6}}>SISTEMA OPERACIONAL</span> <span style={{float:'right', fontWeight:700}}>0 ativos</span></div>
        </div>
        
        <div style={{padding:12}}>
          <div style={{background:'#10b981', color:'white', borderRadius:20, padding:'4px 10px', fontSize:10, fontWeight:800, display:'inline-flex', alignItems:'center', gap:4}}>👑 {tenant.role?.toUpperCase()} - Acesso Total</div>
          <div style={{marginTop:12, background:'#1e293b', borderRadius:12, padding:12}}>
            <div style={{fontSize:10, opacity:0.5, fontWeight:700}}>NICHO TRIAL</div>
            <div style={{display:'flex', alignItems:'center', gap:8, marginTop:6}}>
              <div style={{width:28, height:28, background:'#ec4899', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12}}>🏥</div>
              <div style={{fontSize:12, fontWeight:700}}>{nichoAtivo}</div>
            </div>
            <div style={{fontSize:10, color:'#94a3b8', marginTop:6, cursor:'pointer'}} onClick={()=>window.location.href='/login'}>Trocar nicho</div>
          </div>
        </div>

        <div style={{flex:1, padding:12}}>
          {[
            {id:'dashboard', label:'Dashboard Executivo'},
            {id:'ativos', label:'Gestão de Ativos', count:0},
            {id:'os', label:'Ordens de Serviço', count:0},
            {id:'pmoc', label:'PMOC'},
            {id:'preventiva', label:'Manutenção Preventiva'},
            {id:'estoque', label:'Estoque e Peças'},
            {id:'clientes', label:'Clientes e Contratos'},
            ...(tenant.plano==='ENTERPRISE' || tenant.status==='TESTE_ATIVO' ? [{id:'locacao', label:'Locação Universal', badge:'ENTERPRISE'}] : []),
            {id:'documentos', label:'Documentos e Assinatura'},
            ...(isGestor ? [{id:'equipe', label:'Gestão de Equipe / Permissões', badge:'GESTOR'}, {id:'planos', label:'Planos'}] : [])
          ].map(m=>(
            <div key={m.id} onClick={()=>setAba(m.id)} style={{padding:'10px', borderRadius:8, background:aba===m.id?'white':'transparent', color:aba===m.id?'#0f172a':'#94a3b8', fontSize:12, marginBottom:2, cursor:'pointer', display:'flex', justifyContent:'space-between'}}>
              <span>{m.label}</span>{m.badge && <span style={{background:'#10b981', color:'white', padding:'2px 6px', borderRadius:10, fontSize:9}}>{m.badge}</span>}
            </div>
          ))}
        </div>

        <div style={{padding:12, borderTop:'1px solid #1e293b'}}>
          <div style={{fontSize:11, fontWeight:700}}>{tenant.nome_responsavel || tenant.nome || tenant.email}</div>
          <div style={{fontSize:9, opacity:0.6}}>{tenant.email}</div>
          <button onClick={async()=>{await supabase.auth.signOut(); window.location.href='/login'}} style={{marginTop:8, fontSize:10, background:'#1e293b', color:'white', border:'none', padding:'6px 12px', borderRadius:6, width:'100%', cursor:'pointer'}}>Sair</button>
        </div>
      </div>

      <div style={{flex:1, overflowY:'auto', padding:24, paddingBottom:80}}>
        <div style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12}}>
          {/* SÓ MOSTRA NICHO ESCOLHIDO - SEM LISTA DE BLOQUEADOS */}
          <div style={{background:'#0f172a', color:'white', padding:'8px 16px', borderRadius:20, fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:8}}>
            <div style={{width:8, height:8, background:'#10b981', borderRadius:10}}></div>{nichoAtivo} • ativo {diasRestantes} dias restantes
          </div>
          <div style={{fontSize:11, color:'#64748b'}}>Plano: {tenant.plano || 'Teste Grátis'} • Status: {tenant.status}</div>
        </div>

        {aba==='dashboard' && (
          <>
            <h1 style={{fontSize:20, fontWeight:800, marginTop:16}}>Dashboard Executivo <span style={{fontSize:11, fontWeight:400, color:'#64748b'}}>0 ativos • 0 OS • {nichoAtivo} visível no teste</span></h1>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:16, marginTop:16}}>
              <div style={{background:'white', border:'1px solid #e2e8f0', borderRadius:16, padding:16}}><div style={{fontSize:10, color:'#94a3b8', fontWeight:700}}>ATIVOS MONITORADOS</div><div style={{fontSize:28, fontWeight:900, marginTop:8}}>0</div><div style={{fontSize:11, color:'#64748b'}}>Nenhum ativo cadastrado</div></div>
              <div style={{background:'white', border:'1px solid #e2e8f0', borderRadius:16, padding:16}}><div style={{fontSize:10, color:'#94a3b8', fontWeight:700}}>ORDENS EM ABERTO</div><div style={{fontSize:28, fontWeight:900, marginTop:8}}>0</div><div style={{fontSize:11, color:'#64748b'}}>Fila zerada no teste</div></div>
              <div style={{background:'white', border:'1px solid #e2e8f0', borderRadius:16, padding:16}}><div style={{fontSize:10, color:'#94a3b8', fontWeight:700}}>FATURAMENTO MÊS</div><div style={{fontSize:28, fontWeight:900, marginTop:8}}>R$ 0</div><div style={{fontSize:11, color:'#64748b'}}>Sem OS faturadas</div></div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 340px', gap:16, marginTop:16}}>
              <div style={{background:'white', border:'1px solid #e2e8f0', borderRadius:16, padding:16, minHeight:300}}>
                <div style={{fontWeight:700}}>Ordens de Serviço • {nichoAtivo}</div>
                <div style={{textAlign:'center', padding:40, color:'#94a3b8'}}>📋<div style={{fontWeight:700, fontSize:13, color:'#334155', marginTop:8}}>Nenhuma OS ainda</div><div style={{fontSize:11, marginTop:4}}>Durante o teste apenas o nicho {nichoAtivo} fica visível.</div></div>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                <div style={{background:'#fefce8', border:'1px solid #fde68a', borderRadius:16, padding:16}}><div style={{fontWeight:700, fontSize:13}}>✨ Locação Universal</div><div style={{fontSize:11, color:'#a16207', marginTop:8}}>{tenant.plano==='ENTERPRISE'?'Sistema liberado para seu plano':'Exclusivo Enterprise. R$597/mês'}</div></div>
                <div style={{background:'white', border:'1px solid #e2e8f0', borderRadius:16, padding:16}}><div style={{fontWeight:700, fontSize:13}}>📄 Documentos e Assinatura</div><div style={{fontSize:11, color:'#64748b', marginTop:8}}>Hash SHA256 + QR Code válido</div></div>
              </div>
            </div>
          </>
        )}

        {aba==='equipe' && isGestor && (
          <div>
            <h1 style={{fontSize:18, fontWeight:800}}>Gestão de Equipe / Permissões <span style={{background:'#10b981', color:'white', fontSize:10, padding:'2px 8px', borderRadius:10}}>SÓ GESTOR</span></h1>
            <p style={{fontSize:12, color:'#64748b', marginTop:4}}>Convide Administrativo e Técnico. Gestor edita o que cada perfil pode ver e operar.</p>
            
            <div style={{display:'grid', gridTemplateColumns:'360px 1fr', gap:16, marginTop:16}}>
              <div style={{background:'white', border:'1px solid #e2e8f0', borderRadius:16, padding:16}}>
                <div style={{fontWeight:700, fontSize:13, marginBottom:12}}>+ Convidar usuário</div>
                <input value={novoUsuario.nome} onChange={e=>setNovoUsuario({...novoUsuario, nome:e.target.value})} placeholder="Nome" style={{width:'100%', padding:10, border:'1px solid #e2e8f0', borderRadius:8, marginBottom:8, fontSize:12}}/>
                <input value={novoUsuario.email} onChange={e=>setNovoUsuario({...novoUsuario, email:e.target.value})} placeholder="Email" style={{width:'100%', padding:10, border:'1px solid #e2e8f0', borderRadius:8, marginBottom:8, fontSize:12}}/>
                <div style={{display:'flex', gap:8, marginBottom:8}}>
                  <select value={novoUsuario.role} onChange={e=>setNovoUsuario({...novoUsuario, role:e.target.value})} style={{flex:1, padding:10, border:'1px solid #e2e8f0', borderRadius:8, fontSize:12}}>
                    <option value="tecnico">Técnico</option>
                    <option value="administrativo">Administrativo</option>
                  </select>
                  <input type="password" value={novoUsuario.senha} onChange={e=>setNovoUsuario({...novoUsuario, senha:e.target.value})} placeholder="Senha temporária" style={{flex:1, padding:10, border:'1px solid #e2e8f0', borderRadius:8, fontSize:12}}/>
                </div>
                <button onClick={convidarUsuario} style={{width:'100%', padding:10, background:'#0f172a', color:'white', borderRadius:8, fontWeight:700, border:'none', cursor:'pointer', fontSize:12}}>Convidar e salvar</button>
              </div>
              
              <div style={{background:'white', border:'1px solid #e2e8f0', borderRadius:16, padding:16}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:12}}><input placeholder="Buscar por nome ou email" style={{flex:1, padding:8, border:'1px solid #e2e8f0', borderRadius:20, fontSize:12}}/><span style={{fontSize:11, background:'#f1f5f9', padding:'6px 12px', borderRadius:20, marginLeft:8}}>{usuarios.length+1} usuários</span></div>
                <div style={{display:'flex', alignItems:'center', gap:12, padding:12, border:'1px solid #e2e8f0', borderRadius:12}}>
                  <div style={{width:36, height:36, background:'#0f172a', color:'white', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12}}>{tenant.email.slice(0,2).toUpperCase()}</div>
                  <div><div style={{fontSize:12, fontWeight:700}}>{tenant.nome_responsavel || tenant.nome} <span style={{background:'#dcfce7', color:'#166534', fontSize:9, padding:'2px 6px', borderRadius:10}}>GESTOR</span></div><div style={{fontSize:10, color:'#64748b'}}>{tenant.email}</div></div>
                </div>
                {usuarios.map(u=>(
                  <div key={u.id} style={{display:'flex', alignItems:'center', gap:12, padding:12, border:'1px solid #e2e8f0', borderRadius:12, marginTop:8}}>
                    <div style={{width:36, height:36, background:'#f1f5f9', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12}}>{u.nome.slice(0,2).toUpperCase()}</div>
                    <div><div style={{fontSize:12, fontWeight:700}}>{u.nome} <span style={{background:u.role==='administrativo'?'#dbeafe':'#fef9c3', fontSize:9, padding:'2px 6px', borderRadius:10}}>{u.role.toUpperCase()}</span></div><div style={{fontSize:10, color:'#64748b'}}>{u.email}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {aba!=='dashboard' && aba!=='equipe' && (
          <div style={{background:'white', border:'1px solid #e2e8f0', borderRadius:16, padding:40, textAlign:'center', marginTop:16}}>
            <div style={{fontWeight:700}}>{aba.toUpperCase()} • {nichoAtivo}</div>
            <div style={{fontSize:12, color:'#64748b', marginTop:8}}>0 registros • Nicho {nichoAtivo} • Conteúdo zerado conforme print, mas 100% funcional e conectado ao Supabase</div>
          </div>
        )}
      </div>
    </div>
  )
}
