// Affiliate send-it links. Tag from AMAZON_TAG, default is the live Associates ID.
export const AMAZON_TAG = process.env.AMAZON_TAG || 'openclam-20';

const OFFERS = {
  certified: {
    id: 'certified',
    label: 'Certified mail kit',
    blurb: 'If the contract wants written notice with a receipt.',
    q: 'certified+mail+kit',
  },
  envelopes: {
    id: 'envelopes',
    label: 'Business envelopes',
    blurb: 'Print it. Fold it. Mail it.',
    q: 'number+10+business+envelopes',
  },
  stamps: {
    id: 'stamps',
    label: 'Forever stamps',
    blurb: 'You send it. The stamp is on you.',
    q: 'forever+stamps',
  },
  paper: {
    id: 'paper',
    label: 'Printer paper',
    blurb: 'For the copy you keep and the one you mail.',
    q: 'printer+paper+letter',
  },
};

const FOOTER = ['certified', 'envelopes', 'stamps'];
const BY_SKU = {
  'gym-cancel': ['certified', 'envelopes'],
  complaint: ['certified', 'envelopes'],
  resignation: ['envelopes', 'stamps'],
  neighbor: ['envelopes', 'stamps'],
  apology: ['envelopes', 'stamps'],
  eulogy: ['paper', 'envelopes'],
  speech: ['paper'],
  diplomat: ['envelopes'],
};

export function amazonSearch(q) {
  return `https://www.amazon.com/s?k=${q}&tag=${encodeURIComponent(AMAZON_TAG)}`;
}

export function offersFor(sku) {
  const ids = BY_SKU[sku] || FOOTER;
  return ids.map((id) => OFFERS[id]);
}

export function footerOffers() {
  return FOOTER.map((id) => OFFERS[id]);
}
