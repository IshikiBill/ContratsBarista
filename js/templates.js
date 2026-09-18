const MOTIFS_CDD = [
  "Remplacement d'un salarié absent (préciser nom/poste dans les clauses particulières)",
  "Accroissement temporaire d'activité",
  "Emploi à caractère saisonnier",
  "Remplacement d'un salarié dont le contrat de travail est suspendu",
  "Attente de l'entrée en service d'un salarié recruté en CDI",
];

function periodeEssaiCDD(dureeJours) {
  if (!dureeJours) return "à déterminer selon la durée du contrat";
  const mois = dureeJours / 30;
  if (mois <= 6) return "2 semaines maximum (1 jour par semaine travaillée)";
  return "1 mois maximum";
}

const TEMPLATES = {
  "cdd-barista": {
    id: "cdd-barista",
    nom: "Contrat CDD — Barista / Personnel de café",
    intro: "Contrat à durée déterminée soumis à la Convention collective nationale des Hôtels, Cafés, Restaurants (HCR — IDCC 1979).",
    champs: [
      { id: "employeurNom", label: "Nom de l'établissement (employeur)", type: "text" },
      { id: "employeurAdresse", label: "Adresse de l'établissement", type: "text" },
      { id: "employeurSiret", label: "SIRET employeur", type: "text" },
      { id: "employeurRepresentant", label: "Représenté par (nom, qualité)", type: "text" },
      { id: "salarieNom", label: "Nom et prénom du salarié", type: "text" },
      { id: "salarieAdresse", label: "Adresse du salarié", type: "text" },
      { id: "salarieSecu", label: "N° de sécurité sociale", type: "text" },
      { id: "poste", label: "Intitulé du poste", type: "text", default: "Barista" },
      { id: "motif", label: "Motif légal de recours au CDD", type: "select", options: MOTIFS_CDD },
      { id: "motifDetail", label: "Précision sur le motif (ex: nom du salarié remplacé)", type: "text" },
      { id: "dateDebut", label: "Date de début", type: "date" },
      { id: "dateFin", label: "Date de fin (ou terme imprécis : laisser vide)", type: "date" },
      { id: "dureeJours", label: "Durée prévisible en jours (pour calcul période d'essai)", type: "number" },
      { id: "tempsTravail", label: "Type de temps de travail", type: "select", options: ["Temps plein (35h/semaine)", "Temps partiel"] },
      { id: "heuresSemaine", label: "Nombre d'heures / semaine", type: "number", default: 35 },
      { id: "tauxHoraire", label: "Taux horaire brut (€)", type: "number", step: "0.01" },
      { id: "lieuTravail", label: "Lieu de travail", type: "text" },
      { id: "dateSignature", label: "Date de signature", type: "date" },
    ],
    texte: (v) => `CONTRAT À DURÉE DÉTERMINÉE

Entre les soussignés :

${v.employeurNom || "[Employeur]"}, dont le siège est situé ${v.employeurAdresse || "[adresse]"}, SIRET ${v.employeurSiret || "[SIRET]"}, représenté par ${v.employeurRepresentant || "[représentant]"},
ci-après dénommé "l'Employeur",

Et :

${v.salarieNom || "[Salarié]"}, demeurant ${v.salarieAdresse || "[adresse]"}, n° de sécurité sociale ${v.salarieSecu || "[numéro]"},
ci-après dénommé "le Salarié",

Il a été convenu ce qui suit :

ARTICLE 1 — ENGAGEMENT ET NATURE DU CONTRAT
L'Employeur engage le Salarié en qualité de ${v.poste || "[poste]"}, dans le cadre d'un contrat à durée déterminée conclu en application des articles L.1242-1 et suivants du Code du travail.
Le présent contrat est régi par la Convention collective nationale des Hôtels, Cafés, Restaurants (HCR — IDCC 1979).

ARTICLE 2 — MOTIF DU RECOURS AU CDD
Motif : ${v.motif || "[motif à préciser]"}.
Précisions : ${v.motifDetail || "[à compléter]"}.
Conformément à l'article L.1242-12 du Code du travail, ce motif ne peut être détourné pour pourvoir durablement un emploi lié à l'activité normale et permanente de l'établissement.

ARTICLE 3 — DURÉE DU CONTRAT
Le présent contrat prend effet le ${v.dateDebut || "[date de début]"} et se termine le ${v.dateFin || "[terme imprécis, selon la durée minimale prévue]"}.

ARTICLE 4 — PÉRIODE D'ESSAI
Le contrat est conclu avec une période d'essai de ${periodeEssaiCDD(Number(v.dureeJours))}, décomptée à partir du ${v.dateDebut || "[date de début]"}.

ARTICLE 5 — DURÉE DU TRAVAIL
Le Salarié est engagé en ${v.tempsTravail || "[temps plein/partiel]"}, pour une durée hebdomadaire de ${v.heuresSemaine || "[nombre]"} heures.
Les horaires précis sont communiqués par voie d'affichage ou de planning, conformément aux dispositions conventionnelles applicables.

ARTICLE 6 — RÉMUNÉRATION
Le Salarié percevra un taux horaire brut de ${v.tauxHoraire ? v.tauxHoraire + " €" : "[montant]"}, au moins égal au SMIC et aux minima de la grille conventionnelle HCR applicables à son coefficient, versé mensuellement.

ARTICLE 7 — LIEU DE TRAVAIL
Le Salarié exercera ses fonctions à : ${v.lieuTravail || "[adresse de l'établissement]"}.

ARTICLE 8 — INDEMNITÉ DE FIN DE CONTRAT
À l'issue du contrat, sauf disposition légale contraire (poursuite en CDI, contrat saisonnier, etc.), le Salarié percevra une indemnité de fin de contrat égale à 10 % de la rémunération totale brute perçue, conformément à l'article L.1243-8 du Code du travail.

ARTICLE 9 — PROTECTION SOCIALE
Le Salarié est affilié aux caisses de retraite complémentaire et de prévoyance applicables à la branche HCR, ainsi qu'à la mutuelle d'entreprise si celle-ci est en place.

ARTICLE 10 — DROIT APPLICABLE
Le présent contrat est soumis au droit français, au Code du travail et à la Convention collective HCR.

Fait à ________________, le ${v.dateSignature || "[date]"}, en deux exemplaires originaux.

Signature de l'Employeur                    Signature du Salarié
(précédée de "Lu et approuvé")              (précédée de "Lu et approuvé")`,
  },

  "freelance": {
    id: "freelance",
    nom: "Contrat de prestation de services — Freelance",
    intro: "Contrat commercial entre deux professionnels indépendants — n'établit pas de lien de subordination ni de relation salariale.",
    champs: [
      { id: "clientNom", label: "Nom de l'établissement (client)", type: "text" },
      { id: "clientAdresse", label: "Adresse du client", type: "text" },
      { id: "clientSiret", label: "SIRET client", type: "text" },
      { id: "clientRepresentant", label: "Représenté par", type: "text" },
      { id: "prestataireNom", label: "Nom du prestataire (freelance)", type: "text" },
      { id: "prestataireAdresse", label: "Adresse du prestataire", type: "text" },
      { id: "prestataireSiret", label: "SIRET / n° auto-entrepreneur du prestataire", type: "text" },
      { id: "objet", label: "Objet de la prestation", type: "textarea" },
      { id: "dateDebut", label: "Date de début de mission", type: "date" },
      { id: "dateFin", label: "Date de fin de mission", type: "date" },
      { id: "tarif", label: "Tarif (€ / prestation ou € / heure)", type: "text" },
      { id: "modalitesPaiement", label: "Modalités de paiement (délai, acompte...)", type: "text", default: "Paiement à 30 jours fin de mois, sur présentation de facture" },
      { id: "preavisResiliation", label: "Préavis de résiliation", type: "text", default: "15 jours" },
      { id: "assurance", label: "Assurance responsabilité civile professionnelle du prestataire", type: "text", default: "Le prestataire déclare être couvert par une assurance RC Pro en cours de validité" },
      { id: "dateSignature", label: "Date de signature", type: "date" },
    ],
    texte: (v) => `CONTRAT DE PRESTATION DE SERVICES

Entre les soussignés :

${v.clientNom || "[Client]"}, dont le siège est situé ${v.clientAdresse || "[adresse]"}, SIRET ${v.clientSiret || "[SIRET]"}, représenté par ${v.clientRepresentant || "[représentant]"},
ci-après dénommé "le Client",

Et :

${v.prestataireNom || "[Prestataire]"}, exerçant sous le SIRET ${v.prestataireSiret || "[SIRET]"}, demeurant ${v.prestataireAdresse || "[adresse]"},
ci-après dénommé "le Prestataire", intervenant en qualité de professionnel indépendant.

Il a été convenu ce qui suit :

ARTICLE 1 — OBJET
Le Prestataire s'engage à réaliser, en toute indépendance et sans lien de subordination avec le Client, la prestation suivante :
${v.objet || "[description de la prestation]"}

ARTICLE 2 — INDÉPENDANCE DU PRESTATAIRE
Le Prestataire organise librement son activité, son emploi du temps et ses méthodes de travail. Le présent contrat ne crée aucun lien de subordination juridique et ne saurait être requalifié en contrat de travail. Le Prestataire demeure seul responsable de ses obligations sociales et fiscales.

ARTICLE 3 — DURÉE DE LA MISSION
La prestation est réalisée du ${v.dateDebut || "[date début]"} au ${v.dateFin || "[date fin]"}.

ARTICLE 4 — RÉMUNÉRATION ET FACTURATION
En contrepartie de la prestation, le Client versera au Prestataire la somme de ${v.tarif || "[montant]"}.
Modalités de paiement : ${v.modalitesPaiement || "[à préciser]"}.
Le Prestataire émettra une facture conforme à la réglementation en vigueur.

ARTICLE 5 — RÉSILIATION
Chaque partie peut mettre fin au présent contrat moyennant un préavis de ${v.preavisResiliation || "[durée]"}, notifié par écrit, sauf manquement grave justifiant une résiliation immédiate.

ARTICLE 6 — ASSURANCE ET RESPONSABILITÉ
${v.assurance || "Le Prestataire déclare être couvert par une assurance responsabilité civile professionnelle en cours de validité."}

ARTICLE 7 — CONFIDENTIALITÉ
Chaque partie s'engage à garder confidentielles les informations échangées dans le cadre de l'exécution du présent contrat.

ARTICLE 8 — DROIT APPLICABLE ET LITIGES
Le présent contrat est soumis au droit français. Tout litige relatif à son interprétation ou son exécution relève des tribunaux compétents du ressort du siège du Client, à défaut de résolution amiable.

Fait à ________________, le ${v.dateSignature || "[date]"}, en deux exemplaires originaux.

Signature du Client                          Signature du Prestataire
(précédée de "Lu et approuvé")               (précédée de "Lu et approuvé")`,
  },
};
