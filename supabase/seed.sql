-- Garage: seed for local dev

-- Owner allowlist (the only email that can edit).
insert into public.owner_emails (email) values ('fyedka2@gmail.com')
on conflict (email) do nothing;

-- A few sample bikes so the gallery isn't empty in local dev. Images are added later via the UI.
-- Fixed ids so the admin-only seed rows below (notes, todos) can reference them.
insert into public.bikes (id, maker, model, year, description) values
  ('00000000-0000-0000-0000-000000000001', 'Bianchi', 'Oltre RC', 2023, 'Flagship aero road bike. Reparto Corse geometry.'),
  ('00000000-0000-0000-0000-000000000002', 'Santa Cruz', 'Tallboy', 2021, 'Trail bike for long days out.'),
  ('00000000-0000-0000-0000-000000000003', 'Cinelli', 'Supercorsa', 1987, 'Vintage steel. The one that started it all.')
on conflict (id) do nothing;

-- Owner-only notes.
insert into public.bike_notes (bike_id, notes) values
  ('00000000-0000-0000-0000-000000000001', 'Rides like it''s on rails. Want to fit wider tyres.'),
  ('00000000-0000-0000-0000-000000000002', 'Suspension serviced last spring.'),
  ('00000000-0000-0000-0000-000000000003', 'Original paint. Some patina on the top tube.')
on conflict (bike_id) do nothing;

-- Owner-only todos (due_date is optional).
insert into public.todos (bike_id, body, due_date) values
  ('00000000-0000-0000-0000-000000000001', 'Fit 30mm tyres', current_date + interval '14 days'),
  ('00000000-0000-0000-0000-000000000001', 'Replace bar tape', null),
  ('00000000-0000-0000-0000-000000000002', 'Lower fork service', current_date + interval '30 days'),
  ('00000000-0000-0000-0000-000000000003', 'Order new headset bearings', null);
