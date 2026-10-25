import type { Locale } from '@/i18n/config'

export type FaqItem = { q: string; a: string }

export const FAQ: Record<Locale, FaqItem[]> = {
  en: [
    { q: 'Is MYST Finance a lender?', a: 'No. MYST Finance is a comparison and information service. We do not lend money, process loans or decide approvals. You apply directly with the lender on its official website, and the lender makes every decision.' },
    { q: 'What do I get for ₹199?', a: 'A one-time payment unlocks lifetime access to our full lender directory: direct links to each lender’s official website, lenders matched to your application highlighted first, and a downloadable PDF of the list. Future applications are free.' },
    { q: 'Does paying ₹199 guarantee a loan?', a: 'No. Loan approval, the amount, the interest rate and fees are decided only by the lender after it assesses your application. Be careful of anyone who promises guaranteed approval in exchange for an upfront fee.' },
    { q: 'Is the ₹199 fee refundable?', a: 'Because access is delivered instantly, the fee is generally non-refundable. If you were charged twice or the lender list did not unlock, contact support and we will refund duplicate or failed charges. See our Refund Policy for details.' },
    { q: 'Will checking lenders on MYST Finance affect my credit score?', a: 'No. We do not pull your credit report. Lenders may run a credit check when you apply on their website.' },
    { q: 'How do you protect my data?', a: 'Your PAN is encrypted at rest, all traffic uses HTTPS, and payments are processed by Razorpay so we never see card or UPI details. We do not sell your data. See our Privacy Policy.' },
    { q: 'Are the interest rates shown final?', a: 'No. Rates, fees and limits shown are indicative figures from public sources and change often. The lender will show your actual offer and Key Fact Statement before you accept a loan.' },
    { q: 'Why do I log in with an email OTP?', a: 'It keeps your account secure without a password. We send a 6-digit code to your email each time you log in. Never share this code with anyone — our team will never ask for it.' },
  ],
  hi: [
    { q: 'क्या MYST Finance एक लेंडर है?', a: 'नहीं। MYST Finance एक तुलना और जानकारी सेवा है। हम पैसा उधार नहीं देते, लोन प्रोसेस नहीं करते और मंज़ूरी का फ़ैसला नहीं करते। आप सीधे लेंडर की आधिकारिक वेबसाइट पर आवेदन करते हैं, और हर फ़ैसला लेंडर ही करता है।' },
    { q: '₹199 में मुझे क्या मिलता है?', a: 'एक बार के भुगतान से हमारी पूरी लेंडर डायरेक्टरी का आजीवन एक्सेस मिलता है: हर लेंडर की आधिकारिक वेबसाइट के सीधे लिंक, आपके आवेदन से मेल खाने वाले लेंडर्स सबसे ऊपर, और सूची की डाउनलोड करने योग्य PDF। आगे के आवेदन मुफ़्त हैं।' },
    { q: 'क्या ₹199 देने से लोन की गारंटी मिलती है?', a: 'नहीं। लोन मंज़ूरी, राशि, ब्याज दर और शुल्क केवल लेंडर आपके आवेदन की जाँच के बाद तय करता है। अग्रिम शुल्क के बदले गारंटीड मंज़ूरी का वादा करने वालों से सावधान रहें।' },
    { q: 'क्या ₹199 का शुल्क वापस मिलता है?', a: 'क्योंकि एक्सेस तुरंत मिल जाता है, शुल्क आमतौर पर वापस नहीं होता। अगर आपसे दो बार शुल्क लिया गया या लेंडर सूची अनलॉक नहीं हुई, तो सहायता से संपर्क करें — हम दोहरे या विफल शुल्क वापस करेंगे। विवरण के लिए हमारी रिफ़ंड नीति देखें।' },
    { q: 'क्या MYST Finance पर लेंडर्स देखने से मेरा क्रेडिट स्कोर प्रभावित होगा?', a: 'नहीं। हम आपकी क्रेडिट रिपोर्ट नहीं निकालते। जब आप लेंडर की वेबसाइट पर आवेदन करते हैं, तब लेंडर क्रेडिट जाँच कर सकता है।' },
    { q: 'आप मेरे डेटा की सुरक्षा कैसे करते हैं?', a: 'आपका PAN एन्क्रिप्ट करके रखा जाता है, सारा ट्रैफ़िक HTTPS पर चलता है, और भुगतान Razorpay द्वारा प्रोसेस होते हैं, इसलिए हम कार्ड या UPI विवरण कभी नहीं देखते। हम आपका डेटा नहीं बेचते। हमारी गोपनीयता नीति देखें।' },
    { q: 'क्या दिखाई गई ब्याज दरें अंतिम हैं?', a: 'नहीं। दिखाई गई दरें, शुल्क और सीमाएँ सार्वजनिक स्रोतों से लिए गए अनुमानित आँकड़े हैं और अक्सर बदलते हैं। लोन स्वीकार करने से पहले लेंडर आपका असली ऑफ़र और की फ़ैक्ट स्टेटमेंट दिखाएगा।' },
    { q: 'मैं ईमेल OTP से लॉगिन क्यों करता हूँ?', a: 'इससे बिना पासवर्ड के आपका खाता सुरक्षित रहता है। हर लॉगिन पर हम आपके ईमेल पर 6 अंकों का कोड भेजते हैं। यह कोड किसी के साथ साझा न करें — हमारी टीम कभी यह नहीं माँगेगी।' },
  ],
}
