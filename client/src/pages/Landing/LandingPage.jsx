import React, { useState }  from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {


    const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="landing-page">
      <header className="landing-navbar">
        <div className="landing-navbar__logo">
          WWS-<span>EduSuite</span>
        </div>

        <nav className={`landing-navbar__nav ${isMenuOpen ? "is-open" : ""}`}>
            <a href="#home" onClick={() => setIsMenuOpen(false)}>
                Home
            </a>
            <a href="#about" onClick={() => setIsMenuOpen(false)}>
                About
            </a>
            <a href="#services" onClick={() => setIsMenuOpen(false)}>
                Services
            </a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)}>
                Pricing
            </a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)}>
                Contact
            </a>
        </nav>


        <div className="nav-menu__login">
        <button
            type="button"
            className={`landing-navbar__menu ${isMenuOpen ? "is-open" : ""}`}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
        </button>

        <Link to="/login" className="landing-navbar__login">
             Login
        </Link>
       </div> 
      </header>

      <main>
        <section className="landing-hero" id="home">
          <div className="landing-hero__content">
            <p className="landing-hero__eyebrow">
              SMARTER SCHOOL MANAGEMENT
            </p>

            <h1>
              Manage Your School
              <span> Smarter.</span>
            </h1>

            <p className="landing-hero__description">
              WWS-EduSuite brings students, staff, academics, attendance,
              results, and school operations together in one
              powerful platform.
            </p>

            <div className="landing-hero__actions">
              <Link
                to="/login"
                className="landing-hero__primary"
                >
                     Get Started
                </Link>

                    <a
                        href="#services"
                        className="landing-hero__secondary"
                    >
                        Explore EduSuite
                    </a>
            </div>
          </div>

          <div className="landing-hero__visual">
            <div className="landing-hero__glow"></div>

            <div className="landing-dashboard-card">
              <div className="landing-dashboard-card__header">
                <div>
                  <span>Dashboard</span>
                  <h3>Good morning 👋</h3>
                </div>

                <div className="landing-dashboard-card__avatar">
                  A
                </div>
              </div>

              <div className="landing-dashboard-card__stats">
                <div>
                  <small>Students</small>
                  <strong>1,248</strong>
                </div>

                <div>
                  <small>Attendance</small>
                  <strong>96%</strong>
                </div>

                <div>
                  <small>Teachers</small>
                  <strong>48</strong>
                </div>
              </div>

              <div className="landing-dashboard-card__chart">
                <span>School Overview</span>

                <div className="landing-chart">
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </div>
              </div>
            </div>
          </div>
        </section>


       { /*Features and services*/}

        <section className="landing-features" id="services">
          <div className="landing-features__intro">
            <p className="landing-features__eyebrow">
              WHY EDUSUITE?
            </p>

            <h2>
              Everything your school needs,
              <span> all in one place.</span>
            </h2>

            <p>
              From managing students and staff to tracking attendance
              and academic results, EduSuite brings your school's
              essential operations together in one simple platform.
            </p>
          </div>

          <div className="landing-features__grid">
            <article className="landing-feature-card">
              <div className="landing-feature-card__icon">🎓</div>

              <h3>Student Management</h3>

              <p>
                Keep student information organized and easily accessible
                from one central place.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-card__icon">👨‍🏫</div>

              <h3>Staff Management</h3>

              <p>
                Manage teachers and school staff while keeping their
                responsibilities and access organized.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-card__icon">📚</div>

              <h3>Academic Management</h3>

              <p>
                Set up academic levels, sessions, terms, classes,
                sections, subjects, and grading with ease.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-card__icon">📊</div>

              <h3>Results Management</h3>

              <p>
                Record, manage, and generate student results with a
                structured academic results system.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-card__icon">📅</div>

              <h3>Attendance Tracking</h3>

              <p>
                Track daily student attendance and keep a clear record
                of attendance activities.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-card__icon">🔐</div>

              <h3>Role-Based Access</h3>

              <p>
                Give administrators, teachers, accountants, and exam
                officers access to the tools they need.
              </p>
            </article>
          </div>
        </section>


                 { /*how it works*/}
        <section className="landing-how-it-works">
            <div className="landing-how-it-works__intro">
                <p className="landing-how-it-works__eyebrow">
                HOW IT WORKS
                </p>

                <h2>
                Get your school up and running
                <span> in three simple steps.</span>
                </h2>

                <p>
                WWS-EduSuite makes it easy to organize your school's
                daily operations without unnecessary complexity.
                </p>
            </div>

            <div className="landing-steps">
                <article className="landing-step">
                <div className="landing-step__number">01</div>

                <div className="landing-step__content">
                    <h3>Set Up Your School</h3>
                    <p>
                    Configure your academic sessions, terms, classes,
                    sections, subjects, and grading structure.
                    </p>
                </div>
                </article>

                <article className="landing-step">
                <div className="landing-step__number">02</div>

                <div className="landing-step__content">
                    <h3>Manage Your Operations</h3>
                    <p>
                    Manage students, staff, attendance, academics,
                    results, and other essential school activities.
                    </p>
                </div>
                </article>

                <article className="landing-step">
                <div className="landing-step__number">03</div>

                <div className="landing-step__content">
                    <h3>Stay In Control</h3>
                    <p>
                    Keep everything organized from one central dashboard
                    with role-based access for your school team.
                    </p>
                </div>
                </article>
            </div>
        </section>



             { /* Built for you*/}

        <section className="landing-services" id="about">
            <div className="landing-services__intro">
                <p className="landing-services__eyebrow">
                BUILT FOR YOUR SCHOOL
                </p>

                <h2>
                Less paperwork.
                <span> More control.</span>
                </h2>

                <p>
                WWS-EduSuite brings the essential parts of school administration
                into one connected system, helping your team spend less time
                managing information and more time running the school.
                </p>
            </div>

            <div className="landing-services__content">
                <div className="landing-services__feature">
                <div className="landing-services__icon">🎓</div>

                <div>
                    <h3>Keep Student Records Organized</h3>
                    <p>
                    Store and manage student information in one central place,
                    making everyday administration easier and more reliable.
                    </p>
                </div>
                </div>

                <div className="landing-services__feature">
                <div className="landing-services__icon">📚</div>

                <div>
                    <h3>Manage Academics With Ease</h3>
                    <p>
                    Configure academic structures, manage subjects and grading,
                    and keep your school's academic workflow organized.
                    </p>
                </div>
                </div>

                <div className="landing-services__feature">
                <div className="landing-services__icon">📅</div>

                <div>
                    <h3>Track Attendance Effortlessly</h3>
                    <p>
                    Record daily attendance and maintain clear attendance
                    information for your students.
                    </p>
                </div>
                </div>

                <div className="landing-services__feature">
                <div className="landing-services__icon">🔐</div>

                <div>
                    <h3>Give Everyone the Right Access</h3>
                    <p>
                    Role-based permissions help administrators and staff access
                    the tools and information relevant to their responsibilities.
                    </p>
                </div>
                </div>
            </div>
        </section>


                     { /* Pricing */}

        <section className="landing-pricing" id="pricing">
            <div className="landing-pricing__intro">
                <p className="landing-pricing__eyebrow">
                SIMPLE, TRANSPARENT PRICING
                </p>

                <h2>
                Pricing that grows
                <span> with your school.</span>
                </h2>

                <p>
                A simple annual subscription based on the number of active
                students in your school. No complicated tiers. No setup fee.
                </p>
            </div>

            <div className="landing-pricing__card">
                <div className="landing-pricing__card-header">
                <p>WWS-EduSuite</p>
                <h3>School Subscription</h3>
                <span>Annual billing</span>
                </div>

                <div className="landing-pricing__price">
                <strong>₦1,200</strong>
                <span>per student / year</span>
                </div>

                <p className="landing-pricing__description">
                Pay based on the number of active students in your school,
                with a minimum annual subscription of ₦60,000.
                </p>

                <ul className="landing-pricing__features">
                <li>✓ Student management</li>
                <li>✓ Staff management</li>
                <li>✓ Academic management</li>
                <li>✓ Attendance tracking</li>
                <li>✓ Results management</li>
                <li>✓ Role-based access</li>
                <li>✓ 30-day free trial</li>
                <li>✓ No setup fee</li>
                </ul>

                <Link
                    to="/login"
                    className="landing-pricing__button"
                >
                     Get Started
                </Link>
            </div>
        </section>



              { /* Getting started */}
        <section className="landing-cta">
            <div className="landing-cta__content">
                <p className="landing-cta__eyebrow">
                READY TO GET STARTED?
                </p>

                <h2>
                Run your school
                <span> smarter.</span>
                </h2>

                <p>
                Bring your school's essential operations together with
                WWS-EduSuite and make everyday management simpler.
                </p>

                <Link
                    to="/login"
                    className="landing-cta__button"
                >
                    Get Started
                </Link>
            </div>
        </section>


              { /* Contact */}

        <section className="landing-contact" id="contact">
            <div className="landing-contact__intro">
                <p className="landing-contact__eyebrow">
                GET IN TOUCH
                </p>

                <h2>
                Let's talk about
                <span> your school.</span>
                </h2>

                <p>
                Have questions about WWS-EduSuite or want to get your school
                started? We'd love to hear from you.
                </p>
            </div>

            <div className="landing-contact__info">
                <div className="landing-contact__item">
                    <span>📧</span>

                    <div>
                        <h3>Email</h3>
                        <a href="mailto:wemoren@gmail.com">
                        wemoren@gmail.com
                        </a>
                    </div>
                </div>

                <div className="landing-contact__item">
                    <span>💬</span>

                    <div>
                        <h3>WhatsApp</h3>
                        <a
                        href="https://wa.me/2349022865280"
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        +234 902 286 5280
                        </a>
                    </div>
                </div>

                <div className="landing-contact__item">
                    <span>𝕏</span>

                    <div>
                        <h3>Twitter / X</h3>
                        <a
                        href="https://twitter.com/WeMoren"
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        @WeMoren
                        </a>
                    </div>
                </div>
            </div>
        </section>


              { /* Footer */}

        <footer className="landing-footer">
            <div className="landing-footer__content">
                <div className="landing-footer__brand">
                <div className="landing-footer__logo">
                    WWS-<span>EduSuite</span>
                </div>

                <p>
                    Smart school management made simple.
                </p>
                </div>

                <div className="landing-footer__links">
                <h3>Quick Links</h3>

                <a href="#home">Home</a>
                <a href="#about">About</a>
                <a href="#services">Services</a>
                <a href="#pricing">Pricing</a>
                <a href="#contact">Contact</a>
                </div>

                <div className="landing-footer__contact">
                <h3>Contact</h3>

                    <p>
                        Email:{" "}
                        <a href="mailto:wemoren@gmail.com">
                            wemoren@gmail.com
                        </a>
                        </p>

                        <p>
                        WhatsApp:{" "}
                        <a
                            href="https://wa.me/2349022865280"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            +234 902 286 5280
                        </a>
                        </p>

                        <p>
                        Twitter / X:{" "}
                        <a
                            href="https://twitter.com/WeMoren"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            @WeMoren
                        </a>
                        </p>
                </div>
            </div>

            <div className="landing-footer__bottom">
                <p>
                © 2026 WeMoren Web Services. All rights reserved.
                </p>

                <p>
                WWS-EduSuite
                </p>
            </div>
        </footer>

      </main>
    </div>
  );
};

export default LandingPage;