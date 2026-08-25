import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // TEM que ser SERVICE_ROLE
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const { email } = await req.json();
  const emailLimpo = email.toLowerCase().trim();
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();

  // 1. Salva no banco com as colunas CERTAS
  const { error: dbError } = await supabase
    .from('email_verificacoes')
    .insert({
      email: emailLimpo,
      codigo: codigo,
      tipo: 'cadastro',
      expira_em: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
      verificado: false,
    });

  if (dbError) {
    console.error('Erro Supabase:', dbError);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // 2. Envia email
  await resend.emails.send({
    from: process.env.EMAIL_FROM, // noreply@fieldopspro.app.br
    to: emailLimpo,
    subject: `Seu código FieldOpsPro: ${codigo}`,
    html: `<h1>${codigo}</h1><p>Valido por 15 minutos</p>`
  });

  return NextResponse.json({ ok: true });
}
