---
layout: default
title: "DataShare — Journal d'utilisation de l'IA"
permalink: /ai-journal.fr.html
lang: fr
---

# DataShare — Journal d'utilisation de l'IA

[**English**](ai-journal.md) · [Accueil de la documentation](index.fr.md)

**DOC-02 · Journal évolutif · Ouvert le 18 novembre 2026.**

Ce journal décrit l'**utilisation réelle de l'IA générative** dans le nouveau projet DataShare. Les premières entrées sont **reconstituées rétrospectivement** à partir de nos échanges et des issues/PR GitHub : elles ne reproduisent **pas** les prompts mot pour mot. Pour la suite, chaque entrée sera mise à jour à la revue d'une issue significative, **avant fusion de sa PR**.

**Source du formalisme :** *Modèle de documentation technique* fourni par OpenClassrooms, section *Utilisation de l'IA dans le développement*. Il demande de décrire la posture, les tâches confiées, la supervision et les corrections, puis les apports et limites ; il **n'impose pas** de journal chronologique.

## 1. Posture de travail

Le développeur **maîtrise les exigences, prend les décisions techniques, valide les livrables et assume la responsabilité finale**. ChatGPT intervient en **binôme de conception** et, pour des tâches cadrées, comme **exécutant** pour les diagrammes, la documentation, les contrats API et les opérations GitHub. Le développeur peut contester les hypothèses, demander des corrections ou refuser les fonctionnalités superflues. Les modifications sont traçables dans les issues, PR et commits.

Le développeur indique que son mentor juge obsolète l'ancienne consigne « IA pour une seule User Story ». La version écrite actualisée de cette règle n'a **pas été vérifiée indépendamment** ; le journal consigne donc de façon transparente les usages réels.

## 2. Historique rétrospectif — phase de conception

_Toutes les entrées ci-dessous concernent le **18 novembre 2026** et sont regroupées après réalisation. GitHub atteste les livrables et les fusions ; les arbitrages et validations ont eu lieu dans nos échanges. Une PR ne prouve pas à elle seule que le développeur a modifié personnellement le code ou exécuté des tests._

| Issue / preuves | Intervention de l'IA (tâches déléguées) | Supervision humaine et résultat |
| --- | --- | --- |
| **DESIGN-01** · [#1](https://github.com/jlbokass/datashare/issues/1) · [PR #14](https://github.com/jlbokass/datashare/pull/14) | Génération de l'architecture draw.io éditable, du SVG et des explications FR/EN : Angular, Laravel, PostgreSQL, stockage privé, expiration. | Le développeur a examiné et accepté la structure globale. Nginx et le stockage local sont restés des **propositions**, et non la preuve d'un déploiement. |
| **DESIGN-02** · [#2](https://github.com/jlbokass/datashare/issues/2) · [PR #15](https://github.com/jlbokass/datashare/pull/15) | Élaboration puis corrections successives du MCD UML et des textes bilingues. Regroupement MVP/extensions **dans un diagramme unique** ; analyse des événements de téléchargement et de leurs données personnelles. | Le développeur a proposé des entités/attributs, précisé le sens des événements, demandé le schéma unique et choisi la conservation de statistiques après suppression. L'assistant a signalé que `ON DELETE SET NULL` ne garantit **pas l'anonymisation**. Le MCD a été validé. |
| **DESIGN-03** · [#3](https://github.com/jlbokass/datashare/issues/3) · [PR #16](https://github.com/jlbokass/datashare/pull/16) | Rédaction du contrat OpenAPI 3.1 et du guide FR/EN pour US01 à US06 : suppression d'un fichier, JWT, téléversement et téléchargement public. Contrôles **structurels** des opérations et des références. | Le développeur a approuvé le contrat et rappelé qu'il fallait intégrer les livrables précédents avant la suite. **Aucune validation OpenAPI indépendante n'était encore consignée.** |
| **TECH-01** · [#17](https://github.com/jlbokass/datashare/issues/17) · [PR #18](https://github.com/jlbokass/datashare/pull/18) · [PR #19](https://github.com/jlbokass/datashare/pull/19) | Rédaction du `.gitignore`, création de `develop` et intégrations GitHub via les outils connectés. | Le développeur a demandé le passage par `develop`, confirmé la protection de `main` et renoncé à protéger `develop` pour ce projet individuel. |
| **DESIGN-04** · [#20](https://github.com/jlbokass/datashare/issues/20) · [PR #21](https://github.com/jlbokass/datashare/pull/21) | Rédaction bilingue de la justification des technologies, alternatives et compromis, selon le modèle OC. | Le développeur a relevé l'absence de justification **avant** l'initialisation et validé les deux documents. Aucun benchmark ni environnement installé n'a été revendiqué. |
| **DOC-01** · [#22](https://github.com/jlbokass/datashare/issues/22) · [PR #23](https://github.com/jlbokass/datashare/pull/23) · [PR #24](https://github.com/jlbokass/datashare/pull/24) | Création des README et accueils FR/EN, configuration Jekyll pour GitHub Pages et vérification statique des liens Markdown. | Le développeur a approuvé la documentation, puis indiqué avoir activé GitHub Pages. Cette déclaration ne constitue **pas à elle seule** une recette indépendante du site publié. |

**Nature des travaux IA à ce stade :** diagrammes, documentation Markdown, contrat API proposé, configuration du dépôt et opérations GitHub. **Aucun code applicatif Laravel/Angular n'a encore été produit dans le nouveau projet.**

## 3. Apports et limites constatés

**Apports :** itérations rapides sur les schémas et les deux langues ; traçabilité des exigences ; corrections UML et Git réalisées avant la programmation métier.

**Limites/corrections :** des branches de conception créées séparément ne contenaient pas les livrables précédents avant leur intégration ; le MCD a nécessité plusieurs ajustements sur la suppression individuelle, le suivi facultatif et la confidentialité ; les contrôles Markdown/OpenAPI étaient **structurels** et ne démontraient ni un build applicatif, ni la sécurité à l'exécution, ni une validation OpenAPI formelle. Les décisions techniques et de confidentialité restent sous la responsabilité du développeur.

## 4. Phase de développement — Docker et initialisation des applications

| Issue / preuves | Contribution de l'IA (travaux délégués) | Actions et vérifications du développeur |
| --- | --- | --- |
| **TECH-02** · [#28](https://github.com/jlbokass/datashare/issues/28) · [PR #29](https://github.com/jlbokass/datashare/pull/29) | Préparation d'un environnement Docker-first : PostgreSQL, outils PHP/Composer et Node ; documentation et commandes de recette bilingues. | Le développeur a retenu l'approche Docker-first, exécuté les commandes localement et signalé que tous les contrôles étaient verts. **Les sorties détaillées du terminal ne sont pas reproduites ici** : versions exactes et persistance ne sont pas attestées indépendamment. Hot reload et Dozzle sont reportés. |
| **TECH-03** · [#30](https://github.com/jlbokass/datashare/issues/30) · [commit d'initialisation](https://github.com/jlbokass/datashare/compare/develop...feat/tech-03-scaffold-apps) | Fourniture des commandes officielles Composer et Angular CLI dans Docker, revue des dossiers poussés, des versions déclarées, des exclusions Git et des fichiers générés ; préparation de la PR et du journal. **Aucun code métier n'a été généré par l'IA dans cette tâche.** | Le développeur a créé Laravel 13 dans `backend/` et Angular 22 dans `frontend/`, vérifié les versions, signalé les tests Laravel et le build Angular réussis, puis commité et poussé le socle. Les sorties détaillées n'ont pas été conservées ; les tests unitaires Angular ne sont **pas encore confirmés**. PostgreSQL et hot reload restent pour l'intégration suivante. |

## 5. Modèle d'entrée pour les futures US

Ajouter **une entrée courte par issue/PR significative** ; inutile de conserver chaque prompt. Lorsque la preuve manque, indiquer **« non vérifié »** plutôt que d'inventer un résultat.

| Champ | À renseigner |
| --- | --- |
| Date · Issue · PR | AAAA-MM-JJ · lien de l'issue · PR / commit |
| Objectif | Exigence de la User Story ou de la tâche |
| Tâches IA | Analyse, code, tests, diagrammes, documentation ou outillage délégués |
| Intervention humaine | Décisions, relecture effectuée, corrections demandées ou réalisées par le développeur |
| Vérification | Commandes/tests **réellement exécutés**, résultats et preuves ; sinon **non vérifié** |
| Résultat et limites | Changements acceptés, défauts, risques sécurité/performance et prochaine action |

**Règle de maintenance :** actualiser les deux langues dans le même cycle de PR. Ne jamais versionner de secrets, données personnelles identifiables, prompts privés ou tokens. Ce journal préparera la synthèse de la documentation technique OC, sans la remplacer.
