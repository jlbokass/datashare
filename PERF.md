# DataShare — Bilan de performance (QL-04)

[English](docs/en/PERF.md) · [Documentation technique](docs/technical-documentation.fr.md) · [Issue #55](https://github.com/jlbokass/datashare/issues/55)

**Bilan du 23 novembre 2026.** L'évaluation porte sur le temps de réponse de l'API de téléchargement, la taille des fichiers compilés d'Angular et les indicateurs Lighthouse de la page d'accueil. Les mesures ont été réalisées exclusivement en environnement local, sans test de charge.

## 1. Mesures et résultats

| Contrôle | Conditions | Résultat |
| --- | --- | --- |
| **Backend — téléchargement US02** `GET /api/shares/{token}/files/{fileId}` | Docker isolé (`compose.test.yaml`), PostgreSQL et stockage temporaires, fichier texte de test de **1 048 576 octets** ; une requête de préchauffage, puis **12 téléchargements séquentiels** vérifiés octet par octet | **12 réponses HTTP 200, aucune erreur** ; p50 **13,3 ms**, p95 **15,4 ms**, moyenne **13,3 ms** ; débit séquentiel effectif **78,88 Mo/s** |
| **Angular — compilation de production** | `npm run build`, configuration `production`, conteneur Node 24 | Taille brute du bundle initial : **325,46 ko** ; taille de transfert estimée : **84,50 ko** ; compilation réussie sans dépassement du seuil d'avertissement |
| **Chrome Lighthouse — page d'accueil** | Chrome sur `http://127.0.0.1:8080/`, **serveur Angular de développement** (modules Vite non optimisés) ; paramètres de simulation réseau et processeur non relevés | Performance **58/100** ; FCP **3,4 s**, LCP **6,2 s**, TBT **0 ms**, CLS **0**, Speed Index **3,4 s** |

**Dates et traçabilité :** mesure de l'API le **22/11/2026 à 23:59 UTC** ; compilation Angular le **22/11/2026 à 23:50 UTC** ; relevé Lighthouse le **23/11/2026** (heure locale). Branche `quality/ql-04-performance`, [issue #55](https://github.com/jlbokass/datashare/issues/55). L'identifiant exact du commit local au moment des mesures n'a pas été relevé. Les résultats proviennent d'exécutions locales, et non d'un environnement de production ou d'une exécution CI.

## 2. Analyse

- **API de téléchargement :** aucune erreur n'a été observée sur les douze requêtes. Les durées et le débit caractérisent des transferts **dans le réseau Docker local**, sans latence Internet ni accès concurrents. Ces résultats ne permettent pas d'estimer la capacité en production.
- **Bundle Angular :** **325,46 ko < 500 ko**, seuil d'avertissement configuré dans `frontend/angular.json` ; seuil d'erreur à **1 Mo**. Les seuils de taille des feuilles de style des composants sont fixés à 4 ko (avertissement) et 8 ko (erreur).
- **Lighthouse :** les temps FCP et LCP mesurés sont élevés **sur le serveur de développement**, qui charge des modules Vite/Angular non minifiés. La capture signale **6 454 Kio de ressources (environ 6,3 Mio)** et du JavaScript non optimisé. Le score **58/100 caractérise uniquement le serveur de développement**. Les valeurs nulles de TBT et de CLS sont favorables dans les conditions de cette mesure.
- **Conclusion de l'analyse :** les mesures disponibles ne justifient pas d'optimisation supplémentaire ni de mise en place d'une infrastructure de supervision. Une évaluation des performances en production nécessiterait des mesures réalisées sur l'application compilée, servie dans des conditions représentatives de cet environnement.

## 3. Reproduction

Depuis la racine du dépôt :

```bash
# Taille du bundle de production
docker compose run --rm node sh -lc 'cd frontend && npm run build'

# Mesure du téléchargement (après lancement et migration de la stack isolée)
docker compose -f compose.test.yaml --profile e2e run --rm --no-deps \
  --entrypoint node playwright perf-download.mjs
```

La préparation de l'environnement Docker isolé et la migration de sa base de données sont décrites dans [TESTING.md](TESTING.md). Le script `e2e/perf-download.mjs` utilise uniquement Node.js et crée un compte ainsi qu'un fichier de test et **ne doit pas être exécuté sur `compose.yaml`**. Pour le relevé navigateur, ouvrir la page locale dans Chrome DevTools → Lighthouse → Navigation et noter les métriques avec les conditions de test.

**Éléments de preuve :** sorties de la compilation et du script de mesure, ainsi que captures Lighthouse du 23/11/2026. Les captures originales ne sont pas archivées dans le dépôt ; les valeurs relevées sont consignées dans ce rapport.

## 4. Limites

L'évaluation ne couvre ni les accès concurrents, ni les transferts de fichiers de 1 Go, ni les mesures auprès d'utilisateurs réels, ni Lighthouse sur une version de production déployée. Les résultats dépendent du matériel et de l'environnement local. Il s'agit de mesures ciblées de latence, de débit et de performance du frontend, et non d'une validation de la capacité de l'application en production.
