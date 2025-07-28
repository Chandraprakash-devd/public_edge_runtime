# Dockerfile pour déployer Supabase Edge Functions sur Railway
FROM ghcr.io/supabase/edge-runtime:v1.67.4

# Exposer le port par défaut
EXPOSE 9000

# Créer le dossier de travail
WORKDIR /app

# Copier les fonctions Edge dans le conteneur
COPY ./supabase/functions /app/functions

# Variables d'environnement nécessaires
ENV SUPABASE_URL=""
ENV SUPABASE_ANON_KEY=""
ENV SUPABASE_SERVICE_ROLE_KEY=""

# Commande pour démarrer le runtime
CMD ["start", "--main-service", "/app/functions/main", "-p", "9000"]