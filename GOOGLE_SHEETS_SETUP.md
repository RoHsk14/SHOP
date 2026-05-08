# Configuration Google Sheets

## 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un existant
3. Activez l'API **Google Sheets API** :
   - Menu → APIs & Services → Enable APIs and Services
   - Cherchez "Google Sheets API" → Enable

## 2. Créer une clé API

1. Menu → APIs & Services → Credentials
2. Cliquez sur **Create Credentials** → **API Key**
3. Copiez la clé générée

## 3. Configurer le fichier .env.local

Ajoutez votre clé dans le fichier `.env.local` :

```bash
# Google Sheets API
GOOGLE_API_KEY=your_api_key_here
```

## 4. Configurer votre Google Sheet

1. Créez un nouveau Google Sheet ou ouvrez un existant
2. Cliquez sur **Partager** en haut à droite
3. Cliquez sur **Paramètres de partage avancés**
4. Changez "Restreint" → **"Tout le monde avec le lien"**
5. Donnez l'autorisation **Éditeur**
6. Copiez l'URL du Sheet (format : `https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0`)

## 5. Tester dans l'admin

1. Démarrez le serveur : `npm run dev`
2. Allez sur `http://localhost:3000/admin/settings`
3. Collez l'URL du Sheet dans le champ "URL du Google Sheet"
4. Cliquez sur **Connecter avec Google Sheets**
5. Cliquez sur **🧪 Tester l'envoi de données**
6. Vérifiez que les données apparaissent dans votre Sheet !

## Dépannage

**Erreur : "Google API key not configured"**
→ Ajoutez `GOOGLE_API_KEY` dans `.env.local` et redémarrez le serveur

**Erreur : "Failed to save to sheet"**
→ Vérifiez que votre Sheet est bien partagé en "Tout le monde avec le lien" (Éditeur)

**Les colonnes ne s'initialisent pas automatiquement**
→ L'API ne peut pas modifier la structure du Sheet. Créez manuellement les en-têtes : Date, Nom du client, Téléphone, Adresse, Quartier, Produit, Quantité, Total, Devise, Statut
