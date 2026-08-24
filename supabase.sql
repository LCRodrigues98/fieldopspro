
-- FIELDOPSPRO V4.2 - APENAS CODIGO 6 DIGITOS - USUARIO CRIA SENHA
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  empresa text,
  nome text,
  nome_responsavel text,
  role text default 'gestor',
  nicho_trial text,
  trial_inicio timestamptz default now(),
  trial_fim timestamptz default (now() + interval '7 days'),
  status text default 'TESTE_ATIVO',
  plano text,
  email_verificado boolean default false,
  created_at timestamptz default now()
);

create table if not exists email_verificacoes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  codigo text not null,
  nome text,
  empresa text,
  tipo text default 'cadastro',
  expira_em timestamptz default (now() + interval '15 minutes'),
  verificado boolean default false,
  created_at timestamptz default now()
);

create table if not exists usuarios_equipe (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  nome text, email text, role text default 'tecnico',
  permissoes jsonb default '{}'::jsonb, ativo boolean default true,
  created_at timestamptz default now()
);
create table if not exists clientes (id uuid primary key default gen_random_uuid(), tenant_id uuid references tenants(id) on delete cascade, nome text not null, telefone text, email text, nicho text, created_at timestamptz default now());
create table if not exists ativos (id uuid primary key default gen_random_uuid(), tenant_id uuid references tenants(id) on delete cascade, nome text not null, tipo text, status text default 'ativo', created_at timestamptz default now());
create table if not exists ordens_servico (id uuid primary key default gen_random_uuid(), tenant_id uuid references tenants(id) on delete cascade, titulo text not null, status text default 'aberta', created_at timestamptz default now());

alter table tenants disable row level security;
alter table email_verificacoes disable row level security;
alter table usuarios_equipe disable row level security;
alter table clientes disable row level security;
alter table ativos disable row level security;
alter table ordens_servico disable row level security;

create index if not exists idx_verif_email on email_verificacoes(email);
create index if not exists idx_tenants_email on tenants(email);
