import type { Locale } from '@/i18n/config'
import type { DocumentKey, LoanType } from '@/lib/types'

type LocalizedLoanContent = {
  name: string
  metaTitle: string
  metaDescription: string
  summary: string
  intro: string[]
  eligibility: string[]
  faqs: { q: string; a: string }[]
}

export type LoanTypePage = {
  slug: string
  loanType: LoanType
  documents: DocumentKey[]
  content: Record<Locale, LocalizedLoanContent>
}

export const LOAN_TYPE_PAGES: LoanTypePage[] = [
  {
    slug: 'personal-loan',
    loanType: 'personal',
    documents: ['pan', 'aadhaar', 'bank_statement', 'salary_slips'],
    content: {
      en: {
        name: 'Personal Loan',
        metaTitle: 'Personal Loan — Compare Interest Rates from 24+ Lenders',
        metaDescription:
          'Compare personal loans from ₹1,000 to ₹50 lakh across NBFCs and fintech lenders. See indicative interest rates, fees, tenures and documents, then apply directly.',
        summary: 'Unsecured loans for medical bills, weddings, travel, home repairs or consolidating debt.',
        intro: [
          'A personal loan is an unsecured loan: you do not pledge any asset, and the lender decides based on your income, existing debts and credit history (for example your CIBIL score). Funds can be used for almost any legitimate personal need.',
          'Interest rates in India typically range from about 10% to 36% a year depending on the lender and your profile. Smaller app-based lenders approve faster and lend smaller amounts; larger NBFCs offer bigger amounts and longer tenures but usually need a stronger credit profile.',
        ],
        eligibility: [
          'Indian resident aged roughly 21 to 60 years',
          'Salaried with a regular monthly income, or self-employed with a steady business income',
          'A credit score of 700+ improves approval chances and rates (some lenders consider new-to-credit applicants)',
          'An active bank account with your salary or business income credited to it',
        ],
        faqs: [
          { q: 'What credit score do I need for a personal loan?', a: 'Most lenders prefer a CIBIL score of 700 or more. Some fintech lenders consider applicants with lower or no scores, usually at higher interest rates and for smaller amounts.' },
          { q: 'How quickly is a personal loan disbursed?', a: 'App-based lenders can disburse within hours of approval once your KYC is complete. Larger NBFCs typically take one to three working days.' },
          { q: 'Can I prepay a personal loan?', a: 'Most lenders allow part or full prepayment after a lock-in period, sometimes with a foreclosure charge. Check the Key Fact Statement before you sign.' },
        ],
      },
      hi: {
        name: 'पर्सनल लोन',
        metaTitle: 'पर्सनल लोन — 24+ लेंडर्स की ब्याज दरों की तुलना करें',
        metaDescription:
          'NBFC और फ़िनटेक लेंडर्स के ₹1,000 से ₹50 लाख तक के पर्सनल लोन की तुलना करें। अनुमानित ब्याज दरें, शुल्क, अवधि और दस्तावेज़ देखें, फिर सीधे आवेदन करें।',
        summary: 'मेडिकल बिल, शादी, यात्रा, घर की मरम्मत या कर्ज़ समेकन के लिए बिना गारंटी वाले लोन।',
        intro: [
          'पर्सनल लोन एक असुरक्षित लोन है: आपको कोई संपत्ति गिरवी नहीं रखनी पड़ती, और लेंडर आपकी आय, मौजूदा कर्ज़ और क्रेडिट इतिहास (जैसे CIBIL स्कोर) के आधार पर फ़ैसला करता है। इसका उपयोग लगभग किसी भी वैध व्यक्तिगत ज़रूरत के लिए किया जा सकता है।',
          'भारत में ब्याज दरें आमतौर पर लेंडर और आपकी प्रोफ़ाइल के अनुसार सालाना लगभग 10% से 36% तक होती हैं। छोटे ऐप-आधारित लेंडर्स जल्दी मंज़ूरी देते हैं और कम राशि उधार देते हैं; बड़ी NBFC ज़्यादा राशि और लंबी अवधि देती हैं, लेकिन आमतौर पर बेहतर क्रेडिट प्रोफ़ाइल चाहती हैं।',
        ],
        eligibility: [
          'लगभग 21 से 60 वर्ष की आयु के भारतीय निवासी',
          'नियमित मासिक आय वाले वेतनभोगी, या स्थिर व्यावसायिक आय वाले स्वरोज़गार',
          '700+ का क्रेडिट स्कोर मंज़ूरी और दरों में मदद करता है (कुछ लेंडर्स नए उधारकर्ताओं पर भी विचार करते हैं)',
          'एक सक्रिय बैंक खाता जिसमें आपकी सैलरी या व्यावसायिक आय आती हो',
        ],
        faqs: [
          { q: 'पर्सनल लोन के लिए कितना क्रेडिट स्कोर चाहिए?', a: 'ज़्यादातर लेंडर्स 700 या उससे अधिक CIBIL स्कोर पसंद करते हैं। कुछ फ़िनटेक लेंडर्स कम या बिना स्कोर वाले आवेदकों पर भी विचार करते हैं, आमतौर पर ऊँची ब्याज दर और कम राशि के साथ।' },
          { q: 'पर्सनल लोन कितनी जल्दी मिलता है?', a: 'KYC पूरा होने के बाद ऐप-आधारित लेंडर्स मंज़ूरी के कुछ घंटों में राशि भेज सकते हैं। बड़ी NBFC आमतौर पर एक से तीन कार्य दिवस लेती हैं।' },
          { q: 'क्या मैं पर्सनल लोन जल्दी चुका सकता हूँ?', a: 'ज़्यादातर लेंडर्स लॉक-इन अवधि के बाद आंशिक या पूरा प्री-पेमेंट करने देते हैं, कभी-कभी फ़ोरक्लोज़र शुल्क के साथ। हस्ताक्षर से पहले की फ़ैक्ट स्टेटमेंट (KFS) ज़रूर पढ़ें।' },
        ],
      },
    },
  },
  {
    slug: 'business-loan',
    loanType: 'business',
    documents: ['pan', 'aadhaar', 'bank_statement', 'gst_returns', 'itr', 'business_proof'],
    content: {
      en: {
        name: 'Business Loan',
        metaTitle: 'Business Loan for MSMEs — Compare Collateral-Free Lenders',
        metaDescription:
          'Compare unsecured business loans and working-capital lines for small businesses from Indian NBFCs. See amounts, indicative rates, tenures and documents.',
        summary: 'Working capital, inventory, equipment and expansion funding for small businesses.',
        intro: [
          'Business loans help MSMEs, shop owners, traders and professionals fund working capital, stock, equipment or expansion. Many fintech NBFCs now offer collateral-free loans assessed on bank statements, GST returns and digital sales.',
          'Lenders look at how long your business has been running, its turnover and cash flow, and your personal credit history. A business that is at least one to two years old with regular bank credits has the widest choice.',
        ],
        eligibility: [
          'Business operating for at least 1–2 years (varies by lender)',
          'Minimum annual turnover set by the lender, often ₹10 lakh or more',
          'Business current account with regular credits',
          'GST registration helps for GST-based lending products',
        ],
        faqs: [
          { q: 'Can I get a business loan without collateral?', a: 'Yes. Several NBFCs offer unsecured business loans assessed on your cash flow, bank statements and GST returns. Larger amounts may need security.' },
          { q: 'Is GST registration mandatory?', a: 'Not always, but GST returns are one of the simplest ways for lenders to verify turnover, so registered businesses often get faster decisions.' },
          { q: 'What is a business line of credit?', a: 'A line of credit lets you draw funds up to a sanctioned limit and pay interest only on what you use, which suits seasonal working-capital needs.' },
        ],
      },
      hi: {
        name: 'बिज़नेस लोन',
        metaTitle: 'MSME के लिए बिज़नेस लोन — बिना गारंटी वाले लेंडर्स की तुलना',
        metaDescription:
          'भारतीय NBFC के छोटे व्यवसायों के लिए असुरक्षित बिज़नेस लोन और वर्किंग-कैपिटल लाइन की तुलना करें। राशि, अनुमानित दरें, अवधि और दस्तावेज़ देखें।',
        summary: 'छोटे व्यवसायों के लिए वर्किंग कैपिटल, स्टॉक, उपकरण और विस्तार के लिए फ़ंडिंग।',
        intro: [
          'बिज़नेस लोन MSME, दुकानदारों, व्यापारियों और पेशेवरों को वर्किंग कैपिटल, स्टॉक, उपकरण या विस्तार के लिए फ़ंड देते हैं। कई फ़िनटेक NBFC अब बैंक स्टेटमेंट, GST रिटर्न और डिजिटल बिक्री के आधार पर बिना गारंटी लोन देती हैं।',
          'लेंडर्स देखते हैं कि आपका व्यवसाय कितने समय से चल रहा है, उसका टर्नओवर और कैश फ़्लो क्या है, और आपका व्यक्तिगत क्रेडिट इतिहास कैसा है। कम से कम एक-दो साल पुराने और नियमित बैंक लेन-देन वाले व्यवसाय के पास सबसे ज़्यादा विकल्प होते हैं।',
        ],
        eligibility: [
          'कम से कम 1–2 साल से चल रहा व्यवसाय (लेंडर के अनुसार अलग)',
          'लेंडर द्वारा तय न्यूनतम सालाना टर्नओवर, अक्सर ₹10 लाख या अधिक',
          'नियमित लेन-देन वाला व्यवसायिक चालू खाता',
          'GST-आधारित लोन के लिए GST पंजीकरण मददगार है',
        ],
        faqs: [
          { q: 'क्या बिना गारंटी के बिज़नेस लोन मिल सकता है?', a: 'हाँ। कई NBFC आपके कैश फ़्लो, बैंक स्टेटमेंट और GST रिटर्न के आधार पर असुरक्षित बिज़नेस लोन देती हैं। बड़ी राशि के लिए गारंटी की ज़रूरत हो सकती है।' },
          { q: 'क्या GST पंजीकरण ज़रूरी है?', a: 'हमेशा नहीं, लेकिन GST रिटर्न टर्नओवर जाँचने का सबसे आसान तरीका है, इसलिए पंजीकृत व्यवसायों को अक्सर जल्दी फ़ैसला मिलता है।' },
          { q: 'बिज़नेस क्रेडिट लाइन क्या है?', a: 'क्रेडिट लाइन में आप स्वीकृत लिमिट तक पैसे निकाल सकते हैं और ब्याज केवल इस्तेमाल की गई राशि पर देते हैं — मौसमी वर्किंग-कैपिटल ज़रूरतों के लिए यह उपयुक्त है।' },
        ],
      },
    },
  },
  {
    slug: 'gold-loan',
    loanType: 'gold',
    documents: ['aadhaar', 'pan', 'gold_items', 'photo'],
    content: {
      en: {
        name: 'Gold Loan',
        metaTitle: 'Gold Loan — Compare Rates and Loan-to-Value',
        metaDescription:
          'Compare gold loans against jewellery from leading Indian NBFCs. Understand loan-to-value limits, indicative rates, tenures and documents.',
        summary: 'Quick secured loans against your gold jewellery, often disbursed the same day.',
        intro: [
          'A gold loan is secured by the gold jewellery you pledge. Because the loan is backed by collateral, approval is fast and your credit score matters far less than for a personal loan.',
          'The amount you can borrow depends on the weight and purity of your gold and the regulatory loan-to-value (LTV) limit. Your jewellery is returned when you repay the loan in full.',
        ],
        eligibility: [
          'Indian resident aged 18 or above',
          'Owns gold jewellery of 18–22 carat purity',
          'Valid KYC documents (Aadhaar, PAN)',
          'No minimum income or credit score is usually required',
        ],
        faqs: [
          { q: 'How much can I borrow against my gold?', a: 'Lenders lend a percentage of your gold’s market value, capped by RBI’s loan-to-value limit. The exact amount depends on weight, purity and the day’s gold rate.' },
          { q: 'What happens if I do not repay a gold loan?', a: 'The lender can auction the pledged gold after giving notice. Always repay or renew before the due date to protect your jewellery.' },
        ],
      },
      hi: {
        name: 'गोल्ड लोन',
        metaTitle: 'गोल्ड लोन — दरें और लोन-टू-वैल्यू की तुलना करें',
        metaDescription:
          'प्रमुख भारतीय NBFC के गहनों पर गोल्ड लोन की तुलना करें। लोन-टू-वैल्यू सीमा, अनुमानित दरें, अवधि और दस्तावेज़ समझें।',
        summary: 'सोने के गहनों पर तुरंत मिलने वाला सुरक्षित लोन, अक्सर उसी दिन।',
        intro: [
          'गोल्ड लोन आपके गिरवी रखे सोने के गहनों पर मिलता है। क्योंकि लोन गारंटी पर आधारित है, मंज़ूरी जल्दी होती है और पर्सनल लोन की तुलना में क्रेडिट स्कोर का महत्व बहुत कम होता है।',
          'कितना लोन मिलेगा, यह आपके सोने के वज़न, शुद्धता और नियामक लोन-टू-वैल्यू (LTV) सीमा पर निर्भर करता है। पूरा लोन चुकाने पर आपके गहने वापस कर दिए जाते हैं।',
        ],
        eligibility: [
          '18 वर्ष या उससे अधिक आयु के भारतीय निवासी',
          '18–22 कैरेट शुद्धता के सोने के गहने',
          'मान्य KYC दस्तावेज़ (आधार, PAN)',
          'आमतौर पर न्यूनतम आय या क्रेडिट स्कोर की ज़रूरत नहीं होती',
        ],
        faqs: [
          { q: 'मेरे सोने पर कितना लोन मिल सकता है?', a: 'लेंडर्स आपके सोने के बाज़ार मूल्य का एक हिस्सा उधार देते हैं, जो RBI की लोन-टू-वैल्यू सीमा तक होता है। सही राशि वज़न, शुद्धता और उस दिन के सोने के भाव पर निर्भर करती है।' },
          { q: 'गोल्ड लोन न चुकाने पर क्या होता है?', a: 'सूचना देने के बाद लेंडर गिरवी रखे सोने की नीलामी कर सकता है। अपने गहनों की सुरक्षा के लिए नियत तारीख से पहले लोन चुकाएँ या नवीनीकरण करें।' },
        ],
      },
    },
  },
  {
    slug: 'education-loan',
    loanType: 'education',
    documents: ['pan', 'aadhaar', 'admission_letter', 'co_applicant_kyc', 'itr'],
    content: {
      en: {
        name: 'Education Loan',
        metaTitle: 'Education Loan for India & Abroad — Compare Lenders',
        metaDescription:
          'Compare education loans for studies in India and abroad from specialist NBFCs. See amounts, indicative rates, moratorium and documents.',
        summary: 'Funding for tuition, living costs and travel for courses in India and overseas.',
        intro: [
          'Education loans cover tuition fees and often living, travel and equipment costs. Specialist education NBFCs can sanction loans before admission is final and offer a moratorium, so repayment usually starts after the course ends.',
          'A parent or guardian normally joins as co-applicant, and their income and credit history play a large role in the decision. Interest paid on education loans may be deductible under Section 80E of the Income Tax Act.',
        ],
        eligibility: [
          'Indian student with admission (or applying) to a recognised course',
          'Co-applicant (usually a parent) with a stable income',
          'Collateral may be needed for larger amounts',
          'Academic record and the institution’s standing affect the offer',
        ],
        faqs: [
          { q: 'When do I start repaying an education loan?', a: 'Most lenders offer a moratorium covering the course period plus 6–12 months. Some ask you to pay simple interest during the course to reduce the total cost.' },
          { q: 'Can I get a loan before my admission is confirmed?', a: 'Some education NBFCs offer pre-admission sanction letters, which can help with visa applications for overseas study.' },
        ],
      },
      hi: {
        name: 'एजुकेशन लोन',
        metaTitle: 'भारत और विदेश में पढ़ाई के लिए एजुकेशन लोन — लेंडर्स की तुलना',
        metaDescription:
          'विशेष NBFC के भारत और विदेश में पढ़ाई के लिए एजुकेशन लोन की तुलना करें। राशि, अनुमानित दरें, मोरेटोरियम और दस्तावेज़ देखें।',
        summary: 'भारत और विदेश के पाठ्यक्रमों के लिए ट्यूशन, रहने और यात्रा का ख़र्च।',
        intro: [
          'एजुकेशन लोन ट्यूशन फ़ीस और अक्सर रहने, यात्रा और उपकरणों का ख़र्च कवर करते हैं। विशेष शिक्षा NBFC प्रवेश पक्का होने से पहले भी लोन स्वीकृत कर सकती हैं और मोरेटोरियम देती हैं, इसलिए भुगतान आमतौर पर कोर्स ख़त्म होने के बाद शुरू होता है।',
          'आमतौर पर माता-पिता या अभिभावक सह-आवेदक बनते हैं, और उनकी आय और क्रेडिट इतिहास फ़ैसले में बड़ी भूमिका निभाते हैं। एजुकेशन लोन पर दिया गया ब्याज आयकर अधिनियम की धारा 80E के तहत कटौती योग्य हो सकता है।',
        ],
        eligibility: [
          'किसी मान्यता प्राप्त पाठ्यक्रम में प्रवेश पाने वाले (या आवेदन करने वाले) भारतीय छात्र',
          'स्थिर आय वाला सह-आवेदक (आमतौर पर माता-पिता)',
          'बड़ी राशि के लिए गारंटी की ज़रूरत हो सकती है',
          'शैक्षणिक रिकॉर्ड और संस्थान की प्रतिष्ठा ऑफ़र को प्रभावित करते हैं',
        ],
        faqs: [
          { q: 'एजुकेशन लोन का भुगतान कब शुरू होता है?', a: 'ज़्यादातर लेंडर्स कोर्स की अवधि और उसके बाद 6–12 महीने का मोरेटोरियम देते हैं। कुछ लेंडर्स कुल लागत घटाने के लिए पढ़ाई के दौरान साधारण ब्याज देने को कहते हैं।' },
          { q: 'क्या प्रवेश पक्का होने से पहले लोन मिल सकता है?', a: 'कुछ शिक्षा NBFC प्रवेश से पहले स्वीकृति पत्र देती हैं, जो विदेश में पढ़ाई के लिए वीज़ा आवेदन में मदद कर सकता है।' },
        ],
      },
    },
  },
]

export function getLoanTypePage(slug: string): LoanTypePage | undefined {
  return LOAN_TYPE_PAGES.find((page) => page.slug === slug)
}
