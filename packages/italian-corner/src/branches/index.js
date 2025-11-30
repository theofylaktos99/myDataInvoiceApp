// Italian Corner - All branches
import central from './italianCorner.js';
import villaAlexandros from './villaAlexandros.js';
import villa3As from './villa3As.js';

export const BRANCHES = {
  central: central,
  villa1: villaAlexandros,
  villa2: villa3As,
};

export const CLIENT_CONFIG = {
  name: 'Italian Corner',
  appId: 'com.italiancorner.invoice',
  productName: 'Italian Corner Invoice',
  description: 'Italian Corner Invoice Management System',
  github: {
    owner: 'theofylaktos99',
    repo: 'myDataInvoiceApp',
  },
};

export default BRANCHES;
