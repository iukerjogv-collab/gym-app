-- =============================================================================
-- CORRECCIÓN RETROACTIVA: Limpieza — Reclasificar check-ins antes de 09:00 AM
-- =============================================================================
-- Este script actualiza los registros de asistencia del personal de limpieza
-- que fueron marcados incorrectamente como "retardo" cuando en realidad
-- checaron antes de las 09:00 AM en días laborales (Lunes a Viernes).
--
-- Regla nueva: Limpieza tiene entrada oficial a las 09:00 AM entre semana.
-- Todo check-in antes de las 09:01 AM debe ser "A Tiempo" (is_late = false).
--
-- ⚠️  Solo aplica a registros del periodo de nómina actual.
--     Ajusta las fechas si necesitas corregir más periodos.
-- =============================================================================

-- Preview: Ver los registros que serán corregidos
SELECT 
  a.id AS attendance_id,
  u.first_name,
  u.last_name,
  r.slug AS role_slug,
  a.check_in,
  DATE_FORMAT(CONVERT_TZ(a.check_in, '+00:00', '-06:00'), '%H:%i') AS hora_mx,
  DAYOFWEEK(CONVERT_TZ(a.check_in, '+00:00', '-06:00')) AS dia_semana,
  a.is_late
FROM attendances a
JOIN users u ON u.id = a.user_id
JOIN roles r ON r.id = u.role_id
WHERE r.slug = 'limpieza'
  AND a.is_late = 1
  -- Hora MX antes de las 09:01 (541 minutos = 9h * 60 + 1m)
  AND (HOUR(CONVERT_TZ(a.check_in, '+00:00', '-06:00')) * 60 + MINUTE(CONVERT_TZ(a.check_in, '+00:00', '-06:00'))) < 541
  -- Solo días laborales (MySQL DAYOFWEEK: 1=Domingo, 7=Sábado)
  AND DAYOFWEEK(CONVERT_TZ(a.check_in, '+00:00', '-06:00')) NOT IN (1, 7)
ORDER BY a.check_in DESC;

-- Ejecutar corrección
UPDATE attendances a
JOIN users u ON u.id = a.user_id
JOIN roles r ON r.id = u.role_id
SET a.is_late = 0
WHERE r.slug = 'limpieza'
  AND a.is_late = 1
  -- Hora MX antes de las 09:01 (541 minutos = 9h * 60 + 1m)
  AND (HOUR(CONVERT_TZ(a.check_in, '+00:00', '-06:00')) * 60 + MINUTE(CONVERT_TZ(a.check_in, '+00:00', '-06:00'))) < 541
  -- Solo días laborales
  AND DAYOFWEEK(CONVERT_TZ(a.check_in, '+00:00', '-06:00')) NOT IN (1, 7);
