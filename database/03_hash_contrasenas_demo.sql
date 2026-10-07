-- Sustituye marcadores antiguos de cuentas demo por el bcrypt de Passw123.
-- No modifica usuarios con contrasenas reales ni requiere reiniciar la base.
UPDATE usuario
SET contrasena = '$2a$12$SYkWhr2bVMvKyYplaVy.VeNLKFFtY6tMDp6E9MmPp2Rzqb7qgM2RO'
WHERE contrasena ~ '^hash_pass_[0-9]+$';