-- Add an optional photo to home dishes and restaurant/wishlist entries.
alter table public.dishes add column if not exists image_url text;
alter table public.wishes add column if not exists image_url text;

-- Photos are shown to everyone who can open the app; writes remain limited to
-- authenticated members of the household named at the start of the path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'food-photos', 'food-photos', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Household members can upload food photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'food-photos'
  and (storage.foldername(name))[1] = (
    select household_id::text from public.profiles where id = auth.uid()
  )
  and (storage.foldername(name))[2] = auth.uid()::text
);
