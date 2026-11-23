# DataShare — Bilan de performance (QL-04)

[English](PERF.md) · [Documentation technique](docs/technical-documentation.fr.md) · [Issue #55](https://github.com/jlbokass/datashare/issues/55)

**État au 23 novembre 2026 :** un endpoint métier a été chronométré et le frontend a fait l'objet d'un build de production et d'un relevé Lighthouse. **Aucune mesure de production ni test de charge n'est revendiqué.**

## 1. Mesures et résultats

| Contrôle | Conditions | Résultat |
| --- | --- | --- |
| **Backend — téléchargement US02** `GET /api/shares/{token}/files/{fileId}` | Docker isolé (`compose.test.yaml`), PostgreSQL et stockage temporaires, TXT synthétique de **1 048 576 octets** ; 1 préchauffage puis **12 téléchargements séquentiels** vérifiés octet par octet | **12 HTTP 200, 0 erreur** ; p50 **13,3 ms**, p95 **15,4 ms**, moyenne **13,3 ms** ; débit séquentiel effectif **78,88 Mo/s** |
| **Angular — build de production** | `npm run build`, configuration `production`, conteneur Node 24 | Bundle initial brut **325,46 ko** ; transfert estimé **84,50 ko** ; build réussi sans avertissement de budget |
| **Chrome Lighthouse — page d'accueil** | Chrome sur `http://127.0.0.1:8080/`, **serveur Angular de développement** (modules Vite non optimisés) ; paramètres réseau/CPU non relevés | Performance **58/100** ; FCP **3,4 s**, LCP **6,2 s**, TBT **0 ms**, CLS **0**, Speed Index **3,4 s** |

**Dates et traçabilité :** benchmark backend le **22/11/2026 à 23:59 UTC** ; build Angular le **22/11/2026 à 23:50 UTC** ; relevés Lighthouse le **23/11/2026** (heure locale). Branche `quality/ql-04-performance`, issue #55 ; SHA exact du checkout Mac au moment des mesures non consigné. Résultats tirés des sorties et captures locales, non d'une CI ou d'un serveur déployé.

## 2. Analyse

- **Backend :** aucune erreur sur la courte série. Les durées et le débit décrivent des transferts **dans le réseau Docker local**, sans latence Internet ni concurrence. Ils ne permettent pas de prédire la capacité en production.
- **Bundle Angular :** **325,46 ko < 500 ko**, seuil d'avertissement configuré dans `frontend/angular.json` ; seuil d'erreur à **1 Mo**. Les budgets de styles de composants sont fixés à 4 ko (avertissement) et 8 ko (erreur).
- **Lighthouse :** les FCP/LCP élevés sont observés **sur le serveur de développement**, qui charge des modules Vite/Angular non minifiés. La capture signale **6 454 Kio de ressources (environ 6,3 Mio)** et du JavaScript non optimisé. Le score **58 ne doit pas être présenté comme le score du build de production**. TBT et CLS à zéro sont favorables dans les conditions de cette mesure.
- **Décision :** aucune optimisation ou nouvelle infrastructure de monitoring n'est justifiée par ces données. Pour connaître les performances réelles avant un déploiement public, il faudra mesurer le build servi en conditions de production.

## 3. Reproduction

Depuis la racine du dépôt :

```bash
# Taille du bundle de production
docker compose run --rm node sh -lc 'cd frontend && npm run build'

# Mesure du téléchargement (après lancement et migration de la stack isolée)
docker compose -f compose.test.yaml --profile e2e run --rm --no-deps \
  --entrypoint node playwright perf-download.mjs
```

La préparation de la stack isolée et la migration de sa base sont décrites dans [TESTING.fr.md](TESTING.fr.md). Le script `e2e/perf-download.mjs` utilise seulement Node, crée un compte/fichier fictifs et **ne doit pas être exécuté sur `compose.yaml`**. Pour le relevé navigateur, ouvrir la page locale dans Chrome DevTools → Lighthouse → Navigation et noter les métriques avec les conditions de test.

**Preuves :** sorties du build et du script, ainsi que captures Lighthouse fournies lors de la recette du 23/11/2026. Les images originales ne sont **pas archivées dans le dépôt** ; seules les valeurs ci-dessus y sont conservées.

## 4. Limites

Ce contrôle n'inclut ni charge concurrente, ni fichier de 1 Go, ni métrique d'utilisateurs réels, ni Lighthouse sur un build de production déployé. Les résultats sont ponctuels et dépendent du matériel et de l'environnement local. Le benchmark est un contrôle de latence et de transfert **ciblé**, pas une garantie de performance ou un test de capacité.
