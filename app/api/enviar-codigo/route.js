
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function gerarCodigo(){ return Math.floor(100000 + Math.random()*900000).toString() }

export async function POST(req){
  try{
    const { email, nome, empresa } = await req.json()
    if(!email) return Response.json({error:'Email obrigatório'}, {status:400})
    const codigo = gerarCodigo()
    await supabase.from('email_verificacoes').insert({
      email: email.toLowerCase().trim(),
      codigo,
      nome, empresa,
      expira_em: new Date(Date.now()+15*60*1000).toISOString()
    })
    if(process.env.RESEND_API_KEY){
      try{
        await fetch('https://api.resend.com/emails',{
          method:'POST',
          headers:{'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'FieldOpsPro <noreply@fieldopspro.app.br>',
            to: email,
            subject: `Seu código FieldOpsPro: ${codigo}`,
            html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;color:white;border-radius:16px"><h1 style="font-size:24px;font-weight:800">FieldOpsPro</h1><p>Olá ${nome||''},</p><p>Seu código de verificação:</p><div style="background:white;color:#0f172a;font-size:32px;font-weight:900;letter-spacing:6px;padding:16px;text-align:center;border-radius:12px;margin:20px 0">${codigo}</div><p style="font-size:12px;color:#94a3b8">Expira em 15 minutos. Se não solicitou, ignore.</p></div>`
          })
        })
      }catch(e){ console.log(e) }
    }
    const isDev = !process.env.RESEND_API_KEY
    return Response.json({ok:true, message:'Código enviado', dev_codigo: isDev?codigo:undefined})
  }catch(e){ return Response.json({error:e.message},{status:500}) }
}
