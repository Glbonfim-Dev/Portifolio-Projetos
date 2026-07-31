// Espera o HTML carregar antes de procurar elementos na página.
document.addEventListener('DOMContentLoaded', () => {
  // Elementos usados na navegação e nas animações das seções.
  const header = document.querySelector('.site-header');
  const navLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Calcula o espaço ocupado pelo cabeçalho fixo.
  const getHeaderOffset = () => (header ? header.offsetHeight + 14 : 100);

  // Destaca no menu o link da seção que está visível.
  function setActiveLink(id) {
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  }

  // Faz a rolagem suave ao clicar em um item do menu.
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

  // Observa as seções para atualizar o menu e mostrar animações.
  if ('IntersectionObserver' in window) {
    // Identifica qual seção está aparecendo na tela.
    const activeSectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    }, {
      rootMargin: `-${getHeaderOffset()}px 0px -45% 0px`,
      threshold: 0.15
    });

    // Revela cada seção somente na primeira vez em que ela aparece.
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    // Ativa os dois observadores em todas as seções principais.
    sections.forEach(section => {
      section.classList.add('reveal');
      activeSectionObserver.observe(section);
      revealObserver.observe(section);
    });
  }

  // Carrega uma foto configurada com data-src quando ela se aproxima da tela.
  const photo = document.querySelector('img.lazy.about-photo');
  if (photo?.dataset.src) {
    // Troca o endereço temporário pelo endereço real da foto.
    const loadPhoto = () => {
      photo.addEventListener('load', () => {
        photo.classList.add('loaded');
        photo.classList.remove('blur');
      }, { once: true });
      photo.src = photo.dataset.src;
    };

    // Usa carregamento por aproximação quando o navegador oferece suporte.
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

  // Busca os elementos que formam o carrossel de projetos.
  const carousel = document.getElementById('projectsCarousel');
  if (carousel) {
    const track = carousel.querySelector('.projects-carousel__track');
    const viewport = carousel.querySelector('.projects-carousel__viewport');
    const slides = Array.from(carousel.querySelectorAll('.project-slide'));
    const previousButton = carousel.querySelector('[data-carousel-prev]');
    const nextButton = carousel.querySelector('[data-carousel-next]');
    const currentLabel = carousel.querySelector('[data-carousel-current]');
    const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]'));
    // Guarda a posição atual e os dados usados no gesto de arrastar.
    let currentIndex = 0;
    let pointerStart = null;
    let suppressClick = false;

    // Exibe um projeto e atualiza os controles do carrossel.
    function showProject(index) {
      if (!track || !slides.length) return;
      // Move a faixa horizontal até o projeto escolhido.
      currentIndex = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      // Deixa somente o projeto atual disponível para leitores de tela e teclado.
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === currentIndex;
        slide.setAttribute('aria-hidden', String(!active));
        slide.tabIndex = active ? 0 : -1;
      });

      // Marca o ponto de navegação correspondente ao projeto atual.
      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === currentIndex;
        dot.classList.toggle('is-active', active);
        if (active) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });

      // Atualiza o número mostrado no contador.
      if (currentLabel) currentLabel.textContent = String(currentIndex + 1);
    }

    // Permite navegar pelas setas e pelos pontos.
    previousButton?.addEventListener('click', () => showProject(currentIndex - 1));
    nextButton?.addEventListener('click', () => showProject(currentIndex + 1));
    dots.forEach(dot => {
      dot.addEventListener('click', () => showProject(Number(dot.dataset.carouselDot)));
    });

    // Permite navegar usando as setas esquerda e direita do teclado.
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

    // Registra onde o gesto de arrastar começou.
    viewport?.addEventListener('pointerdown', event => {
      pointerStart = event.clientX;
    });

    // Troca o projeto quando o arrasto passa de 45 pixels.
    viewport?.addEventListener('pointerup', event => {
      if (pointerStart === null) return;
      const movement = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(movement) < 45) return;

      // Evita abrir o PDF sem querer logo depois de arrastar.
      suppressClick = true;
      showProject(currentIndex + (movement < 0 ? 1 : -1));
      window.setTimeout(() => { suppressClick = false; }, 0);
    });

    // Cancela o gesto quando o navegador interrompe o ponteiro.
    viewport?.addEventListener('pointercancel', () => {
      pointerStart = null;
    });

    // Bloqueia o clique acidental causado pelo fim do arrasto.
    slides.forEach(slide => {
      slide.addEventListener('click', event => {
        if (suppressClick) event.preventDefault();
      });
    });

    // Inicia o carrossel mostrando o primeiro projeto.
    showProject(0);
  }

  // Elementos usados pelo formulário e pela janela de revisão.
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

  // Interrompe esta parte caso algum elemento obrigatório não exista.
  if (!form || !modal || !nome || !email || !mensagem) return;

  // Mostra uma mensagem de informação, sucesso ou erro.
  function showResponse(text, type = 'info') {
    if (!resposta) return;
    resposta.textContent = text;
    resposta.className = `response response--${type}`;
    resposta.removeAttribute('hidden');
    resposta.setAttribute('aria-hidden', 'false');
  }

  // Limpa e esconde a mensagem exibida abaixo do formulário.
  function hideResponse() {
    if (!resposta) return;
    resposta.textContent = '';
    resposta.setAttribute('hidden', '');
    resposta.setAttribute('aria-hidden', 'true');
  }

  // Confere nome completo, e-mail válido e tamanho mínimo da mensagem.
  function validateForm() {
    const fields = [nome, email, mensagem];
    fields.forEach(field => field.classList.remove('field-invalid', 'field-valid'));

    const nomeValido = nome.value.trim().split(/\s+/).length >= 2;
    const emailValido = email.checkValidity();
    const mensagemValida = mensagem.value.trim().length >= 15;

    // Aplica uma cor visual de válido ou inválido em cada campo.
    nome.classList.add(nomeValido ? 'field-valid' : 'field-invalid');
    email.classList.add(emailValido ? 'field-valid' : 'field-invalid');
    mensagem.classList.add(mensagemValida ? 'field-valid' : 'field-invalid');

    return nomeValido && emailValido && mensagemValida;
  }

  // Abre a janela de revisão e impede a rolagem do fundo.
  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    confirmButton?.focus();
  }

  // Fecha a janela de revisão e libera a rolagem da página.
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Valida o formulário e prepara a prévia da mensagem.
  form.addEventListener('submit', event => {
    event.preventDefault();
    hideResponse();

    if (!validateForm()) {
      showResponse('Informe nome e sobrenome, um e-mail válido e uma mensagem com pelo menos 15 caracteres.', 'error');
      form.querySelector('.field-invalid')?.focus();
      return;
    }

    // Guarda os valores sem espaços extras no começo ou no final.
    formData = {
      nome: nome.value.trim(),
      email: email.value.trim(),
      mensagem: mensagem.value.trim()
    };

    // Copia os dados para a janela de revisão.
    document.getElementById('previewNome').textContent = formData.nome;
    document.getElementById('previewEmail').textContent = formData.email;
    document.getElementById('previewMensagem').textContent = formData.mensagem;
    openModal();
  });

  // Limpa todos os campos e estados de validação.
  clearButton?.addEventListener('click', () => {
    form.reset();
    form.querySelectorAll('.field-invalid, .field-valid').forEach(field => {
      field.classList.remove('field-invalid', 'field-valid');
    });
    hideResponse();
    nome.focus();
  });

  // Volta ao formulário para permitir novas alterações.
  cancelButton?.addEventListener('click', closeModal);

  // Monta o link mailto e abre o aplicativo de e-mail do usuário.
  confirmButton?.addEventListener('click', () => {
    if (!formData) return;
    const subject = encodeURIComponent(`Contato pelo portfólio - ${formData.nome}`);
    const body = encodeURIComponent(`Nome: ${formData.nome}\nE-mail: ${formData.email}\n\n${formData.mensagem}`);
    closeModal();
    window.location.href = `mailto:glbonfim21@gmail.com?subject=${subject}&body=${body}`;
    showResponse('Seu aplicativo de e-mail foi aberto com a mensagem preparada.', 'success');
  });

  // Fecha a janela quando o usuário clica na área escura ao redor.
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });

  // Também permite fechar a janela com a tecla Esc.
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // Garante que nenhuma mensagem antiga apareça ao abrir a página.
  hideResponse();
});
