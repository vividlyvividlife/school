(function (window, document) {
  'use strict';

  function printWork(id) {
    var work = document.querySelector('[data-work="' + id + '"], [data-assign-work="' + id + '"]');
    if (!work) return;

    var details = work.tagName === 'DETAILS' ? work : work.querySelector('details');
    var wasOpen = details ? details.open : false;
    if (details) details.open = true;

    var section = work.closest('.bel-works, .bel-extra');
    var cat = work.closest('.bel-cat');
    var cls = work.closest('.bel-class');
    var body = document.body;

    body.classList.add('printing-bel', 'printing-work');
    work.classList.add('is-print-target');
    if (section) section.classList.add('is-print-target');
    if (cat) cat.classList.add('is-print-target');
    if (cls) cls.classList.add('is-print-target');

    var cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      body.classList.remove('printing-bel', 'printing-work');
      document.querySelectorAll('.is-print-target').forEach(function (el) {
        el.classList.remove('is-print-target');
      });
      if (details) details.open = wasOpen;
      window.removeEventListener('afterprint', cleanup);
    }

    window.addEventListener('afterprint', cleanup);
    window.print();
    window.setTimeout(cleanup, 1500);
  }

  document.querySelectorAll('[data-print-work]').forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      printWork(btn.getAttribute('data-print-work'));
    });
  });

  document.querySelectorAll('[data-print-hub-class]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var grade = btn.getAttribute('data-print-hub-class');
      var sheet = document.querySelector('.hub-print [data-hub-print="' + grade + '"]');
      if (!sheet) return;
      var body = document.body;
      sheet.classList.add('is-print-target');
      body.classList.add('printing-bel', 'printing-class', 'printing-hub-class');

      var cleaned = false;
      function cleanup() {
        if (cleaned) return;
        cleaned = true;
        body.classList.remove('printing-bel', 'printing-class', 'printing-hub-class');
        sheet.classList.remove('is-print-target');
        window.removeEventListener('afterprint', cleanup);
      }

      window.addEventListener('afterprint', cleanup);
      window.print();
      window.setTimeout(cleanup, 1500);
    });
  });

})(window, document);
