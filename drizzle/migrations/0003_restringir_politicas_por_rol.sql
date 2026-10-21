drop policy if exists "equipo lee perfiles" on public.profiles;
create policy "equipo lee perfiles" on public.profiles for select to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "equipo" on public.decimos;
create policy "equipo" on public.decimos for all to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'comercial'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'comercial'));

drop policy if exists "equipo" on public.locales;
create policy "equipo" on public.locales for all to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'comercial'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'comercial'));

drop policy if exists "equipo" on public.albaranes;
create policy "equipo" on public.albaranes for all to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'comercial'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'comercial'));