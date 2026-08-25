import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(req) {
  try {
    const { email } = await req.json();
    
    // LIMPA as variáveis (remove barra e espaço)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '').replace(/\/rest\/v1\/?$/, '');
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const resendKey = process.env.RESEND_API_KEY?.trim();
    const emailFrom = process.env.EMAIL_FROM?.trim();

    console.log('URL usada:', supabaseUrl); // vai aparecer no Log da Vercel

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Falta SUPABASE_URL ou SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendKey);

    const emailLimpo = email.toLowerCase().trim();
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    const { error: dbError } = await supabase
      .from('email_verificacoes')
      .insert({
        email: emailLimpo,
        codigo: codigo,
        tipo: 'cadastro',
        expira_em: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        verificado: false,
      });

    if (dbError) {
      console.error('Erro Supabase detalhado:', dbError);
      return NextResponse.json({ error: dbError.message, details: dbError }, { status: 500 });
    }

    await resend.emails.send({
      from: emailFrom,
      to: emailLimpo,
      subject: `Seu código FieldOpsPro: ${codigo}`,
      html: `<h1>${codigo}</h1><p>Valido por 15 minutos</p>`
    });

    return NextResponse.json({ ok: true, codigo_debug: codigo }); // debug temporário

  } catch (err) {
    console.error('Erro geral:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
