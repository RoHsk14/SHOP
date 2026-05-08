-- Script pour autoriser l'upload d'images dans le bucket 'products'
-- À exécuter dans Supabase > SQL Editor

-- 1. Désactiver RLS temporairement sur storage.objects (si possible)
-- Note: Supabase Storage gère ses propres politques

-- 2. Créer une politque pour permettre l'upload public
INSERT INTO storage.policies (name, bucket_id, definition)
SELECT 'Public Access', id, 'true'
FROM storage.buckets
WHERE name = 'products'
ON CONFLICT (name, bucket_id) DO NOTHING;

-- OU (méthode plus simple) : Rendre le bucket public via l'interface
-- 1. Allez dans Supabase > Storage
-- 2. Cliquez sur le bucket 'products'
-- 3. Allez dans "Policies" (onglet)
-- 4. Cliquez "Add policy" > "For full customization"
-- 5. Allow insert: (bucket_id = 'products'::text)
-- 6. Allow select: (bucket_id = 'products'::text)

-- Alternative : Utiliser l'API pour rendre le bucket public
-- (Dans Supabase, un bucket public permet à tous de lire/écrire)

-- Message
SELECT 'Pour autoriser l''upload, rendez le bucket PUBLIC dans Supabase Storage > products > Settings' as message;
