import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(req) {
  try {
    const { email } = await req.json();
    const emailLimpo = email.toLowerCase().trim();
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '').replace(/\/rest\/v1\/?$/, '');
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(process.env.RESEND_API_KEY?.trim());

    const { error: dbError } = await supabase.from('email_verificacoes').insert({
      email: emailLimpo,
      codigo: codigo,
      tipo: 'cadastro',
      expira_em: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      verificado: false,
    });
    if (dbError) throw dbError;

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: emailLimpo,
      subject: `Seu código FieldOpsPro: ${codigo}`,
      html: `<h1>${codigo}</h1><p>Válido por 15 minutos</p>`
    });

    return NextResponse.json({ ok: true, dev_codigo: codigo });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
