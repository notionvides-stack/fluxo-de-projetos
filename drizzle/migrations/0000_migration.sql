
create type public.app_role as enum ('admin','colaborador');
create type public.task_status as enum ('nao_iniciado','em_andamento','aguardando','bloqueado','concluido');
create type public.task_priority as enum ('baixa','media','alta','urgente');
create type public.final_status as enum ('pendente','aprovado','reprovado','ajustes');

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  avatar_url text,
  job_title text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "profiles team read" on public.profiles for select to authenticated using (true);
create policy "profiles own update" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profiles own insert" on public.profiles for insert to authenticated with check (id = auth.uid());

create policy "roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "roles admin insert" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "roles admin update" on public.user_roles for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "roles admin delete" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(),'admin') and user_id <> auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare is_first boolean;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email);
  select not exists (select 1 from public.user_roles where role = 'admin') into is_first;
  insert into public.user_roles (user_id, role) values (new.id, case when is_first then 'admin'::app_role else 'colaborador'::app_role end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- weekly periods
create table public.weekly_periods (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  week_end date not null,
  status text not null default 'aberta' check (status in ('aberta','fechada')),
  closed_at timestamptz,
  closed_by uuid,
  created_at timestamptz not null default now(),
  check (extract(isodow from week_start) = 1),
  check (week_end = week_start + 4)
);
grant select, insert, update on public.weekly_periods to authenticated;
grant all on public.weekly_periods to service_role;
alter table public.weekly_periods enable row level security;
create policy "periods read" on public.weekly_periods for select to authenticated using (true);
create policy "periods admin insert" on public.weekly_periods for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "periods admin update" on public.weekly_periods for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text,
  assignee_id uuid references public.profiles(id) on delete set null,
  priority task_priority not null default 'media',
  status task_status not null default 'nao_iniciado',
  progress int not null default 0 check (progress between 0 and 100),
  start_date date,
  due_date date,
  week_start date not null,
  notes text,
  is_demo boolean not null default false,
  demo_assignee_name text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_date is null or start_date is null or due_date >= start_date),
  check (extract(isodow from week_start) = 1)
);
create index tasks_week_idx on public.tasks(week_start);
create index tasks_assignee_idx on public.tasks(assignee_id);
create index tasks_status_idx on public.tasks(status);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;
create policy "tasks read" on public.tasks for select to authenticated using (public.has_role(auth.uid(),'admin') or assignee_id = auth.uid());
create policy "tasks admin insert" on public.tasks for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "tasks update" on public.tasks for update to authenticated using (public.has_role(auth.uid(),'admin') or assignee_id = auth.uid());
create policy "tasks admin delete" on public.tasks for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index task_comments_task_idx on public.task_comments(task_id);
grant select, insert, delete on public.task_comments to authenticated;
grant all on public.task_comments to service_role;
alter table public.task_comments enable row level security;
create policy "comments read" on public.task_comments for select to authenticated using (exists (select 1 from public.tasks t where t.id = task_id and (t.assignee_id = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "comments insert" on public.task_comments for insert to authenticated with check (author_id = auth.uid() and exists (select 1 from public.tasks t where t.id = task_id and (t.assignee_id = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "comments delete" on public.task_comments for delete to authenticated using (author_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- audit log
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  entity_label text,
  action text not null,
  field text,
  old_value text,
  new_value text,
  actor_id uuid,
  created_at timestamptz not null default now()
);
create index audit_entity_idx on public.audit_log(entity_type, entity_id);
create index audit_created_idx on public.audit_log(created_at desc);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "audit read" on public.audit_log for select to authenticated using (
  public.has_role(auth.uid(),'admin') or actor_id = auth.uid()
  or (entity_type = 'task' and exists (select 1 from public.tasks t where t.id = entity_id and t.assignee_id = auth.uid())));

create or replace function public.tasks_guard_and_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); adm boolean := public.has_role(auth.uid(),'admin');
begin
  if tg_op = 'UPDATE' then
    if not adm and uid is not null then
      if new.title is distinct from old.title or new.description is distinct from old.description
        or new.assignee_id is distinct from old.assignee_id or new.priority is distinct from old.priority
        or new.start_date is distinct from old.start_date or new.due_date is distinct from old.due_date
        or new.week_start is distinct from old.week_start or new.is_demo is distinct from old.is_demo
        or new.created_by is distinct from old.created_by then
        raise exception 'Colaboradores só podem alterar progresso, status e observações.';
      end if;
    end if;
    new.updated_at := now();
    if new.status = 'concluido' and old.status <> 'concluido' and new.progress < 100 then new.progress := 100; end if;
    if new.title is distinct from old.title then insert into audit_log(entity_type,entity_id,entity_label,action,field,old_value,new_value,actor_id) values ('task',new.id,new.title,'update','título',old.title,new.title,uid); end if;
    if new.status is distinct from old.status then insert into audit_log(entity_type,entity_id,entity_label,action,field,old_value,new_value,actor_id) values ('task',new.id,new.title,'update','status',old.status::text,new.status::text,uid); end if;
    if new.progress is distinct from old.progress then insert into audit_log(entity_type,entity_id,entity_label,action,field,old_value,new_value,actor_id) values ('task',new.id,new.title,'update','progresso',old.progress::text,new.progress::text,uid); end if;
    if new.priority is distinct from old.priority then insert into audit_log(entity_type,entity_id,entity_label,action,field,old_value,new_value,actor_id) values ('task',new.id,new.title,'update','prioridade',old.priority::text,new.priority::text,uid); end if;
    if new.assignee_id is distinct from old.assignee_id then insert into audit_log(entity_type,entity_id,entity_label,action,field,old_value,new_value,actor_id) values ('task',new.id,new.title,'update','responsável',(select full_name from profiles where id=old.assignee_id),(select full_name from profiles where id=new.assignee_id),uid); end if;
    if new.start_date is distinct from old.start_date then insert into audit_log(entity_type,entity_id,entity_label,action,field,old_value,new_value,actor_id) values ('task',new.id,new.title,'update','início',old.start_date::text,new.start_date::text,uid); end if;
    if new.due_date is distinct from old.due_date then insert into audit_log(entity_type,entity_id,entity_label,action,field,old_value,new_value,actor_id) values ('task',new.id,new.title,'update','prazo',old.due_date::text,new.due_date::text,uid); end if;
    if new.notes is distinct from old.notes then insert into audit_log(entity_type,entity_id,entity_label,action,field,old_value,new_value,actor_id) values ('task',new.id,new.title,'update','observações',old.notes,new.notes,uid); end if;
    return new;
  elsif tg_op = 'INSERT' then
    insert into audit_log(entity_type,entity_id,entity_label,action,actor_id) values ('task',new.id,new.title,'create',uid);
    return new;
  else
    insert into audit_log(entity_type,entity_id,entity_label,action,actor_id) values ('task',old.id,old.title,'delete',uid);
    return old;
  end if;
end $$;
create trigger tasks_before_update before update on public.tasks for each row execute function public.tasks_guard_and_audit();
create trigger tasks_after_insert after insert on public.tasks for each row execute function public.tasks_guard_and_audit();
create trigger tasks_after_delete after delete on public.tasks for each row execute function public.tasks_guard_and_audit();

-- snapshots (immutable)
create table public.weekly_snapshots (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.weekly_periods(id) on delete restrict,
  week_start date not null,
  version int not null default 1,
  metrics jsonb not null,
  per_person jsonb not null,
  tasks jsonb not null,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index snapshots_week_idx on public.weekly_snapshots(week_start);
grant select on public.weekly_snapshots to authenticated;
grant all on public.weekly_snapshots to service_role;
alter table public.weekly_snapshots enable row level security;
create policy "snapshots admin read" on public.weekly_snapshots for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.close_week(_week_start date)
returns uuid language plpgsql security definer set search_path = public as $$
declare pid uuid; v int; sid uuid; t jsonb; m jsonb; pp jsonb;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Apenas administradores podem fechar semanas.'; end if;
  if extract(isodow from _week_start) <> 1 then raise exception 'A semana deve iniciar numa segunda-feira.'; end if;
  insert into weekly_periods(week_start, week_end) values (_week_start, _week_start + 4) on conflict (week_start) do nothing;
  select id into pid from weekly_periods where week_start = _week_start;
  if (select status from weekly_periods where id = pid) = 'fechada' then raise exception 'Semana já está fechada.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'status',x.status,'priority',x.priority,'progress',x.progress,'start_date',x.start_date,'due_date',x.due_date,'notes',x.notes,'is_demo',x.is_demo,
     'assignee_id',x.assignee_id,'assignee_name',coalesce(p.full_name,x.demo_assignee_name),'assignee_avatar',p.avatar_url,
     'overdue',(x.due_date is not null and x.due_date < current_date and x.status <> 'concluido')) order by x.due_date nulls last),'[]'::jsonb)
    into t from tasks x left join profiles p on p.id = x.assignee_id where x.week_start = _week_start;
  select jsonb_build_object('total',count(*),'concluidas',count(*) filter (where status='concluido'),'em_andamento',count(*) filter (where status='em_andamento'),
     'bloqueadas',count(*) filter (where status='bloqueado'),'atrasadas',count(*) filter (where due_date < current_date and status<>'concluido'),
     'progresso_medio',coalesce(round(avg(progress)),0)) into m from tasks where week_start = _week_start;
  select coalesce(jsonb_agg(r),'[]'::jsonb) into pp from (
    select coalesce(p.full_name,x.demo_assignee_name,'Sem responsável') as name, p.avatar_url as avatar, count(*) as total,
      count(*) filter (where x.status='concluido') as concluidas, count(*) filter (where x.status='em_andamento') as em_andamento,
      count(*) filter (where x.status='bloqueado') as bloqueadas, count(*) filter (where x.due_date < current_date and x.status<>'concluido') as atrasadas,
      round(avg(x.progress)) as progresso_medio
    from tasks x left join profiles p on p.id = x.assignee_id where x.week_start = _week_start
    group by 1,2 order by 1) r;
  select coalesce(max(version),0)+1 into v from weekly_snapshots where week_start = _week_start;
  insert into weekly_snapshots(period_id,week_start,version,metrics,per_person,tasks,created_by) values (pid,_week_start,v,m,pp,t,auth.uid()) returning id into sid;
  update weekly_periods set status='fechada', closed_at=now(), closed_by=auth.uid() where id = pid;
  insert into audit_log(entity_type,entity_id,entity_label,action,field,old_value,new_value,actor_id) values ('week',pid,_week_start::text,'close','status','aberta','fechada',auth.uid());
  return sid;
end $$;

create or replace function public.reopen_week(_week_start date, _reason text)
returns void language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Apenas administradores podem reabrir semanas.'; end if;
  if coalesce(trim(_reason),'') = '' then raise exception 'Informe o motivo da reabertura.'; end if;
  select id into pid from weekly_periods where week_start = _week_start and status = 'fechada';
  if pid is null then raise exception 'Semana não está fechada.'; end if;
  update weekly_periods set status='aberta', closed_at=null, closed_by=null where id = pid;
  insert into audit_log(entity_type,entity_id,entity_label,action,field,old_value,new_value,actor_id) values ('week',pid,_week_start::text,'reopen','motivo','fechada',_reason,auth.uid());
end $$;
revoke execute on function public.close_week(date) from anon;
revoke execute on function public.reopen_week(date,text) from anon;

-- collection
create table public.collection_products (
  id uuid primary key default gen_random_uuid(),
  brand text not null default '',
  designer text,
  licensor text,
  sent_date date,
  reference text,
  product text not null default '',
  status text,
  supplier text,
  first_sample_date date,
  deadline date,
  official_tag text,
  first_pilot text,
  remark_1 text,
  remark_2 text,
  remark_3 text,
  final_pilot text,
  final_status final_status not null default 'pendente',
  notes text,
  is_demo boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cp_brand_idx on public.collection_products(brand);
create index cp_deadline_idx on public.collection_products(deadline);
grant select, insert, update, delete on public.collection_products to authenticated;
grant all on public.collection_products to service_role;
alter table public.collection_products enable row level security;
create policy "cp read" on public.collection_products for select to authenticated using (true);
create policy "cp insert" on public.collection_products for insert to authenticated with check (created_by = auth.uid());
create policy "cp update" on public.collection_products for update to authenticated using (public.has_role(auth.uid(),'admin') or created_by = auth.uid());
create policy "cp delete" on public.collection_products for delete to authenticated using (public.has_role(auth.uid(),'admin') or created_by = auth.uid());

create or replace function public.cp_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if new.final_status is distinct from old.final_status then
    insert into audit_log(entity_type,entity_id,entity_label,action,field,old_value,new_value,actor_id) values ('product',new.id,new.product,'update','status final',old.final_status::text,new.final_status::text,auth.uid());
  end if;
  if new.deadline is distinct from old.deadline then
    insert into audit_log(entity_type,entity_id,entity_label,action,field,old_value,new_value,actor_id) values ('product',new.id,new.product,'update','deadline',old.deadline::text,new.deadline::text,auth.uid());
  end if;
  return new;
end $$;
create trigger cp_before_update before update on public.collection_products for each row execute function public.cp_audit();

create table public.collection_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.collection_products(id) on delete cascade,
  storage_path text not null,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);
create index cpi_product_idx on public.collection_product_images(product_id);
grant select, insert, delete on public.collection_product_images to authenticated;
grant all on public.collection_product_images to service_role;
alter table public.collection_product_images enable row level security;
create policy "cpi read" on public.collection_product_images for select to authenticated using (true);
create policy "cpi insert" on public.collection_product_images for insert to authenticated with check (uploaded_by = auth.uid() and exists (select 1 from public.collection_products p where p.id = product_id and (p.created_by = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "cpi delete" on public.collection_product_images for delete to authenticated using (uploaded_by = auth.uid() or public.has_role(auth.uid(),'admin'));

-- demo data
insert into public.tasks (title, description, priority, status, progress, start_date, due_date, week_start, notes, is_demo, demo_assignee_name) values
('Revisar ficha técnica da coleção Verão','Conferir medidas e materiais','alta','em_andamento',60, date_trunc('week',current_date)::date, date_trunc('week',current_date)::date + 3, date_trunc('week',current_date)::date,'Exemplo','true','Ana Exemplo'),
('Enviar amostras ao fornecedor','', 'urgente','bloqueado',20, date_trunc('week',current_date)::date, date_trunc('week',current_date)::date + 1, date_trunc('week',current_date)::date,'Aguardando transporte',true,'Bruno Exemplo'),
('Atualizar cronograma de pilotos','', 'media','concluido',100, date_trunc('week',current_date)::date, date_trunc('week',current_date)::date + 2, date_trunc('week',current_date)::date,null,true,'Carla Exemplo'),
('Aprovar etiquetas internas','', 'baixa','nao_iniciado',0, date_trunc('week',current_date)::date + 2, date_trunc('week',current_date)::date + 4, date_trunc('week',current_date)::date,null,true,'Ana Exemplo'),
('Reunião com licenciadora','', 'alta','aguardando',40, date_trunc('week',current_date)::date, date_trunc('week',current_date)::date + 4, date_trunc('week',current_date)::date,null,true,'Diego Exemplo');

insert into public.collection_products (brand, designer, licensor, sent_date, reference, product, status, supplier, first_sample_date, deadline, official_tag, first_pilot, remark_1, final_pilot, final_status, notes, is_demo) values
('Coleção Verão (exemplo)','Ana Exemplo','Licenciadora X',current_date - 10,'REF-001','Camiseta estampada','Em desenvolvimento','Fornecedor A',current_date - 3,current_date + 14,'PO-0001','Recebida','Ajustar cor da estampa',null,'ajustes','Dados de exemplo',true),
('Coleção Verão (exemplo)','Bruno Exemplo','Licenciadora Y',current_date - 20,'REF-002','Mochila infantil','Piloto aprovado','Fornecedor B',current_date - 12,current_date + 5,'PO-0002','Aprovada','OK',  'Aprovada','aprovado','Dados de exemplo',true),
('Coleção Inverno (exemplo)','Carla Exemplo','Licenciadora X',current_date - 5,'REF-003','Moletom','Aguardando amostra','Fornecedor C',null,current_date + 21,null,null,null,null,'pendente','Dados de exemplo',true);
