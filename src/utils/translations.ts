// src/utils/translations.ts

export type SupportedLanguage = "en" | "fr" | "ar";

export interface TranslationKeys {
  // Navigation
  nav_contact:          string;
  nav_cart:             string;
  nav_whatsapp:         string;

  // Hero
  hero_badge:           string;

  // Cart page — list / header
  cart_title:           string;
  cart_clear:           string;
  cart_empty_title:     string;
  cart_empty_body:      string;
  back_to_catalog:      string;
  continue_shopping:    string;

  // Order summary panel
  order_summary:        string;
  total:                string;

  // Delivery form
  delivery_info:              string;
  form_name:                  string;
  form_name_placeholder:      string;
  form_address_placeholder:   string;
  form_validation_hint:       string;
  form_address_label:         string;
  form_phone_label:           string;
  form_phone_placeholder:     string;

  // Newsletter modal
  newsletter_success:     string;
  newsletter_success_sub: string;
  newsletter_trust:       string;

  // Footer
  footer_copyright:       string;
}

export const translations: Record<SupportedLanguage, TranslationKeys> = {

  en: {
    nav_contact:         "Contact",
    nav_cart:            "Cart",
    nav_whatsapp:        "WhatsApp",

    hero_badge:          "GreenGo Market",

    cart_title:          "My Cart",
    cart_clear:          "Clear All",
    cart_empty_title:    "Your cart is empty!",
    cart_empty_body:     "You haven't added anything yet — go explore the catalog 😊",
    back_to_catalog:     "Back to Catalog",
    continue_shopping:   "Continue Shopping",

    order_summary:       "Order Summary",
    total:               "Total",

    delivery_info:             "Delivery Information",
    form_name:                 "Full name",
    form_name_placeholder:     "Your full name",
    form_address_placeholder:  "E.g. Hay Al Massira, Street 5, No. 12, Salé",
    form_validation_hint:      "Please fill in all required fields to complete your order",
    form_address_label:        "Delivery Address (Salé) *",
    form_phone_label:          "Phone Number *",
    form_phone_placeholder:    "06XXXXXXXX",

    newsletter_success:     "Thank you! You're now part of our family 🌿",
    newsletter_success_sub: "Check your inbox for your exclusive welcome offer.",
    newsletter_trust:       "No spam. Unsubscribe anytime. Your data stays private.",

    footer_copyright:       "GreenGo Market. All rights reserved.",
  },

  fr: {
    nav_contact:         "Contact",
    nav_cart:            "Panier",
    nav_whatsapp:        "WhatsApp",

    hero_badge:          "GreenGo Market",

    cart_title:          "Mon Panier",
    cart_clear:          "Tout effacer",
    cart_empty_title:    "Votre panier est vide !",
    cart_empty_body:     "Vous n'avez rien ajouté — explorez le catalogue 😊",
    back_to_catalog:     "Retour au Catalogue",
    continue_shopping:   "Continuer mes achats",

    order_summary:       "Récapitulatif",
    total:               "Total",

    delivery_info:             "Informations de livraison",
    form_name:                 "Nom complet",
    form_name_placeholder:     "Votre prénom et nom",
    form_address_placeholder:  "Ex. Hay Al Massira, Rue 5, N°12, Salé",
    form_validation_hint:      "Veuillez remplir tous les champs obligatoires",
    form_address_label:        "Adresse de livraison (Salé) *",
    form_phone_label:          "Numéro de téléphone *",
    form_phone_placeholder:    "06XXXXXXXX",

    newsletter_success:     "Merci ! Vous faites maintenant partie de notre famille 🌿",
    newsletter_success_sub: "Consultez votre boîte mail pour votre offre de bienvenue.",
    newsletter_trust:       "Pas de spam. Désabonnement à tout moment.",

    footer_copyright:       "GreenGo Market. Tous droits réservés.",
  },

  ar: {
    nav_contact:         "تواصل",
    nav_cart:            "السلة",
    nav_whatsapp:        "واتساب",

    hero_badge:          "GreenGo ماركت",

    cart_title:          "سلتي",
    cart_clear:          "مسح الكل",
    cart_empty_title:    "السلة خاوية!",
    cart_empty_body:     "ما زال ما خلطيش والو — رجع تقدى 😊",
    back_to_catalog:     "ارجع للكتالوج",
    continue_shopping:   "متابعة التسوق",

    order_summary:       "ملخص الطلب",
    total:               "المجموع الكلي",

    delivery_info:             "معلومات التوصيل",
    form_name:                 "الاسم الكامل",
    form_name_placeholder:     "اسمك الكريم",
    form_address_placeholder:  "مثلاً: حي المسيرة، زنقة 5، رقم 12، سلا",
    form_validation_hint:      "يرجى ملء جميع الحقول المطلوبة لإتمام الطلب",
    form_address_label:        "عنوان التوصيل (سلا) *",
    form_phone_label:          "رقم الهاتف *",
    form_phone_placeholder:    "06XXXXXXXX",

    newsletter_success:     "شكراً! أنت الآن من عائلتنا 🌿",
    newsletter_success_sub: "تحقق من بريدك الإلكتروني للحصول على عرض الترحيب.",
    newsletter_trust:       "لا رسائل مزعجة. إلغاء الاشتراك في أي وقت.",

    footer_copyright:       "GreenGo Market. جميع الحقوق محفوظة.",
  },
};