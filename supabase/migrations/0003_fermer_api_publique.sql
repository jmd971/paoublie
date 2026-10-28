-- Les bougies, fleurs et messages passent par le serveur, qui applique les limites anti-abus.
-- On ferme donc l'accès direct par l'API publique, qui permettait de les contourner.

revoke execute on function public.light_candle(uuid) from public, anon, authenticated;
revoke execute on function public.drop_flower(uuid) from public, anon, authenticated;
grant execute on function public.light_candle(uuid) to service_role;
grant execute on function public.drop_flower(uuid) to service_role;

-- Fonction de déclencheur : n'a pas à être appelée par l'API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop policy if exists "tout visiteur peut proposer un message" on public.messages;
