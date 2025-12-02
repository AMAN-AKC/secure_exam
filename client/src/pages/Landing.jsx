import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronDown, Check, Rocket, Lock, Zap, Calendar, BarChart2, Globe, Layout, ArrowRight, FileText, Users } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="landing-wrapper">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="landing-nav-content">
          <div className="landing-nav-logo">
            <div className="landing-logo-icon">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="landing-logo-text">SecureExam</span>
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="landing-nav-link">Sign In</Link>
            <Link to="/register" className="landing-nav-btn">Register</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-bg">
          <div className="landing-hero-blob landing-blob-1"></div>
          <div className="landing-hero-blob landing-blob-2"></div>
          <div className="landing-hero-float landing-float-1"></div>
          <div className="landing-hero-float landing-float-2"></div>
        </div>

        <div className="landing-hero-content">
          <div className="landing-hero-text">
            <div className="landing-hero-badge">
              ✨ Professional Online Examination Platform
            </div>
            <h1 className="landing-hero-title">
              Secure. Scalable.
              <br/>
              <span className="landing-gradient-text">Smart Assessments.</span>
            </h1>
            <p className="landing-hero-description">
              Enterprise-grade secure examination designed for modern educational institutions. Create, manage, and score with bank-level security and real-time monitoring.
            </p>
            <div className="landing-hero-buttons">
              <Link to="/register" className="landing-btn landing-btn-primary">
                <Rocket className="w-5 h-5" />
                Get Started
              </Link>
              <Link to="/login" className="landing-btn landing-btn-secondary">
                <Lock className="w-5 h-5" />
                Login
              </Link>
            </div>
          </div>
          
          <div className="landing-hero-visual">
            <div className="landing-laptop-container">
              <div className="landing-laptop-glow"></div>
              <div className="landing-laptop">
                <div className="landing-laptop-screen">
                  <div className="landing-laptop-header">
                    <div className="landing-laptop-dot red"></div>
                    <div className="landing-laptop-dot yellow"></div>
                    <div className="landing-laptop-dot green"></div>
                  </div>
                  <div className="landing-laptop-content">
                    <div className="landing-laptop-sidebar"></div>
                    <div className="landing-laptop-main">
                      <div className="landing-laptop-card">
                        <Shield className="w-8 h-8 text-violet-400" />
                      </div>
                      <div className="landing-laptop-line"></div>
                      <div className="landing-laptop-line short"></div>
                      <div className="landing-laptop-line short"></div>
                    </div>
                  </div>
                  <div className="landing-laptop-badge">
                    <div className="landing-badge-dot"></div>
                    <span>SECURE_MODE: ON</span>
                  </div>
                </div>
                <div className="landing-laptop-base"></div>
              </div>

              <div className="landing-floating-box">
                <div className="landing-box-icon">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="landing-box-label">System Check</div>
                  <div className="landing-box-value">Passed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-how-it-works">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2>How It Works</h2>
            <p>Streamlined process for administrators and students. From creation to grading in minutes.</p>
          </div>
          
          <div className="landing-steps-wrapper">
            <svg className="landing-steps-line" viewBox="0 0 1200 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor: '#7c3aed', stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor: '#2563eb', stopOpacity:1}} />
                </linearGradient>
              </defs>
              <path d="M0,50 C200,50 300,20 400,20 C500,20 600,80 700,80 C800,80 900,50 1200,50" fill="none" stroke="url(#grad1)" strokeWidth="4" />
            </svg>

            <div className="landing-steps">
              {[
                { id: 1, title: 'Design Exam', desc: 'Create options', icon: Layout },
                { id: 2, title: 'Admin Approve', desc: 'Verify content', icon: Shield },
                { id: 3, title: 'Take Exam', desc: 'Secure register', icon: Users },
                { id: 4, title: 'Anti-Cheating', desc: 'Time vested', icon: Lock },
                { id: 5, title: 'Get Results', desc: 'Instant Analysis', icon: BarChart2 },
              ].map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className={`landing-step ${idx === 2 ? 'landing-step-center' : ''}`}>
                    <div className="landing-step-icon">
                      <div className="landing-step-circle">
                        <Icon className="w-7 h-7 text-violet-400" />
                      </div>
                      <span className="landing-step-number">{step.id}</span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="landing-why-choose">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2>Why Choose SecureExam?</h2>
            <p>Built for the future of education</p>
          </div>

          <div className="landing-features-grid">
            {[
              { icon: Lock, title: 'Bank-Level Security', desc: 'End-to-end encrypted exam questions with blockchain-based tamper detection.', color: 'blue' },
              { icon: Zap, title: 'Lightning Fast', desc: 'Optimized performance with minimal latency. Smooth experience even with thousands of users.', color: 'amber' },
              { icon: Calendar, title: 'Flexible Scheduling', desc: 'Fixed schedule or flexible timing options. Support for both protected and open rules.', color: 'pink' },
              { icon: BarChart2, title: 'Comprehensive Analytics', desc: 'Detailed performance reports, question analysis, and student progress tracking.', color: 'indigo' },
              { icon: Layout, title: 'Modern Interface', desc: 'Clean, intuitive design built with modern web technologies. Easy to navigate.', color: 'cyan' },
              { icon: Globe, title: 'Global Ready', desc: 'Support for multiple timezones and question formats. Perfect for worldwide institutions.', color: 'green' },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className={`landing-feature-card landing-feature-${feature.color}`}>
                  <div className="landing-feature-icon">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="landing-faq">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2>Frequently Asked Questions</h2>
          </div>
            
          <div className="landing-faq-list">
            {[
              "How secure is the SecureExam platform?",
              "Can students take exams on mobile devices?",
              "How does the approval process work?",
              "What should exams for specific roles and times look like?",
              "Is there a limit to the number of students?"
            ].map((q, i) => (
              <div key={i} className={`landing-faq-item ${openFaq === i ? 'landing-faq-open' : ''}`}>
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="landing-faq-question"
                >
                  <span>{q}</span>
                  <ChevronDown className="landing-faq-icon" />
                </button>
                {openFaq === i && (
                  <div className="landing-faq-answer">
                    SecureExam uses advanced encryption and proctoring technologies to ensure the integrity of every assessment. We support a wide range of devices including secure lock-down browsers for mobile.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-container">
          <div className="landing-cta-box">
            <div className="landing-cta-blob-1"></div>
            <div className="landing-cta-blob-2"></div>
            
            <div className="landing-cta-badge">
              <Shield className="w-4 h-4 text-green-400" />
              <span>Enterprise Security</span>
            </div>
            
            <h2>Ready to Transform Your Exams?</h2>
            <p>Join thousands of institutions using SecureExam for reliable, secure online assessments.</p>
            
            <div className="landing-cta-buttons">
              <Link to="/login" className="landing-btn landing-cta-btn-primary">
                <Layout className="w-5 h-5" />
                Secure Dashboard
              </Link>
              <Link to="/register" className="landing-btn landing-cta-btn-secondary">
                <ArrowRight className="w-5 h-5" />
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-content">
            <div className="landing-footer-logo">
              <Shield className="w-6 h-6 text-violet-500" />
              <span>SecureExam</span>
            </div>
            <p>&copy; {new Date().getFullYear()} SecureExam Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
