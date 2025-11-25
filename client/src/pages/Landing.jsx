import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import './Landing.css';

export default function Landing() {
  const countersStarted = useRef(false);
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

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
              <Link to="/register">
                <Button variant="primary" size="large" className="landing-cta-btn">
                  🚀 Get Started
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
            <div className="feature-icon">💻</div>
            <h3>Modern Interface</h3>
            <p>Clean, intuitive design built with modern web technologies. Easy to navigate and use for all user roles.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Global Ready</h3>
            <p>Support for multiple timezones and question formats. Perfect for educational institutions worldwide.</p>
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

      {/* FAQ Section */}
      <section className="landing-faq reveal">
        <div className="faq-container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            <div className={`faq-item ${openFaq === 0 ? 'active' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(0)}>
                <h3>How secure is the SecureExam platform?</h3>
                <span className="faq-icon">{openFaq === 0 ? '−' : '+'}</span>
              </div>
              {openFaq === 0 && (
                <div className="faq-answer">
                  <p>SecureExam uses bank-level encryption for all exam data. Questions are encrypted end-to-end, and we employ blockchain-based tamper detection to ensure exam integrity. All data is stored securely with regular security audits and compliance with international data protection standards.</p>
                </div>
              )}
            </div>

            <div className={`faq-item ${openFaq === 1 ? 'active' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(1)}>
                <h3>Can students take exams on mobile devices?</h3>
                <span className="faq-icon">{openFaq === 1 ? '−' : '+'}</span>
              </div>
              {openFaq === 1 && (
                <div className="faq-answer">
                  <p>Yes! SecureExam is fully responsive and optimized for all devices including desktops, tablets, and smartphones. Students can take exams from any device with a modern web browser and internet connection.</p>
                </div>
              )}
            </div>

            <div className={`faq-item ${openFaq === 2 ? 'active' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(2)}>
                <h3>What types of questions can I create?</h3>
                <span className="faq-icon">{openFaq === 2 ? '−' : '+'}</span>
              </div>
              {openFaq === 2 && (
                <div className="faq-answer">
                  <p>Teachers can create multiple-choice questions, true/false, short answer, essay questions, and more. Our platform supports rich text formatting, images, and various question formats to suit different assessment needs.</p>
                </div>
              )}
            </div>

            <div className={`faq-item ${openFaq === 3 ? 'active' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(3)}>
                <h3>How does the approval process work?</h3>
                <span className="faq-icon">{openFaq === 3 ? '−' : '+'}</span>
              </div>
              {openFaq === 3 && (
                <div className="faq-answer">
                  <p>After teachers create an exam, it goes to the admin dashboard for review. Admins can preview the exam, check questions, and either approve or request modifications. Once approved, the exam becomes available for student registration.</p>
                </div>
              )}
            </div>

            <div className={`faq-item ${openFaq === 4 ? 'active' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(4)}>
                <h3>Can I schedule exams for specific dates and times?</h3>
                <span className="faq-icon">{openFaq === 4 ? '−' : '+'}</span>
              </div>
              {openFaq === 4 && (
                <div className="faq-answer">
                  <p>Absolutely! You can set specific start and end dates/times for exams. The platform supports both fixed schedules and flexible timing windows. You can also set time limits per exam and configure timezone settings for international students.</p>
                </div>
              )}
            </div>

            <div className={`faq-item ${openFaq === 5 ? 'active' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(5)}>
                <h3>What kind of analytics and reports are available?</h3>
                <span className="faq-icon">{openFaq === 5 ? '−' : '+'}</span>
              </div>
              {openFaq === 5 && (
                <div className="faq-answer">
                  <p>SecureExam provides comprehensive analytics including individual student performance, question-level statistics, time spent on each question, pass/fail rates, score distributions, and more. You can export reports in various formats for further analysis.</p>
                </div>
              )}
            </div>

            <div className={`faq-item ${openFaq === 6 ? 'active' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(6)}>
                <h3>Is there a limit to the number of students or exams?</h3>
                <span className="faq-icon">{openFaq === 6 ? '−' : '+'}</span>
              </div>
              {openFaq === 6 && (
                <div className="faq-answer">
                  <p>Our platform is designed to scale with your needs. There are no hard limits on the number of students or exams. We support thousands of concurrent test-takers with minimal latency, making it suitable for institutions of any size.</p>
                </div>
              )}
            </div>

            <div className={`faq-item ${openFaq === 7 ? 'active' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(7)}>
                <h3>What happens if there's a technical issue during an exam?</h3>
                <span className="faq-icon">{openFaq === 7 ? '−' : '+'}</span>
              </div>
              {openFaq === 7 && (
                <div className="faq-answer">
                  <p>We maintain a 99.9% uptime SLA and have built-in auto-save features to prevent data loss. If a student experiences connectivity issues, their progress is saved automatically. Our 24/7 support team is available to assist with any technical difficulties.</p>
                </div>
              )}
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
    </div>
  );
}
