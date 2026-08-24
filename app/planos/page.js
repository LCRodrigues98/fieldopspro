'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function PlanosPage() {
  const [tenant, setTenant] = useState(null)
  
  useEffect(() => {
    (async()=>{
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase.from('tenants').select('*').eq('email', session.user.email).single()
        setTenant(data)
      }
    })()
  }, [])

  // SUBSTITUA PELOS SEUS LINKS REAIS DO MERCADO PAGO
  const LINKS_MP = {
    basico: process.env.NEXT_PUBLIC_MP_BASICO_LINK || 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=SEU_PLANO_BASICO_97',
    pro: process.env.NEXT_PUBLIC_MP_PRO_LINK || 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=SEU_PLANO_PRO_197',
    enterprise: process.env.NEXT_PUBLIC_MP_ENTERPRISE_LINK || 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=SEU_PLANO_ENTERPRISE_597'
  }

  return (
    <div style={{minHeight:'100vh', background:'#0f172a', fontFamily:'Inter, sans-serif', padding:24, color:'white'}}>
      <div style={{maxWidth:1000, margin:'0 auto'}}>
        <h1 style={{fontSize:28, fontWeight:900, textAlign:'center'}}>Seu teste de 7 dias acabou</h1>
        <p style={{textAlign:'center', color:'#94a3b8', fontSize:12, marginTop:8}}>Escolha seu plano para continuar - valores oficiais já linkados com Mercado Pago</p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:16, marginTop:24}}>
          <div style={{background:'#1e293b', borderRadius:16, padding:24, border:'1px solid #334155'}}>
            <div style={{fontSize:12, opacity:0.7, textAlign:'center'}}>BÁSICO</div>
            <div style={{fontSize:32, fontWeight:900, textAlign:'center'}}>R$ 97<span style={{fontSize:14, fontWeight:400}}>/mês</span></div>
            <div style={{marginTop:16, fontSize:12, lineHeight:'2'}}>✅ Até 5 técnicos<br/>✅ OS ilimitadas<br/>✅ App do técnico<br/>✅ Suporte WhatsApp</div>
            <button onClick={()=>window.open(LINKS_MP.basico, '_blank')} style={{width:'100%', marginTop:20, padding:12, background:'white', color:'#0f172a', borderRadius:8, fontWeight:700, border:'none', cursor:'pointer'}}>Assinar BÁSICO</button>
          </div>
          <div style={{background:'#1e293b', borderRadius:16, padding:24, border:'2px solid #3b82f6', position:'relative'}}>
            <div style={{position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', background:'#3b82f6', color:'white', fontSize:10, fontWeight:800, padding:'2px 10px', borderRadius:10}}>MAIS VENDIDO</div>
            <div style={{fontSize:12, opacity:0.7, textAlign:'center'}}>PRO</div>
            <div style={{fontSize:32, fontWeight:900, textAlign:'center'}}>R$ 197<span style={{fontSize:14, fontWeight:400}}>/mês</span></div>
            <div style={{marginTop:16, fontSize:12, lineHeight:'2'}}>✅ Até 15 técnicos<br/>✅ Relatórios Financeiros<br/>✅ Assinatura Digital<br/>✅ White Label<br/>✅ Suporte Prioritário</div>
            <button onClick={()=>window.open(LINKS_MP.pro, '_blank')} style={{width:'100%', marginTop:20, padding:12, background:'#3b82f6', color:'white', borderRadius:8, fontWeight:700, border:'none', cursor:'pointer'}}>Assinar PRO</button>
          </div>
          <div style={{background:'#1e293b', borderRadius:16, padding:24, border:'1px solid #334155'}}>
            <div style={{fontSize:12, opacity:0.7, textAlign:'center'}}>ENTERPRISE</div>
            <div style={{fontSize:32, fontWeight:900, textAlign:'center'}}>R$ 597<span style={{fontSize:14, fontWeight:400}}>/mês</span></div>
            <div style={{marginTop:16, fontSize:12, lineHeight:'2'}}>✅ Técnicos ILIMITADOS<br/>✅ SISTEMA DE LOCAÇÃO<br/>✅ API + Filiais<br/>✅ Gestor de Conta<br/>✅ Tudo do PRO</div>
            <button onClick={()=>window.open(LINKS_MP.enterprise, '_blank')} style={{width:'100%', marginTop:20, padding:12, background:'white', color:'#0f172a', borderRadius:8, fontWeight:700, border:'none', cursor:'pointer'}}>Assinar ENTERPRISE</button>
          </div>
        </div>
      </div>
    </div>
  )
}
