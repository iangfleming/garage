-- Garage: seed for local dev

-- Owner allowlist (the only email that can edit).
insert into public.owner_emails (email) values ('fyedka2@gmail.com')
on conflict (email) do nothing;

-- A few sample bikes so the gallery isn't empty in local dev. Images are added later via the UI.
insert into public.bikes (maker, model, year, description, notes) values
  ('Bianchi', 'Oltre RC', 2023, 'Flagship aero road bike. Reparto Corse geometry.', 'Rides like it''s on rails. Want to fit wider tyres.'),
  ('Santa Cruz', 'Tallboy', 2021, 'Trail bike for long days out.', 'Suspension serviced last spring.'),
  ('Cinelli', 'Supercorsa', 1987, 'Vintage steel. The one that started it all.', 'Original paint. Some patina on the top tube.');
