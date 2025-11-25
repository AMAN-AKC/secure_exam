import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';

export default function Landing() {
  const countersStarted = useRef(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const formatNumber = (value, decimals) => {
      if (decimals && decimals > 0) {
        return Number(value).toFixed(decimals);
      }
      return new Intl.NumberFormat().format(Math.round(value));
    };

    const animateCount = (el) => {
      const targetRaw = el.dataset.target;
      if (!targetRaw) return;
      const suffix = el.dataset.suffix || '';
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
      const target = parseFloat(targetRaw);
      if (isNaN(target)) {
        el.textContent = el.dataset.target;
        return;
      }
      if (prefersReduced) {
        el.textContent = formatNumber(target, decimals) + suffix;
        return;
      }
      const duration = 1200;
      let startTime = null;
      const step = (ts) => {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const eased = easeOutCubic(progress);
        const current = target * eased;
        el.textContent = formatNumber(current, decimals) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const handleReveal = (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        // if stats section revealed, start counters
        if (entry.target.classList && entry.target.classList.contains('landing-stats') && !countersStarted.current) {
          countersStarted.current = true;
          const nums = entry.target.querySelectorAll('.stat-number');
          nums.forEach((n) => animateCount(n));
        }
        obs.unobserve(entry.target);
      });
    };

    const reveals = document.querySelectorAll('.reveal');
    if (prefersReduced) {
      reveals.forEach((r) => r.classList.add('revealed'));
      // Immediately set final counter values
      const nums = document.querySelectorAll('.stat-number');
      nums.forEach((n) => {
        const t = n.dataset.target;
        const d = n.dataset.decimals ? parseInt(n.dataset.decimals, 10) : 0;
        const s = n.dataset.suffix || '';
        if (t) n.textContent = (d ? Number(t).toFixed(d) : new Intl.NumberFormat().format(Math.round(Number(t)))) + s;
      });
      return undefined;
    }

    const observer = new IntersectionObserver(handleReveal, { threshold: 0.12 });
    reveals.forEach((r) => observer.observe(r));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-wrapper">
      {/* Hero Section */}
      <section className="landing-hero reveal">
        <div className="landing-hero-content">
          <div className="landing-hero-text">
            <h1 className="landing-title">SecureExam</h1>
            <p className="landing-subtitle">Professional Online Examination Platform</p>
            <p className="landing-description">
              Enterprise-grade secure examination system designed for modern educational institutions. 
              Create, manage, and conduct exams with bank-level security, real-time monitoring, and comprehensive analytics.
            </p>
            <div className="landing-cta-group">
              <Link to="/login">
                <Button variant="primary" size="large" className="landing-cta-btn">
                  🚀 Take Exam
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="large" className="landing-cta-btn">
                  🔐 Login
                </Button>
              </Link>
            </div>
          </div>
          <div className="landing-hero-visual">
            <div className="landing-icon-large">📝</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features reveal">
        <h2>Why Choose SecureExam?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Bank-Level Security</h3>
            <p>End-to-end encrypted exam questions with blockchain-based tamper detection. Your data is always protected.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Lightning Fast</h3>
            <p>Optimized performance with minimal latency. Smooth experience even with thousands of concurrent test takers.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Flexible Scheduling</h3>
            <p>Fixed schedule or flexible timing options. Support for both proctored and unproctored exams with customizable rules.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Comprehensive Analytics</h3>
            <p>Detailed performance reports, question analysis, and student progress tracking. Make data-driven decisions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Fully Responsive</h3>
            <p>Seamless experience across all devices. Desktop, tablet, or mobile - always perfectly optimized.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Global Ready</h3>
            <p>Support for multiple timezones, languages, and question formats. Perfect for international institutions.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing-how-it-works reveal">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Teachers Create Exams</h3>
              <p>Design comprehensive exams with multiple question types, custom scoring, and advanced settings.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Admin Approves</h3>
              <p>Review and approve exams before they go live. Maintain quality control and ensure compliance.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Students Register</h3>
              <p>Students browse available exams and register for those they want to take.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Take Exam</h3>
              <p>Secure exam environment with encrypted questions, timed sessions, and anti-cheating measures.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h3>Get Results</h3>
              <p>Instant or scheduled results with detailed feedback and performance analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="landing-stats reveal">
        <div className="stats-container">
          <h2 className="stats-title">Trusted By Educators Worldwide</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number" data-target="10000" data-suffix="+">0</div>
              <p className="stat-label">Active Institutions</p>
            </div>
            <div className="stat-item">
              <div className="stat-number" data-target="500000" data-suffix="+">0</div>
              <p className="stat-label">Exams Conducted</p>
            </div>
            <div className="stat-item">
              <div className="stat-number" data-target="99.9" data-decimals="1" data-suffix="%">0</div>
              <p className="stat-label">Uptime SLA</p>
            </div>
            <div className="stat-item">
              <div className="stat-number" data-target="2000000" data-suffix="+">0</div>
              <p className="stat-label">Students Tested</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta-section reveal">
        <div className="landing-cta-content">
          <h2>Ready to Transform Your Exams?</h2>
          <p>Join thousands of institutions using SecureExam for reliable, secure online assessments.</p>
          <div className="landing-cta-buttons">
            <Link to="/login">
              <Button variant="primary" size="large">
                🔐 Secure Dashboard
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="large">
                📋 Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section className="landing-footer reveal">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About SecureExam</h4>
            <p>The premier platform for secure, scalable online examinations trusted by educational institutions worldwide. Enterprise security meets intuitive design.</p>
          </div>
          <div className="footer-section">
            <h4>Features</h4>
            <ul>
              <li><a href="#features">🔒 Security</a></li>
              <li><a href="#features">📊 Analytics</a></li>
              <li><a href="#features">🎯 Scheduling</a></li>
              <li><a href="#features">📋 Reporting</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#security">Security</a></li>
              <li><a href="#contact">Contact Support</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Get In Touch</h4>
            <p>📧 support@secureexam.com</p>
            <p>☎️ +1 (555) 123-4567</p>
            <p>🕐 Available 24/7</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 SecureExam. All rights reserved. Built with ❤️ for education.</p>
        </div>
      </section>
    </div>
  );
}
