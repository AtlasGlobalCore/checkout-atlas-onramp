export type Locale = 'pt' | 'en' | 'es' | 'fr';

export const locales: Locale[] = ['pt', 'en', 'es', 'fr'];

export const localeNames: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

export const defaultLocale: Locale = 'pt';

const translations = {
  pt: {
    // Header
    'app.title': 'Finalizar Compra',
    'app.subtitle': 'Confira os detalhes da sua encomenda e complete o pagamento',
    'app.secure': 'Pagamento seguro',

    // Order summary
    'order.title': 'Resumo da Encomenda',
    'order.product': 'Produto',
    'order.ref': 'Referência',
    'order.amount': 'Total',
    'order.currency.eur': 'EUR',
    'order.currency.usd': 'USD',

    // Customer form
    'customer.title': 'Dados Pessoais',
    'customer.subtitle': 'Para completar a sua compra, precisamos de alguns dados',
    'customer.email': 'Endereço de email',
    'customer.email.placeholder': 'seu@email.com',
    'customer.phone': 'Número de telefone',
    'customer.phone.placeholder': '+351 912 345 678',
    'customer.firstName': 'Nome próprio',
    'customer.firstName.placeholder': 'João',
    'customer.lastName': 'Apelido',
    'customer.lastName.placeholder': 'Silva',
    'customer.dob': 'Data de nascimento',
    'customer.dob.placeholder': 'DD/MM/AAAA',
    'customer.country': 'País',
    'customer.address1': 'Morada',
    'customer.address1.placeholder': 'Rua, Número',
    'customer.address2': 'Complemento (opcional)',
    'customer.address2.placeholder': 'Apartamento, Bloco...',
    'customer.city': 'Cidade',
    'customer.zip': 'Código Postal',
    'customer.zip.placeholder': '1000-001',
    'customer.state': 'Distrito / Região',
    'customer.state.placeholder': 'Lisboa',

    // Payment
    'payment.title': 'Pagamento',
    'payment.subtitle': 'Revisão final antes de processar o pagamento',
    'payment.method': 'Método de Pagamento',
    'payment.processing': 'A processar o seu pagamento...',
    'payment.loading_form': 'A carregar formulário de pagamento...',
    'payment.pay_now': 'Pagar agora',
    'payment.confirming': 'A confirmar o seu pagamento...',
    'payment.card_number': 'Número do Cartão',
    'payment.expiry': 'Data de Validade',
    'payment.secure_note': 'O seu pagamento é processado de forma segura. Não guardamos dados do seu cartão.',
    'payment.card_error': 'Verifique os dados do seu cartão e tente novamente.',
    'payment.generic_error': 'Ocorreu um erro inesperado. Tente novamente.',
    'payment.load_error': 'Não foi possível inicializar o pagamento. Tente novamente.',
    'payment.confirm_error': 'Erro ao confirmar o pagamento. Tente novamente.',

    // Buttons
    'btn.continue': 'Continuar',
    'btn.pay': 'Pagar {amount}',
    'btn.back': 'Voltar',
    'btn.loading': 'A processar...',
    'btn.retry': 'Tentar novamente',

    // Steps
    'step.order': 'Encomenda',
    'step.customer': 'Dados',
    'step.payment': 'Pagamento',

    // Success
    'success.title': 'Pagamento Concluído!',
    'success.subtitle': 'O seu pagamento foi processado com sucesso.',
    'success.ref': 'Referência da encomenda',
    'success.thankyou': 'Obrigado pela sua compra!',
    'success.merchant': 'Receberá a confirmação por email em breve.',

    // Error
    'error.title': 'Erro',
    'error.session_expired': 'Esta sessão de checkout expirou ou é inválida.',
    'error.payment_failed': 'Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.',
    'error.generic': 'Ocorreu um erro inesperado. Por favor, tente novamente.',

    // Footer
    'footer.powered': 'Powered by',
    'footer.secure': 'Checkout seguro encriptado com SSL',
    'footer.rights': 'Todos os direitos reservados.',

    // Declaration (Pre-KYC L1)
    'declaration.label': 'Declaro que os dados fornecidos são verdadeiros e completos. Autorizo a verificação dos mesmos para fins de conformidade regulamentar.',
    'declaration.error': 'Deve aceitar a declaração para prosseguir.',
    'prekyc.rejected': 'A verificação dos seus dados não foi concluída com sucesso. Por favor, verifique e tente novamente.',

    // Validation
    'validation.required': 'Este campo é obrigatório',
    'validation.email': 'Introduza um email válido',
    'validation.phone': 'Introduza um número de telefone válido',
    'validation.min_length': 'Mínimo de {min} caracteres',

    // Countries
    'country.PT': 'Portugal',
    'country.ES': 'Espanha',
    'country.FR': 'França',
    'country.DE': 'Alemanha',
    'country.IT': 'Itália',
    'country.NL': 'Holanda',
    'country.BE': 'Bélgica',
    'country.IE': 'Irlanda',
    'country.LU': 'Luxemburgo',
    'country.AT': 'Áustria',
    'country.GB': 'Reino Unido',
    'country.US': 'Estados Unidos',
    'country.BR': 'Brasil',
    'country.CH': 'Suíça',
  },
  en: {
    'app.title': 'Checkout',
    'app.subtitle': 'Review your order details and complete the payment',
    'app.secure': 'Secure payment',

    'order.title': 'Order Summary',
    'order.product': 'Product',
    'order.ref': 'Reference',
    'order.amount': 'Total',
    'order.currency.eur': 'EUR',
    'order.currency.usd': 'USD',

    'customer.title': 'Personal Information',
    'customer.subtitle': 'To complete your purchase, we need a few details',
    'customer.email': 'Email address',
    'customer.email.placeholder': 'your@email.com',
    'customer.phone': 'Phone number',
    'customer.phone.placeholder': '+1 (555) 123-4567',
    'customer.firstName': 'First name',
    'customer.firstName.placeholder': 'John',
    'customer.lastName': 'Last name',
    'customer.lastName.placeholder': 'Doe',
    'customer.dob': 'Date of birth',
    'customer.dob.placeholder': 'MM/DD/YYYY',
    'customer.country': 'Country',
    'customer.address1': 'Address',
    'customer.address1.placeholder': 'Street, Number',
    'customer.address2': 'Apt / Suite (optional)',
    'customer.address2.placeholder': 'Apartment, Suite...',
    'customer.city': 'City',
    'customer.zip': 'ZIP / Postal code',
    'customer.zip.placeholder': '10001',
    'customer.state': 'State / Province',
    'customer.state.placeholder': 'New York',

    'payment.title': 'Payment',
    'payment.subtitle': 'Final review before processing your payment',
    'payment.method': 'Payment Method',
    'payment.processing': 'Processing your payment...',
    'payment.loading_form': 'Loading payment form...',
    'payment.pay_now': 'Pay now',
    'payment.confirming': 'Confirming your payment...',
    'payment.card_number': 'Card Number',
    'payment.expiry': 'Expiry Date',
    'payment.secure_note': 'Your payment is processed securely. We do not store your card details.',
    'payment.card_error': 'Check your card details and try again.',
    'payment.generic_error': 'An unexpected error occurred. Please try again.',
    'payment.load_error': 'Unable to initialize payment. Please try again.',
    'payment.confirm_error': 'Error confirming payment. Please try again.',

    'btn.continue': 'Continue',
    'btn.pay': 'Pay {amount}',
    'btn.back': 'Back',
    'btn.loading': 'Processing...',
    'btn.retry': 'Try again',

    'step.order': 'Order',
    'step.customer': 'Details',
    'step.payment': 'Payment',

    'success.title': 'Payment Successful!',
    'success.subtitle': 'Your payment has been processed successfully.',
    'success.ref': 'Order reference',
    'success.thankyou': 'Thank you for your purchase!',
    'success.merchant': 'You will receive a confirmation email shortly.',

    'error.title': 'Error',
    'error.session_expired': 'This checkout session has expired or is invalid.',
    'error.payment_failed': 'An error occurred while processing the payment. Please try again.',
    'error.generic': 'An unexpected error occurred. Please try again.',

    'footer.powered': 'Powered by',
    'footer.secure': 'Secure SSL-encrypted checkout',
    'footer.rights': 'All rights reserved.',

    // Declaration (Pre-KYC L1)
    'declaration.label': 'I declare that the information provided is true and complete. I authorize verification of this data for regulatory compliance purposes.',
    'declaration.error': 'You must accept the declaration to continue.',
    'prekyc.rejected': 'Your data verification was not successful. Please check and try again.',

    // Validation
    'validation.required': 'This field is required',
    'validation.email': 'Enter a valid email',
    'validation.phone': 'Enter a valid phone number',
    'validation.min_length': 'Minimum {min} characters',

    'country.PT': 'Portugal',
    'country.ES': 'Spain',
    'country.FR': 'France',
    'country.DE': 'Germany',
    'country.IT': 'Italy',
    'country.NL': 'Netherlands',
    'country.BE': 'Belgium',
    'country.IE': 'Ireland',
    'country.LU': 'Luxembourg',
    'country.AT': 'Austria',
    'country.GB': 'United Kingdom',
    'country.US': 'United States',
    'country.BR': 'Brazil',
    'country.CH': 'Switzerland',
  },
  es: {
    'app.title': 'Finalizar Compra',
    'app.subtitle': 'Revise los detalles de su pedido y complete el pago',
    'app.secure': 'Pago seguro',

    'order.title': 'Resumen del Pedido',
    'order.product': 'Producto',
    'order.ref': 'Referencia',
    'order.amount': 'Total',
    'order.currency.eur': 'EUR',
    'order.currency.usd': 'USD',

    'customer.title': 'Datos Personales',
    'customer.subtitle': 'Para completar su compra, necesitamos algunos datos',
    'customer.email': 'Correo electrónico',
    'customer.email.placeholder': 'su@email.com',
    'customer.phone': 'Número de teléfono',
    'customer.phone.placeholder': '+34 612 345 678',
    'customer.firstName': 'Nombre',
    'customer.firstName.placeholder': 'Juan',
    'customer.lastName': 'Apellido',
    'customer.lastName.placeholder': 'García',
    'customer.dob': 'Fecha de nacimiento',
    'customer.dob.placeholder': 'DD/MM/AAAA',
    'customer.country': 'País',
    'customer.address1': 'Dirección',
    'customer.address1.placeholder': 'Calle, Número',
    'customer.address2': 'Complemento (opcional)',
    'customer.address2.placeholder': 'Apartamento, Bloque...',
    'customer.city': 'Ciudad',
    'customer.zip': 'Código Postal',
    'customer.zip.placeholder': '28001',
    'customer.state': 'Provincia / Región',
    'customer.state.placeholder': 'Madrid',

    'payment.title': 'Pago',
    'payment.subtitle': 'Revisión final antes de procesar el pago',
    'payment.method': 'Método de Pago',
    'payment.processing': 'Procesando su pago...',
    'payment.loading_form': 'Cargando formulario de pago...',
    'payment.pay_now': 'Pagar ahora',
    'payment.confirming': 'Confirmando su pago...',
    'payment.card_number': 'Número de Tarjeta',
    'payment.expiry': 'Fecha de Vencimiento',
    'payment.secure_note': 'Su pago se procesa de forma segura. No almacenamos datos de su tarjeta.',
    'payment.card_error': 'Verifique los datos de su tarjeta e inténtelo de nuevo.',
    'payment.generic_error': 'Ocurrió un error inesperado. Inténtelo de nuevo.',
    'payment.load_error': 'No se pudo inicializar el pago. Inténtelo de nuevo.',
    'payment.confirm_error': 'Error al confirmar el pago. Inténtelo de nuevo.',

    'btn.continue': 'Continuar',
    'btn.pay': 'Pagar {amount}',
    'btn.back': 'Volver',
    'btn.loading': 'Procesando...',
    'btn.retry': 'Intentar de nuevo',

    'step.order': 'Pedido',
    'step.customer': 'Datos',
    'step.payment': 'Pago',

    'success.title': '¡Pago Completado!',
    'success.subtitle': 'Su pago se ha procesado correctamente.',
    'success.ref': 'Referencia del pedido',
    'success.thankyou': '¡Gracias por su compra!',
    'success.merchant': 'Recibirá la confirmación por correo electrónico en breve.',

    'error.title': 'Error',
    'error.session_expired': 'Esta sesión de pago ha expirado o no es válida.',
    'error.payment_failed': 'Ocurrió un error al procesar el pago. Inténtelo de nuevo.',
    'error.generic': 'Ocurrió un error inesperado. Inténtelo de nuevo.',

    'footer.powered': 'Powered by',
    'footer.secure': 'Pago seguro con cifrado SSL',
    'footer.rights': 'Todos los derechos reservados.',

    // Declaration (Pre-KYC L1)
    'declaration.label': 'Declaro que los datos proporcionados son veraces y completos. Autorizo la verificación de los mismos con fines de cumplimiento normativo.',
    'declaration.error': 'Debe aceptar la declaración para continuar.',
    'prekyc.rejected': 'La verificación de sus datos no se completó con éxito. Por favor, verifique e intente de nuevo.',

    // Validation
    'validation.required': 'Este campo es obligatorio',
    'validation.email': 'Introduzca un email válido',
    'validation.phone': 'Introduzca un número de teléfono válido',
    'validation.min_length': 'Mínimo {min} caracteres',

    'country.PT': 'Portugal',
    'country.ES': 'España',
    'country.FR': 'Francia',
    'country.DE': 'Alemania',
    'country.IT': 'Italia',
    'country.NL': 'Países Bajos',
    'country.BE': 'Bélgica',
    'country.IE': 'Irlanda',
    'country.LU': 'Luxemburgo',
    'country.AT': 'Austria',
    'country.GB': 'Reino Unido',
    'country.US': 'Estados Unidos',
    'country.BR': 'Brasil',
    'country.CH': 'Suiza',
  },
  fr: {
    'app.title': 'Finaliser la Commande',
    'app.subtitle': 'Vérifiez les détails de votre commande et effectuez le paiement',
    'app.secure': 'Paiement sécurisé',

    'order.title': 'Résumé de la Commande',
    'order.product': 'Produit',
    'order.ref': 'Référence',
    'order.amount': 'Total',
    'order.currency.eur': 'EUR',
    'order.currency.usd': 'USD',

    'customer.title': 'Informations Personnelles',
    'customer.subtitle': 'Pour finaliser votre achat, nous avons besoin de quelques informations',
    'customer.email': 'Adresse email',
    'customer.email.placeholder': 'votre@email.com',
    'customer.phone': 'Numéro de téléphone',
    'customer.phone.placeholder': '+33 6 12 34 56 78',
    'customer.firstName': 'Prénom',
    'customer.firstName.placeholder': 'Jean',
    'customer.lastName': 'Nom de famille',
    'customer.lastName.placeholder': 'Dupont',
    'customer.dob': 'Date de naissance',
    'customer.dob.placeholder': 'JJ/MM/AAAA',
    'customer.country': 'Pays',
    'customer.address1': 'Adresse',
    'customer.address1.placeholder': 'Rue, Numéro',
    'customer.address2': 'Complément (facultatif)',
    'customer.address2.placeholder': 'Appartement, Étage...',
    'customer.city': 'Ville',
    'customer.zip': 'Code postal',
    'customer.zip.placeholder': '75001',
    'customer.state': 'Région / Province',
    'customer.state.placeholder': 'Île-de-France',

    'payment.title': 'Paiement',
    'payment.subtitle': 'Vérification finale avant le traitement du paiement',
    'payment.method': 'Méthode de Paiement',
    'payment.processing': 'Traitement de votre paiement...',
    'payment.loading_form': 'Chargement du formulaire de paiement...',
    'payment.pay_now': 'Payer maintenant',
    'payment.confirming': 'Confirmation de votre paiement...',
    'payment.card_number': 'Numéro de Carte',
    'payment.expiry': 'Date d\'Expiration',
    'payment.secure_note': 'Votre paiement est traité en toute sécurité. Nous ne stockons pas vos données bancaires.',
    'payment.card_error': 'Vérifiez les données de votre carte et réessayez.',
    'payment.generic_error': 'Une erreur inattendue est survenue. Veuillez réessayer.',
    'payment.load_error': 'Impossible d\'initialiser le paiement. Veuillez réessayer.',
    'payment.confirm_error': 'Erreur lors de la confirmation du paiement. Veuillez réessayer.',

    'btn.continue': 'Continuer',
    'btn.pay': 'Payer {amount}',
    'btn.back': 'Retour',
    'btn.loading': 'Traitement...',
    'btn.retry': 'Réessayer',

    'step.order': 'Commande',
    'step.customer': 'Données',
    'step.payment': 'Paiement',

    'success.title': 'Paiement Réussi !',
    'success.subtitle': 'Votre paiement a été traité avec succès.',
    'success.ref': 'Référence de commande',
    'success.thankyou': 'Merci pour votre achat !',
    'success.merchant': 'Vous recevrez une confirmation par email sous peu.',

    'error.title': 'Erreur',
    'error.session_expired': 'Cette session de paiement a expiré ou est invalide.',
    'error.payment_failed': 'Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.',
    'error.generic': 'Une erreur inattendue est survenue. Veuillez réessayer.',

    'footer.powered': 'Powered by',
    'footer.secure': 'Paiement sécurisé avec cryptage SSL',
    'footer.rights': 'Tous droits réservés.',

    // Declaration (Pre-KYC L1)
    'declaration.label': 'Je déclare que les informations fournies sont exactes et complètes. J\'autorise la vérification de ces données à des fins de conformité réglementaire.',
    'declaration.error': 'Vous devez accepter la déclaration pour continuer.',
    'prekyc.rejected': 'La vérification de vos données n\'a pas abouti. Veuillez vérifier et réessayer.',

    // Validation
    'validation.required': 'Ce champ est obligatoire',
    'validation.email': 'Entrez un email valide',
    'validation.phone': 'Entrez un numéro de téléphone valide',
    'validation.min_length': 'Minimum {min} caractères',

    'country.PT': 'Portugal',
    'country.ES': 'Espagne',
    'country.FR': 'France',
    'country.DE': 'Allemagne',
    'country.IT': 'Italie',
    'country.NL': 'Pays-Bas',
    'country.BE': 'Belgique',
    'country.IE': 'Irlande',
    'country.LU': 'Luxembourg',
    'country.AT': 'Autriche',
    'country.GB': 'Royaume-Uni',
    'country.US': 'États-Unis',
    'country.BR': 'Brésil',
    'country.CH': 'Suisse',
  },
} as const;

export type TranslationKey = keyof typeof translations.pt;

export function t(key: TranslationKey, locale: Locale = defaultLocale, params?: Record<string, string | number>): string {
  let text: string = translations[locale]?.[key] || translations[defaultLocale]?.[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}

export const countryList: { code: string; flag: string }[] = [
  { code: 'PT', flag: '🇵🇹' },
  { code: 'ES', flag: '🇪🇸' },
  { code: 'FR', flag: '🇫🇷' },
  { code: 'DE', flag: '🇩🇪' },
  { code: 'IT', flag: '🇮🇹' },
  { code: 'NL', flag: '🇳🇱' },
  { code: 'BE', flag: '🇧🇪' },
  { code: 'IE', flag: '🇮🇪' },
  { code: 'LU', flag: '🇱🇺' },
  { code: 'AT', flag: '🇦🇹' },
  { code: 'GB', flag: '🇬🇧' },
  { code: 'US', flag: '🇺🇸' },
  { code: 'BR', flag: '🇧🇷' },
  { code: 'CH', flag: '🇨🇭' },
];
