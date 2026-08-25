import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { email, codigo } = await req.json();
  
  const codigoLimpo = codigo.toString().replace(/\s/g, '').trim();
  const emailLimpo = email.toLowerCase().trim();

  const { data, error } = await supabase
    .from('email_verificacoes')
    .select('*')
    .eq('email', emailLimpo)
    .eq('codigo', codigoLimpo)
    .eq('verificado', false)
    .gt('expira_em', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 });
  }

  await supabase
    .from('email_verificacoes')
    .update({ verificado: true })
    .eq('id', data.id);

  return NextResponse.json({ ok: true });
}
