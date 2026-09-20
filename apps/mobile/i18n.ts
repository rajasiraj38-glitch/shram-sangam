import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  EN: {
    translation: {
      greeting: "Connecting Skills with Opportunities",
      customer_mode: "Customer",
      customer_sub: "Book home services",
      worker_mode: "Worker",
      worker_sub: "Daily work & payouts",
      company_mode: "Company",
      company_sub: "Hire skilled teams"
    }
  },
  HI: {
    translation: {
      greeting: "कौशल को अवसरों से जोड़ना",
      customer_mode: "ग्राहक",
      customer_sub: "घरेलू सेवाएं बुक करें",
      worker_mode: "कारीगर",
      worker_sub: "दैनिक काम और भुगतान",
      company_mode: "कंपनी",
      company_sub: "कुशल टीमें किराए पर लें"
    }
  },
  TE: {
    translation: {
      greeting: "నైపుణ్యాలను అవకాశాలతో కలుపుతోంది",
      customer_mode: "కస్టమర్",
      customer_sub: "గృహ సేవలను బుక్ చేయండి",
      worker_mode: "కార్మికుడు",
      worker_sub: "రోజువారీ పని & చెల్లింపులు",
      company_mode: "కంపెనీ",
      company_sub: "నైపుణ్యం గల బృందాలను తీసుకోండి"
    }
  },
  KA: {
    translation: {
      greeting: "ಅವಕಾಶಗಳೊಂದಿಗೆ ಕೌಶಲ್ಯಗಳನ್ನು ಸಂಪರ್ಕಿಸುವುದು",
      customer_mode: "ಗ್ರಾಹಕ",
      customer_sub: "ಮನೆ ಸೇವೆಗಳನ್ನು ಬುಕ್ ಮಾಡಿ",
      worker_mode: "ಕೆಲಸಗಾರ",
      worker_sub: "ದೈನಂದಿನ ಕೆಲಸ ಮತ್ತು ಪಾವತಿಗಳು",
      company_mode: "ಕಂಪನಿ",
      company_sub: "ಕುಶಲ ತಂಡಗಳನ್ನು ನೇಮಿಸಿ"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'EN',
    fallbackLng: 'EN',
    interpolation: { escapeValue: false }
  });

export default i18n;
