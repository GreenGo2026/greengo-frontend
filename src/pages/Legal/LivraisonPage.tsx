// src/pages/Legal/LivraisonPage.tsx
import LegalTemplate from "./LegalTemplate";

const sections = [
  {
    heading: "Zone de livraison actuelle",
    body: "GreenGo Market livre actuellement uniquement a Sale et Rabat. Si vous n'etes pas dans ces villes, contactez-nous sur WhatsApp avant de passer commande.",
  },
  {
    heading: "Delai de livraison",
    body: "Livraison en moins de 2 heures apres confirmation de votre commande, 7 jours sur 7 de 8h a 20h. Aucune livraison en dehors de ces horaires.",
  },
  {
    heading: "Comment commander ?",
    body: "Ajoutez vos produits au panier sur mygreengoo.com, remplissez le formulaire avec votre adresse a Sale ou Rabat, et confirmez. Notre equipe vous contacte sur WhatsApp dans les 30 minutes.",
  },
  {
    heading: "Frais de livraison",
    body: "Les frais de livraison sont calcules selon votre adresse et le montant de votre commande. Contactez-nous sur WhatsApp au +212 664 500 789 pour toute question.",
  },
  {
    heading: "Suivi de commande",
    body: "Apres confirmation, vous pouvez suivre votre commande sur mygreengoo.com/track. Notre equipe vous envoie une mise a jour WhatsApp a chaque etape.",
  },
  {
    heading: "Produit epuise",
    body: "Si un produit est epuise, notre equipe vous contacte immediatement sur WhatsApp pour proposer une alternative ou un remboursement.",
  },
  {
    heading: "Besoin d'aide ?",
    body: "Pour toute question, contactez notre equipe sur WhatsApp au +212 664 500 789, disponible 7 jours sur 7 de 8h a 20h.",
  },
];

export default function LivraisonPage() {
  return (
    <LegalTemplate
      title="Livraison"
      subtitle="Informations de livraison — GreenGo Market"
      lastUpdated="Mai 2026"
      sections={sections}
    />
  );
}
