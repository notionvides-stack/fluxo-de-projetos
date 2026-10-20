
create policy "ci read" on storage.objects for select to authenticated using (bucket_id = 'collection-images');
create policy "ci insert" on storage.objects for insert to authenticated with check (bucket_id = 'collection-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "ci delete" on storage.objects for delete to authenticated using (bucket_id = 'collection-images' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));
create policy "av read" on storage.objects for select to authenticated using (bucket_id = 'avatars');
create policy "av insert" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "av update" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
