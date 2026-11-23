(() => {
  const dialog = document.querySelector('#tour-quiz');
  const form = dialog.querySelector('form');
  const panels = [...form.querySelectorAll('fieldset.quiz-step')];
  const meter = dialog.querySelector('progress');
  const counter = dialog.querySelector('.quiz-count');
  const back = form.querySelector('.quiz-back');
  const next = form.querySelector('.quiz-next');
  const submit = form.querySelector('[type="submit"]');
  const toggle = form.querySelector('.quiz-channel-toggle');
  const channels = form.querySelector('.quiz-channels');
  const handle = form.elements.messengerContact;
  const quantity = form.elements.guests;
  const slider = form.querySelector('[type="range"]');
  let step = 0;

  function showStep(index) {
    step = index;
    panels.forEach((panel, i) => panel.hidden = i !== step);
    counter.textContent = 'Шаг ' + (step + 1) + ' из ' + panels.length;
    meter.value = step;
    back.hidden = step === 0;
    next.hidden = step === panels.length - 1;
    submit.hidden = !next.hidden;
    dialog.scrollTop = 0;
    panels[step].querySelector('legend').focus({preventScroll:true});
  }

  function advance() {
    for (const input of panels[step].querySelectorAll('input')) {
      if (!input.reportValidity()) return;
    }
    showStep(step + 1);
  }

  function updateChannel() {
    const channel = form.elements.channel.value;
    const needsHandle = ['Telegram', 'VK', 'WeChat'].includes(channel);
    handle.disabled = !needsHandle;
    handle.parentElement.hidden = !needsHandle;
    handle.parentElement.querySelector('span').textContent = 'Ваш контакт в ' + channel;
    handle.placeholder = channel === 'Telegram' ? '@username' : 'Имя пользователя или ссылка';
  }

  for (const link of document.querySelectorAll('[data-quiz]')) {
    link.addEventListener('click', event => {
      event.preventDefault();
      if (submit.disabled) { dialog.showModal(); return; }
      form.querySelector('nav').hidden = false;
      form.reset();
      form.querySelector('.booking-status').textContent = '';
      channels.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      form.elements.format.value = link.dataset.format || '';
      form.elements.source.value = link.dataset.quiz;
      slider.value = quantity.value;
      updateChannel();
      dialog.showModal();
      showStep(0);
    });
  }
  slider.addEventListener('input', () => { quantity.value = slider.value; });
  quantity.addEventListener('input', () => { if (quantity.value) slider.value = quantity.value; });
  back.addEventListener('click', () => showStep(step - 1));
  next.addEventListener('click', advance);
  dialog.querySelector('.quiz-close').addEventListener('click', () => dialog.close());
  toggle.addEventListener('click', () => {
    channels.hidden = !channels.hidden;
    toggle.setAttribute('aria-expanded', String(!channels.hidden));
    if (channels.hidden) form.elements.channel.value = 'Телефон';
    updateChannel();
  });
  channels.addEventListener('change', updateChannel);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (step < panels.length - 1) return advance();
    if (!form.reportValidity()) return;
    if (await sendBooking(form)) {
      panels[step].hidden = true;
      form.querySelector('nav').hidden = true;
      meter.value = panels.length;
      counter.textContent = 'Заявка принята';
    }
  });
})();
