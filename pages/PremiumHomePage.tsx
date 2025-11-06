
import React, { useRef, useEffect } from 'react';
import '../App.css'; // For general app styles like body font
import './PremiumHomePage.css'; // Specific styles for this page
import { ModuleInfo } from '../types';

interface PremiumHomePageProps {
  onSelectModule: (moduleKey: string) => void;
}

const PremiumHomePage: React.FC<PremiumHomePageProps> = ({ onSelectModule }) => {
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  const modules: ModuleInfo[] = [
    {
      name: "TravelMundo IA",
      icon: "🌍",
      desc: "Crie fotos cinematográficas e edite imagens ao redor do mundo.",
      link: "travel-mundo-ia",
      isInternal: true,
    },
    {
      name: "StyleMundo IA",
      icon: "👗",
      desc: "Obtenha conselhos de estilo e crie ensaios fotográficos virtuais.",
      link: "style-mundo-ia",
      isInternal: true,
    },
    {
      name: "SportMundo IA",
      icon: "⚽",
      desc: "Gere fotos cinematográficas e realistas de atletas e cenas esportivas.",
      link: "sport-mundo-ia",
      isInternal: true,
    },
    {
      name: "LifeMundo IA",
      icon: "🚗",
      desc: "Explore estilo de vida: carros, motos, balões e aventuras com informações de mapas.",
      link: "life-mundo-ia",
      isInternal: true,
    },
  ];

  // Implement the tilt effect using React refs and event listeners
  useEffect(() => {
    const damp = 14;

    const handleMouseMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const b = card.getBoundingClientRect();
      const x = e.clientX - b.left;
      const y = e.clientY - b.top;
      const rx = ((y - b.height / 2) / damp);
      const ry = ((x - b.width / 2) / -damp);
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      card.style.transform = '';
    };

    cardRefs.current.forEach(card => {
      if (card) {
        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseleave', handleMouseLeave);
      }
    });

    return () => {
      cardRefs.current.forEach(card => {
        if (card) {
          card.removeEventListener('mousemove', handleMouseMove);
          card.removeEventListener('mouseleave', handleMouseLeave);
        }
      });
    };
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, submitting the form will just open the TravelMundo module
    // This can be expanded with real form handling later
    onSelectModule('travel-mundo-ia');
  };

  return (
    <div className="tm-wrapper" aria-label="Tela inicial TravelMundo IA">

      {/* top bar */}
      <header className="tm-top">
        <div className="tm-logo">TravelMundo <span>IA</span></div>
        <nav className="tm-nav" aria-label="Navegação">
          <a href="#recursos">Recursos</a>
          <a href="#precos">Preços</a>
        </nav>
      </header>

      {/* hero */}
      <div className="tm-hero">
        <h1>Crie fotos de viagem <br/><span className="tm-gradient">Incríveis com IA</span></h1>
        <p className="tm-sub">Gere fotos profissionais suas em qualquer lugar do mundo sem sair de casa</p>

        <div className="tm-form-container">
          <form onSubmit={handleFormSubmit}>
              <input type="text" placeholder="Seu nome" aria-label="Seu nome" required />
              <input type="email" placeholder="Seu melhor e-mail" aria-label="Seu melhor e-mail" required />
              <button type="submit" className="tm-btn">Começar Grátis - Ganhe 3 Créditos</button>
          </form>
        </div>
      </div>

      {/* grid módulos */}
      <section className="tm-grid" aria-label="Módulos TravelMundo IA">
        {modules.map((m, index) => (
          <article
            key={index}
            className="tm-card"
            ref={el => void (cardRefs.current[index] = el)}
            onClick={() => onSelectModule(m.link)}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectModule(m.link)}
          >
            <div className="tm-ico" aria-hidden="true">{m.icon}</div>
            <h3>{m.name}</h3>
            <p>{m.desc}</p>
            <button className="tm-btn tm-btn-full" aria-label={`Abrir ${m.name}`} tabIndex={-1}>Abrir</button>
          </article>
        ))}
      </section>

      {/* rodapé compacto */}
      <footer className="tm-foot">
        © 2025 <strong>TravelMundo IA</strong> • Desenvolvido por Fabricio Menezes
      </footer>
    </div>
  );
};

export default PremiumHomePage;
