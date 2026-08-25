import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { email, codigo, nome, empresa, senha } = await req.json();
    const emailLimpo = email.toLowerCase().trim();
    const codigoLimpo = codigo.toString().replace(/\s/g, '').trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '').replace(/\/rest\/v1\/?$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    // Cliente com SERVICE ROLE - só pra verificar código e criar tenant
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    // Cliente com ANON KEY - pra criar usuário (burla o User not allowed)
    const supabaseAnon = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // 1. Verifica código
    const { data, error } = await supabaseAdmin.from('email_verificacoes').select('*')
      .eq('email', emailLimpo).eq('codigo', codigoLimpo).eq('verificado', false)
      .gt('expira_em', new Date().toISOString())
      .order('created_at', { ascending: false }).limit(1).single();

    if (error || !data) return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 });
    await supabaseAdmin.from('email_verificacoes').update({ verificado: true }).eq('id', data.id);

    // 2. Cria usuário no auth já confirmado. Se já existir, atualiza a senha
    //    (o signUp anônimo ignora a senha nova quando o email já existe, o que
    //    causa "Invalid login credentials" no login).
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: emailLimpo,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, empresa }
    });
    if (createError && (createError.message.includes('already') || createError.message.includes('exists'))) {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = (listData?.users || []).find(u => u.email?.toLowerCase() === emailLimpo);
      if (existingUser) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: senha, email_confirm: true, user_metadata: { nome, empresa }
        });
      }
    } else if (createError) {
      console.log('createUser aviso:', createError.message);
    }

    // 3. Cria/atualiza tenant
    const { data: existingTenant } = await supabaseAdmin.from('tenants').select('id').eq('email', emailLimpo).single();
    if (!existingTenant) {
      await supabaseAdmin.from('tenants').insert({ email: emailLimpo, nome, empresa });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
