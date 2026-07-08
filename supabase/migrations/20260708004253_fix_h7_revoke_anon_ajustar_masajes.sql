-- H7 (continuación): asegurar que fn_ajustar_masajes NO sea ejecutable por usuarios anónimos.
REVOKE ALL ON FUNCTION public.fn_ajustar_masajes(bigint, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_ajustar_masajes(bigint, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_ajustar_masajes(bigint, integer) TO authenticated;
