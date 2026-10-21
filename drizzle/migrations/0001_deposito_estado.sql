ALTER TABLE public.decimos ADD COLUMN estado text NOT NULL DEFAULT 'venta';
ALTER TABLE public.albaranes ADD COLUMN tipo text NOT NULL DEFAULT 'entrega';
ALTER TABLE public.albaranes ADD COLUMN receptor_nombre text NOT NULL DEFAULT '';
ALTER TABLE public.albaranes ADD COLUMN receptor_dni text NOT NULL DEFAULT '';
ALTER TABLE public.albaranes ADD COLUMN firma text NOT NULL DEFAULT '';