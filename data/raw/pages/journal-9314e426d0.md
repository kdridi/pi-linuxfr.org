URL:     https://linuxfr.org/users/oumph/journaux/mediapart-vote-electronique-l-impossible-quete-du-protocole-parfait
Title:   Mediapart: « Vote électronique : l’impossible quête du protocole parfait »
Authors: Benoît Sibaud
Date:    2026-06-21T11:35:18+02:00
License: CC By-SA
Tags:    vote_électronique et vote_par_internet
Score:   25


Mediapart a publié le 20 juin 2026 [Vote électronique : l’impossible quête du protocole parfait](https://www.mediapart.fr/journal/politique/200626/vote-electronique-l-impossible-quete-du-protocole-parfait) (Charlotte Mauger). Va-t-on y apprendre des choses nouvelles, y trouver un résumé des connaissances sur le sujet, découvrir des actualités ?

Le premier thème est l’absentéisme. Pourtant ça fait plus de vingt ans que l'on a du vote par machines à voter/ordinateurs de vote en France, et depuis 2012 en vote par Internet par les Français à l'étranger. C'est très documenté, et si on avait résolu l'absentéisme avec juste du numérique, on le saurait déjà.

https://fr.wikipedia.org/wiki/Vote_%C3%A9lectronique_en_France
https://fr.wikipedia.org/wiki/Vote_%C3%A9lectronique

(nb: perso, un axe plus intéressant serait d'étudier pourquoi « _en moyenne, il y a 3,5 à 4,5 fois plus d’écarts entre nombres de votes et d’émargements lorsqu’un ordinateur de vote est utilisé_ », cf [Rapport sur les Élections européennes et législatives 2024](http://observatoire-du-vote.org/rapport-sur-les-elections-europeennes-et-legislatives-2024/))

Le second thème est la sobriété en énergie. « _Selon [une étude](https://link.springer.com/chapter/10.1007/978-3-031-43756-4_9) publiée en 2023, l’empreinte carbone d’un scrutin classique serait 180 fois plus élevée que celle d’un scrutin électronique, principalement en raison des déplacements des électrices et électeurs._ » L'étude est basée sur l'Estonie, où le temps moyen pour aller voter est estimé à 26 min de voiture ou 19 min à pied ou 50 min en transport public ou 20 min en vélo. L'[Estonie](https://fr.wikipedia.org/wiki/Estonie) a une densité de 30 hab./km² et 79 communes. La [France](https://fr.wikipedia.org/wiki/France) a une densité de 107,2 hab./km² et ~35000 communes. On pourrait discuter de la pertinence de l'étude pour la France, même si elle donne un ordre de grandeur. Mais quand bien même l'empreinte carbone serait importante en raison du déplacement des électeurs, il faut aussi la mettre en comparaison avec le rôle des scrutins, des cérémonies du vote et du poids donné à ces moments de regroupement physique des citoyens (sinon on pourrait aussi en conclure qu'il faut arrêter la célébration de la Fête nationale du 14 juillet et les feux d'artifice, en raison de l'empreinte carbone et les déplacements des gens, et qu'on fera ça par Internet/la télé).

(nb: l'Estonie est la tarte à la crème de l'argumentation en vote par Internet, elle est toujours utilisée comme exemple car le pays est très numérisé, depuis longtemps, et on oublie facilement ses spécificités lors des conclusions. Ou le fait qu'il aurait pu être un des premiers pays à ne pas pouvoir choisir un chef d'État un jour d'élection, à cause d'[un DDoS par son grand voisin](https://fr.wikipedia.org/wiki/Cyberattaques_de_2007_en_Estonie)...)

Ensuite la sécurité. « _"À l’heure actuelle, le vote électronique ne permet pas d’obtenir les mêmes garanties de sécurité que le vote papier tel qu’il est mis en œuvre pour des élections comme les présidentielles"_ » (Véronique Cortier, du Laboratoire lorrain de recherche en informatique et ses applications (Loria), spécialiste du vote électronique).
« "_Ce qu’on veut garantir, c’est la confidentialité du lien entre le votant et son vote_", précise Stéphanie Delaune, spécialiste de cryptographie à l’Institut de recherche en informatique et systèmes aléatoires (Irisa) de Rennes (Ille-et-Vilaine). »
« _La vérification de l’identité est un autre point problématique du vote électronique._ » (Stéphanie Delaune)

Puis la confiance : « _Quelle que soit l’approche, il faut faire une hypothèse de confiance : un groupe de personnes va récupérer les votes, les déchiffrer et publier le résultat. Or, grâce à la physique quantique, on peut supprimer cette hypothèse"_, expose Eleni Diamanti, du Laboratoire d’informatique de Sorbonne-Université (LIP6). » Ça semble mal parti : avec le vote papier, les pré-requis (lire et additionner) sont faibles pour comprendre l'intégralité du processus et une personne citoyenne peut surveiller son bureau de vote, et compte sur l'ensemble des autres pour faire de même, et globalement les citoyens peuvent surveiller le scrutin. En vote par machine à voter ou en vote par Internet, la personne citoyenne ne contrôle plus rien et transfère cette responsabilité à des auditeurs publics (ANSSI, Ministère de l'intérieur, Ministère des Affaires étrangères, etc.), des auditeurs privés (sociétés d'audits informatiques, etc.) et des prestataires publics/privés (de datacenter, les éditeurs des logiciels, etc.). Et bien sûr la personne citoyenne a délégué la compréhension aussi vu qu'il faut alors comprendre le numérique, le logiciel, le matériel, la cryptographie, le réseau, etc. Bref, elle doit faire confiance à des tiers qui lui assurent que tout se passe comme prévu. Ajouter du quantique dans l'histoire ajoute encore plus de technologie et de science, et on reste dans une délégation de confiance et de contrôle à des tiers.

Plus loin, à propos du vote par Internet des Français à l'étranger : « _Les expatrié·es apprécient d’ailleurs ce mode de scrutin : plus de 70 % des votant·es l’ont choisi lors des élections législatives de 2024, plutôt que de se rendre devant l’urne._ » Regardons les chiffres de la France entière (abstention 52,49% et 53,77%) et ceux des onze circonscriptions pour les Français à l'étranger (abstention 75,23% et 77,48%) ; on pourrait en conclure que le vote par Internet ne déplace pas les foules (si je puis dire). Mais surtout on devrait en conclure que cet électorat est très particulier : bureaux de vote éloignés, électorat géographiquement dispersé, routes dangereuses (sécurité routière ou banditisme/terrorisme), éloignement du débat politique national, risques de rassemblement, etc, etc. Bref il est compliqué d'extrapoler sur cette base en ne regardant qu'un seul aspect.

« _Si voter est plus pratique et plus rapide, voilà qui devrait motiver davantage de  personnes à le faire. Sauf que les études conduites en Suisse ou en Estonie ne montrent pas d’impact significatif sur la participation._ »

Et de conclure que la technologie ne résoudra pas les problèmes de crise de confiance envers le système politique.

