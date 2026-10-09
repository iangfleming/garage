-- Garage: crop focal point
-- Non-destructive crop control. focus_x/focus_y are integer percentages (0-100) applied at
-- render time via CSS object-position on both the 4:3 thumb and the 3:2 hero. The original
-- stored image is never modified. Default 50/50 == the previous centered behaviour.

alter table public.bikes
  add column if not exists focus_x smallint not null default 50,
  add column if not exists focus_y smallint not null default 50;

alter table public.bikes drop constraint if exists bikes_focus_x_range;
alter table public.bikes
  add constraint bikes_focus_x_range check (focus_x between 0 and 100);

alter table public.bikes drop constraint if exists bikes_focus_y_range;
alter table public.bikes
  add constraint bikes_focus_y_range check (focus_y between 0 and 100);
