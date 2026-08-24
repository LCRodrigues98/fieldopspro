
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function POST(req){
  try{
    const { email, codigo, nome, empresa, senha } = await req.json()
    if(!email||!codigo||!senha) return Response.json({error:'Email, código e senha obrigatórios'},{status:400})
    if(senha.length<6) return Response.json({error:'Senha mínima 6 caracteres'},{status:400})

    const { data: verif } = await supabase.from('email_verificacoes').select('*').eq('email', email.toLowerCase().trim()).eq('codigo', codigo.trim()).eq('verificado', false).gt('expira_em', new Date().toISOString()).order('created_at',{ascending:false}).limit(1).single()
    if(!verif) return Response.json({error:'Código inválido ou expirado'},{status:400})

    await supabase.from('email_verificacoes').update({verificado:true}).eq('id', verif.id)

    const { data: tenantExist } = await supabase.from('tenants').select('*').eq('email', email.toLowerCase()).single()
    let tenant
    if(!tenantExist){
      const { data, error } = await supabase.from('tenants').insert({
        email: email.toLowerCase().trim(),
        empresa: empresa || verif.empresa || 'Minha Empresa',
        nome: nome || verif.nome || email.split('@')[0],
        nome_responsavel: nome || verif.nome || email.split('@')[0],
        role:'gestor', email_verificado:true, status:'TESTE_ATIVO',
        trial_inicio: new Date().toISOString(),
        trial_fim: new Date(Date.now()+7*24*60*60*1000).toISOString()
      }).select().single()
      if(error) throw error
      tenant=data
    }else{
      const { data } = await supabase.from('tenants').update({email_verificado:true}).eq('id', tenantExist.id).select().single()
      tenant=data
    }

    // cria usuário no auth com senha que ele criou
    try{
      await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: senha,
        email_confirm:true,
        user_metadata:{nome, empresa}
      })
    }catch(e){
      try{
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const u = users.find(x=>x.email===email.toLowerCase())
        if(u) await supabase.auth.admin.updateUserById(u.id, {password: senha})
      }catch{}
    }

    return Response.json({ok:true, tenant, message:'Verificado com sucesso'})
  }catch(e){ return Response.json({error:e.message},{status:500}) }
}
