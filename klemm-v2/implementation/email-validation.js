// Syntax checks only: an address passing this check is not proof of delivery.
(function (root) {
  function emailError(value) {
    const email = String(value).trim();
    if (!email) return 'Please enter your email address.';
    const parts = email.split('@');
    const message = 'Please enter a complete email address, such as name@example.com.';
    if (parts.length !== 2 || email.length > 254) return message;
    const [local, domain] = parts;
    // Standard unquoted mailbox format supported by our email input.
    if (!local || local.length > 64 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)
      || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return message;
    const labels = domain.split('.');
    if (labels.length < 2 || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))
      || !/^(?:[a-z]{2,63}|xn--[a-z0-9-]+)$/i.test(labels[labels.length - 1])) return message;
    return '';
  }
  root.klemmEmailError = emailError;
  if (typeof module !== 'undefined' && module.exports) module.exports = emailError;
})(typeof window !== 'undefined' ? window : globalThis);
