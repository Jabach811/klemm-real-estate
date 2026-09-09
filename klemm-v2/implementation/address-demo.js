// Explicit local design demo only; these are fictional fixtures, not address results.
if (new URLSearchParams(location.search).get('address-demo') === '1') {
  const examples = [
    { street: '123 Example Lane', city: 'Tracy', state: 'CA', zip: '95376' },
    { street: '123 Example Court', city: 'Mountain House', state: 'CA', zip: '95391' },
    { street: '456 Sample Avenue', city: 'Manteca', state: 'CA', zip: '95337' }
  ].map(item => ({...item, label: `${item.street}, ${item.city}, ${item.state} ${item.zip}`}));
  window.klemmAddressProvider = {
    async suggest(query) {
      return examples.filter(item => item.label.toLowerCase().includes(query.trim().toLowerCase()));
    }
  };
  document.addEventListener('DOMContentLoaded', () => {
    const note = document.createElement('p');
    note.className = 'preview-status';
    note.textContent = 'Address interaction demo — fictional examples only. Type 123 or 456 in either address field. Live address lookup is not connected.';
    document.querySelector('.valuation-form').prepend(note);
  });
}
