export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'cuntyclam@gmail.com';
export const OPERATOR = 'Letter Studio';
export const EFFECTIVE = '2026-08-13';

export const LEGAL = {
  privacy: {
    title: 'Privacy Policy',
    h1: 'Privacy Policy',
    sections: [
      [
        'Who we are',
        `${OPERATOR} (${CONTACT_EMAIL}) runs letterstudio.net. We draft letters from the details you type. You send the letter. This is not legal advice.`,
      ],
      [
        'What we collect',
        'Email address (to send the draft). The form fields for the letter you ordered (name, member ID, memories, etc.). Optional card last-four on the gym form only if you type it — that is for the letter text, not for charging. Stripe collects card numbers on Stripe’s pages. We never see or store a full card number. Server logs may include IP address, user agent, and the page requested.',
      ],
      [
        'Why',
        'To take payment, draft the letter, email it to you, stop duplicate sends, and keep the site up. Affiliate product links on the site go to Amazon; Amazon may set cookies if you click those links. See the Affiliate Disclosure.',
      ],
      [
        'How long',
        'Pending unpaid drafts are kept until you pay, cancel, or they expire (about 48 hours). After a successful send we delete the pending order file. We keep Stripe event IDs so we do not email the same letter twice. Mail logs (to, subject, timestamp) may remain for delivery debugging. We do not sell your list.',
      ],
      [
        'Who else sees it',
        'Stripe (payments). The email provider we use to deliver the draft, if configured. Amazon if you click an affiliate link. We do not sell personal information. We do not send your letter to the gym, your boss, or the company you named.',
      ],
      [
        'Your choices',
        `Do not submit data you do not want in a draft. Email ${CONTACT_EMAIL} to ask what we have or to ask us to delete a mail-log line. We may keep payment records Stripe requires.`,
      ],
      [
        'Children',
        'Not for children under 13. Do not submit a child’s personal information.',
      ],
      [
        'Changes',
        `Effective ${EFFECTIVE}. We will update this page if the practice changes.`,
      ],
    ],
  },
  terms: {
    title: 'Terms of Service',
    h1: 'Terms of Service',
    sections: [
      [
        'The deal',
        `${OPERATOR} sells a written draft. You pay, we email a letter built from your form, you send it (or speak it). We do not mail, file, serve, or deliver the letter for you. We are not your lawyer, HR department, funeral home, or therapist. This is not legal advice.`,
      ],
      [
        'Who may buy',
        'You must be 18+ and able to form a contract in the United States. You warrant the facts you type are yours to use and are not a fraud, threat, or impersonation.',
      ],
      [
        'What you may not order',
        'Do not order letters for credit repair, timeshare exit, identity-theft recovery, adult content, harassment, extortion, or anything you know is false. We may refuse or refund without drafting.',
      ],
      [
        'No results',
        'We do not promise the gym, employer, neighbor, company, or anyone else will accept, honor, or reply to the letter. We do not promise a date, a refund from them, or a legal outcome.',
      ],
      [
        'Your content',
        'You grant us a limited license to process your form text solely to draft and email that order. We do not claim copyright in your facts. The draft we produce is licensed to you for personal use: send it, read it, edit it. Do not resell our drafts as a product.',
      ],
      [
        'Payment',
        'Prices are shown at checkout in USD. Charge is through Stripe. Digital draft is delivered by email after payment confirms. You are responsible for a working inbox.',
      ],
      [
        'Refunds',
        'If we fail to email a draft after a successful payment, email us and we will refund or resend. After a draft has been emailed, sales are final unless the draft omitted a required field you actually submitted. Chargebacks for “I changed my mind” after delivery may be disputed.',
      ],
      [
        'Limitation of liability',
        'To the maximum extent US law allows, our liability for any order is limited to the amount you paid for that order. We are not liable for lost jobs, membership fees, grief, or third-party actions after you send a letter.',
      ],
      [
        'Affiliate links',
        'Some “send it yourself” links are Amazon Associates links. Those purchases are Amazon’s contract with you, not ours. See the Affiliate Disclosure.',
      ],
      [
        'Governing law',
        `United States. These terms are effective ${EFFECTIVE}. Contact ${CONTACT_EMAIL}.`,
      ],
    ],
  },
  disclosure: {
    title: 'Affiliate Disclosure',
    h1: 'Affiliate Disclosure',
    sections: [
      [
        'Amazon',
        'As an Amazon Associate I earn from qualifying purchases.',
      ],
      [
        'What that means',
        'Some links to envelopes, stamps, certified-mail kits, and paper go to Amazon.com with our Associates tag. If you buy after clicking, Amazon may pay us a commission. You pay the same price. We do not get your Amazon account data.',
      ],
      [
        'What we do not do',
        'We do not cloak links. We do not put Amazon links in unsolicited email. We do not use Amazon logos as our own. We do not claim Amazon endorses Letter Studio. We do not cookie-stuff.',
      ],
      [
        'Other programs',
        'If we add another affiliate program, it will be listed on this page before those links go live.',
      ],
      [
        'FTC',
        `This is a paid relationship. Effective ${EFFECTIVE}. Questions: ${CONTACT_EMAIL}.`,
      ],
    ],
  },
  refunds: {
    title: 'Refunds',
    h1: 'Refunds',
    sections: [
      [
        'If we did not deliver',
        `Paid and no draft in your inbox: email ${CONTACT_EMAIL} from the checkout address. We resend or refund.`,
      ],
      [
        'If we delivered',
        'The draft is a custom digital good. No refund because you decided not to send it, or because the gym/boss/company ignored it.',
      ],
      [
        'Missing fields',
        'If the emailed draft left out a required field you submitted, email us. We will redraw or refund.',
      ],
    ],
  },
};
