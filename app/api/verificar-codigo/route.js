import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { email, codigo, nome, empresa, senha } = await req.json();
    const emailLimpo = email.toLowerCase().trim();
    const codigoLimpo = codigo.toString().replace(/\s/g, '').trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '').replace(/\/rest\/v1\/?$/, '');
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // Verifica código
    const { data, error } = await supabase.from('email_verificacoes').select('*')
      .eq('email', emailLimpo).eq('codigo', codigoLimpo).eq('verificado', false)
      .gt('expira_em', new Date().toISOString())
      .order('created_at', { ascending: false }).limit(1).single();

    if (error || !data) return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 });
    await supabase.from('email_verificacoes').update({ verificado: true }).eq('id', data.id);

    // CRIA USUÁRIO NO SUPABASE AUTH COM A SENHA QUE ELE DIGITOU
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: emailLimpo,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, empresa }
    });

    // Se já existe, atualiza a senha
    if (createError && createError.message.includes('already exists')) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list.users.find(u => u.email === emailLimpo);
      if (existing) {
        await supabase.auth.admin.updateUserById(existing.id, { password: senha, email_confirm: true });
      }
    } else if (createError) {
      throw createError;
    }

    // Cria tenant se não existe
    const { data: tenant } = await supabase.from('tenants').select('id').eq('email', emailLimpo).single();
    if (!tenant) {
      await supabase.from('tenants').insert({ email: emailLimpo, nome, empresa, created_at: new Date().toISOString() });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
