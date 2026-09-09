// Design-review behavior only. This file never submits, stores or emails form details.
(() => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#primary-nav');
  if (header && toggle && nav) {
    toggle.hidden = false;
    document.body.classList.add('nav-ready');
    const close = () => {
      header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Menu +';
    };
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close −' : 'Menu +';
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && header.classList.contains('nav-open')) { close(); toggle.focus(); }
    });
    document.addEventListener('click', event => { if (!header.contains(event.target)) close(); });
    header.addEventListener('focusout', () => requestAnimationFrame(() => { if (!header.contains(document.activeElement)) close(); }));
    matchMedia('(min-width:1101px)').addEventListener('change', close);
  }
  document.querySelectorAll('form[data-preview]').forEach((form, formIndex) => {
    const button = form.querySelector('button[type=submit]');
    const inputs = [...form.querySelectorAll('input,select,textarea')].filter(input => input.type !== 'hidden' && input.name !== '_gotcha');
    const status = document.createElement('p');
    status.className = 'preview-status';
    status.hidden = true;
    status.setAttribute('role', 'status');
    form.append(status);
    const notes = new Map();
    inputs.forEach((input, index) => {
      const id = input.id || `preview-${formIndex}-${index}`;
      input.id = id;
      const note = document.createElement('span');
      note.id = `${id}-error`;
      note.className = 'field-error';
      note.hidden = true;
      input.after(note);
      notes.set(input, note);
      input.setAttribute('aria-describedby', [input.getAttribute('aria-describedby'), note.id].filter(Boolean).join(' '));
      input.addEventListener('input', () => { status.hidden = true; if (input.hasAttribute('aria-invalid')) validate(input); });
      input.addEventListener('change', () => { status.hidden = true; if (input.hasAttribute('aria-invalid')) validate(input); });
      input.addEventListener('blur', () => { if (input.value.trim() || input.hasAttribute('aria-invalid')) validate(input); });
    });
    function validate(input) {
      let message = '';
      if (input.type === 'email') input.value = input.value.trim();
      if (input.required && !input.value.trim()) message = input.type === 'email' ? 'Please enter your email address.' : 'Please complete this field.';
      else if (input.type === 'email' && input.value) message = window.klemmEmailError(input.value);
      else if (!input.validity.valid) message = input.validationMessage;
      const note = notes.get(input);
      note.textContent = message;
      note.hidden = !message;
      if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      return !message;
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      const invalid = inputs.filter(input => !validate(input));
      if (invalid.length) { status.hidden = true; invalid[0].focus(); return; }
      status.textContent = 'Preview checked. Nothing has been sent or saved; your details remain only in this form.';
      status.hidden = false;
    });
    form.noValidate = true;
    if (button) button.disabled = false;
  });
})();
