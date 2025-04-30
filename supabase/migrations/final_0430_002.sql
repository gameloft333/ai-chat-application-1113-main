-- Function to insert a new user into public.users when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, avatar_url, metadata)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'avatar_url', -- Extract avatar_url from metadata if available
    new.raw_user_meta_data -- Store all raw metadata potentially including name, etc.
  );
  return new;
end;
$$;

-- Trigger to call the function after a new user is created in auth.users
-- Drop trigger first if it already exists to avoid errors on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
