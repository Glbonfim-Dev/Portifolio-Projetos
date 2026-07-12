document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const navLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getHeaderOffset = () => (header ? header.offsetHeight + 14 : 100);

  function setActiveLink(id) {
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', event => {
      const selector = link.getAttribute('href');
      const target = document.querySelector(selector);
      if (!target) return;

      event.preventDefault();
      const targetTop = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
      window.scrollTo({ top: targetTop, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', selector);
    });
  });

  if ('IntersectionObserver' in window) {
    const activeSectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    }, {
      rootMargin: `-${getHeaderOffset()}px 0px -45% 0px`,
      threshold: 0.15
    });

    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    sections.forEach(section => {
      section.classList.add('reveal');
      activeSectionObserver.observe(section);
      revealObserver.observe(section);
    });
  }

  const photo = document.querySelector('img.lazy.about-photo');
  if (photo?.dataset.src) {
    const loadPhoto = () => {
      photo.addEventListener('load', () => {
        photo.classList.add('loaded');
        photo.classList.remove('blur');
      }, { once: true });
      photo.src = photo.dataset.src;
    };

    if ('IntersectionObserver' in window) {
      const photoObserver = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        loadPhoto();
        photoObserver.disconnect();
      }, { rootMargin: '120px 0px', threshold: 0.01 });
      photoObserver.observe(photo);
    } else {
      loadPhoto();
    }
  }

  const carousel = document.getElementById('projectsCarousel');
  if (carousel) {
    const track = carousel.querySelector('.projects-carousel__track');
    const viewport = carousel.querySelector('.projects-carousel__viewport');
    const slides = Array.from(carousel.querySelectorAll('.project-slide'));
    const previousButton = carousel.querySelector('[data-carousel-prev]');
    const nextButton = carousel.querySelector('[data-carousel-next]');
    const currentLabel = carousel.querySelector('[data-carousel-current]');
    const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]'));
    let currentIndex = 0;
    let pointerStart = null;
    let suppressClick = false;

    function showProject(index) {
      if (!track || !slides.length) return;
      currentIndex = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === currentIndex;
        slide.setAttribute('aria-hidden', String(!active));
        slide.tabIndex = active ? 0 : -1;
      });

      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === currentIndex;
        dot.classList.toggle('is-active', active);
        if (active) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });

      if (currentLabel) currentLabel.textContent = String(currentIndex + 1);
    }

    previousButton?.addEventListener('click', () => showProject(currentIndex - 1));
    nextButton?.addEventListener('click', () => showProject(currentIndex + 1));
    dots.forEach(dot => {
      dot.addEventListener('click', () => showProject(Number(dot.dataset.carouselDot)));
    });

    carousel.tabIndex = 0;
    carousel.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showProject(currentIndex - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showProject(currentIndex + 1);
      }
    });

    viewport?.addEventListener('pointerdown', event => {
      pointerStart = event.clientX;
    });

    viewport?.addEventListener('pointerup', event => {
      if (pointerStart === null) return;
      const movement = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(movement) < 45) return;

      suppressClick = true;
      showProject(currentIndex + (movement < 0 ? 1 : -1));
      window.setTimeout(() => { suppressClick = false; }, 0);
    });

    viewport?.addEventListener('pointercancel', () => {
      pointerStart = null;
    });

    slides.forEach(slide => {
      slide.addEventListener('click', event => {
        if (suppressClick) event.preventDefault();
      });
    });

    showProject(0);
  }

  const form = document.getElementById('formContato');
  const modal = document.getElementById('modalPreview');
  const resposta = document.getElementById('resposta');
  const nome = document.getElementById('nome');
  const email = document.getElementById('email');
  const mensagem = document.getElementById('mensagem');
  const clearButton = document.getElementById('clearForm');
  const cancelButton = document.getElementById('cancelPreview');
  const confirmButton = document.getElementById('confirmPreview');
  let formData = null;

  if (!form || !modal || !nome || !email || !mensagem) return;

  function showResponse(text, type = 'info') {
    if (!resposta) return;
    resposta.textContent = text;
    resposta.className = `response response--${type}`;
    resposta.removeAttribute('hidden');
    resposta.setAttribute('aria-hidden', 'false');
  }

  function hideResponse() {
    if (!resposta) return;
    resposta.textContent = '';
    resposta.setAttribute('hidden', '');
    resposta.setAttribute('aria-hidden', 'true');
  }

  function validateForm() {
    const fields = [nome, email, mensagem];
    fields.forEach(field => field.classList.remove('field-invalid', 'field-valid'));

    const nomeValido = nome.value.trim().split(/\s+/).length >= 2;
    const emailValido = email.checkValidity();
    const mensagemValida = mensagem.value.trim().length >= 15;

    nome.classList.add(nomeValido ? 'field-valid' : 'field-invalid');
    email.classList.add(emailValido ? 'field-valid' : 'field-invalid');
    mensagem.classList.add(mensagemValida ? 'field-valid' : 'field-invalid');

    return nomeValido && emailValido && mensagemValida;
  }

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    confirmButton?.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    hideResponse();

    if (!validateForm()) {
      showResponse('Informe nome e sobrenome, um e-mail válido e uma mensagem com pelo menos 15 caracteres.', 'error');
      form.querySelector('.field-invalid')?.focus();
      return;
    }

    formData = {
      nome: nome.value.trim(),
      email: email.value.trim(),
      mensagem: mensagem.value.trim()
    };

    document.getElementById('previewNome').textContent = formData.nome;
    document.getElementById('previewEmail').textContent = formData.email;
    document.getElementById('previewMensagem').textContent = formData.mensagem;
    openModal();
  });

  clearButton?.addEventListener('click', () => {
    form.reset();
    form.querySelectorAll('.field-invalid, .field-valid').forEach(field => {
      field.classList.remove('field-invalid', 'field-valid');
    });
    hideResponse();
    nome.focus();
  });

  cancelButton?.addEventListener('click', closeModal);

  confirmButton?.addEventListener('click', () => {
    if (!formData) return;
    const subject = encodeURIComponent(`Contato pelo portfólio - ${formData.nome}`);
    const body = encodeURIComponent(`Nome: ${formData.nome}\nE-mail: ${formData.email}\n\n${formData.mensagem}`);
    closeModal();
    window.location.href = `mailto:glbonfim21@gmail.com?subject=${subject}&body=${body}`;
    showResponse('Seu aplicativo de e-mail foi aberto com a mensagem preparada.', 'success');
  });

  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  hideResponse();
});
