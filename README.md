# DS Plomberie Électricité — Site Netlify (statique + Decap CMS)

Site one-page statique, prêt pour Netlify. Le client édite le contenu seul via `/admin/`.

## Structure
```
index.html            Page principale (Tailwind CDN, animations, formulaire Netlify)
merci.html            Page de confirmation après envoi du formulaire
netlify.toml          Config Netlify (publish = racine)
content/              Contenu éditable par le CMS (hydraté en JS)
  hero.json
  expertises.json
  contact.json
admin/                Decap CMS
  index.html
  config.yml
assets/uploads/       Images téléversées via le CMS
```

## Lancer en local
```bash
# Depuis ce dossier — n'importe quel serveur statique convient (fetch() exige http://)
npx serve .
# ou
python -m http.server 8888
```
Puis ouvrez http://localhost:8888 (ouvrir le fichier en `file://` désactive le fetch du contenu CMS,
mais le contenu par défaut codé dans le HTML reste affiché).

### Tester le CMS en local (optionnel)
```bash
npx decap-server      # proxy git local sur le port 8081 (active par local_backend: true)
```

## Déploiement Netlify (autonomie du client)
1. Poussez ce dossier sur un dépôt Git (GitHub/GitLab) et connectez-le à Netlify.
2. **Forms** : aucune config — Netlify détecte automatiquement le formulaire `contact`
   (les soumissions arrivent dans l'onglet *Forms* du tableau de bord).
3. **Identity** : Site settings → Identity → *Enable Identity*.
   - Registration : *Invite only* (recommandé), puis invitez l'email du client.
   - Services → *Enable Git Gateway*.
4. Le client se connecte sur `https://VOTRE-SITE.netlify.app/admin/` → il modifie
   Hero / Expertises / Contact, clique *Publish* → Netlify redéploie automatiquement.

> Pensez à mettre à jour `branch`, `site_url` et `display_url` dans `admin/config.yml`.
