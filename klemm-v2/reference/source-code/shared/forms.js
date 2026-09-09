/* Quiet dropdown: enhances every <div class="select"><select>…</select></div>.
   Keyboard: Enter/Space/ArrowDown open, arrows move, Enter picks, Esc closes. */
(function () {
  document.querySelectorAll('.select').forEach(function (wrap) {
    var sel = wrap.querySelector('select');
    if (!sel) return;
    var opts = Array.prototype.slice.call(sel.options);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'select-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    var label = document.createElement('span');
    var chev = document.createElement('span');
    chev.className = 'chev';
    btn.appendChild(label); btn.appendChild(chev);

    var list = document.createElement('ul');
    list.className = 'select-list';
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    opts.forEach(function (o, i) {
      if (o.value === '') return; // placeholder stays in the native select only
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.textContent = o.text;
      li.dataset.index = i;
      li.addEventListener('click', function () { pick(i); close(); btn.focus(); });
      list.appendChild(li);
    });

    function render() {
      var i = sel.selectedIndex;
      var placeholder = i < 0 || opts[i].value === '';
      label.textContent = placeholder ? (sel.dataset.placeholder || 'Choose one') : opts[i].text;
      label.className = placeholder ? 'placeholder' : '';
      Array.prototype.forEach.call(list.children, function (li) {
        li.setAttribute('aria-selected', Number(li.dataset.index) === i && !placeholder ? 'true' : 'false');
      });
    }
    function pick(i) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); render(); }
    function open() { list.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
    function close() { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); }

    btn.addEventListener('click', function () { list.hidden ? open() : close(); });
    btn.addEventListener('keydown', function (e) {
      var i = sel.selectedIndex;
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) open(); else pick(Math.min(i + 1, opts.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); pick(Math.max(i - 1, opts[0].value === '' ? 1 : 0)); }
      else if (e.key === 'Escape') { close(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); list.hidden ? open() : close(); }
    });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });

    wrap.classList.add('enhanced');
    wrap.appendChild(btn); wrap.appendChild(list);
    sel.tabIndex = -1;
    render();
  });
})();
