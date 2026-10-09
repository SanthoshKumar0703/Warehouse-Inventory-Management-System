import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Boxes,
  QrCode,
  BarChart3,
  Bell,
  ShieldCheck,
  Zap,
  Brain,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Package,
} from "lucide-react";
import LandingNav from "../components/landing/LandingNav.jsx";
import LandingFooter from "../components/landing/LandingFooter.jsx";
import AnimatedStat from "../components/landing/AnimatedStat.jsx";
import FaqItem from "../components/landing/FaqItem.jsx";

const FEATURES = [
  { icon: Boxes, title: "Real-Time Tracking", desc: "Every stock movement syncs instantly across every device — no refresh needed." },
  { icon: QrCode, title: "QR & Barcodes", desc: "Auto-generated scannable codes speed up receiving and audits." },
  { icon: BarChart3, title: "Live Analytics", desc: "Trends, category and warehouse breakdowns, at a glance." },
  { icon: Bell, title: "Smart Alerts", desc: "Low-stock and out-of-stock notifications reach the right people." },
  { icon: ShieldCheck, title: "Role-Based Access", desc: "Admin, Manager, and Staff roles keep control where it belongs." },
  { icon: Brain, title: "AI Reorder Predictions", desc: "Know how many days of stock you have left, before it's a problem." },
];

const TESTIMONIALS = [
  { name: "Operations Lead", company: "Meridian Logistics", quote: "We finally know our exact stock position in real time, across three warehouses." },
  { name: "Inventory Manager", company: "Northbridge Retail", quote: "Low-stock alerts alone have saved us from stockouts more times than I can count." },
];

const FAQS = [
  { q: "Do I need to install anything on warehouse devices?", a: "No — WareFlow runs in the browser and works on tablets, phones, and desktops." },
  { q: "Can I control what each team member can do?", a: "Yes. Admin, Manager, and Staff roles come with role-based access built in." },
  { q: "How does the AI stock prediction work?", a: "It studies your stock-out history per product to estimate days of stock left and recommend a reorder quantity." },
];

// Small floating package icons for hero background texture.
const FLOATERS = [
  { top: "12%", left: "8%", delay: 0, size: 22 },
  { top: "68%", left: "12%", delay: 0.6, size: 16 },
  { top: "22%", left: "88%", delay: 0.3, size: 20 },
  { top: "75%", left: "90%", delay: 0.9, size: 18 },
  { top: "45%", left: "4%", delay: 1.2, size: 14 },
];

export default function Landing() {
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    toast.success("Thanks for reaching out — we'll get back to you shortly.");
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div id="home" className="bg-background text-text overflow-x-hidden">
      <LandingNav />

      {/* ---------------- HERO ---------------- */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 15% 15%, rgba(184,115,51,0.22), transparent 45%), radial-gradient(circle at 85% 10%, rgba(210,139,71,0.14), transparent 40%), radial-gradient(circle at 50% 100%, rgba(184,115,51,0.10), transparent 50%)",
          }}
        />
        {FLOATERS.map((f, i) => (
          <motion.div
            key={i}
            className="absolute -z-10 text-primary/25 hidden md:block"
            style={{ top: f.top, left: f.left }}
            animate={{ y: [0, -18, 0], rotate: [0, 8, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: f.delay }}
          >
            <Package size={f.size} />
          </motion.div>
        ))}

        <div className="max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6"
          >
            <Brain className="w-3.5 h-3.5" />
            Now with AI-powered stock prediction
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-display font-extrabold leading-[1.1] mb-5"
          >
            Know exactly what's in your
            <span className="text-primary"> warehouse </span>
            — right now.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-text-secondary text-lg max-w-xl mx-auto mb-8"
          >
            Real-time stock tracking, purchase orders, and AI-driven reorder
            recommendations — all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <Link to="/register" className="btn-primary flex items-center gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="px-5 py-2.5 rounded-xl border border-subtle hover:bg-overlay transition text-sm">
              See Features
            </a>
          </motion.div>
        </div>

        {/* Animated stat strip, folded into the hero to save a whole section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-3xl mx-auto mt-16 glass-card px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          <AnimatedStat value={12000} suffix="+" label="Products tracked" />
          <AnimatedStat value={340} suffix="+" label="Warehouses managed" />
          <AnimatedStat value={99} suffix="%" label="Inventory accuracy" />
          <AnimatedStat value={24} suffix="/7" label="Real-time sync" />
        </motion.div>
      </section>

      {/* ---------------- ABOUT (compact) ---------------- */}
      <section id="about" className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-display font-bold mb-4"
          >
            Built for teams tired of guessing at stock levels
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-text-secondary leading-relaxed max-w-2xl mx-auto"
          >
            WareFlow keeps every warehouse, product, and order in sync in real
            time — our mission is complete stock visibility the moment
            something changes, and our vision is a world where stockouts are
            predicted, not discovered too late.
          </motion.p>
        </div>
      </section>

      {/* ---------------- FEATURES (folds in "Why Us") ---------------- */}
      <section id="features" className="py-16 px-6 bg-sidebar/40 border-y border-subtle">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary text-sm font-medium">Features</span>
            <h2 className="text-2xl md:text-3xl font-display font-bold mt-2">
              Everything a warehouse team actually needs
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.1 }}
                className="glass-card p-6 hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- AI PREDICTION ---------------- */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto glass-card p-8 md:p-10 grid md:grid-cols-2 gap-8 items-center border border-primary/20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-4">
              <Brain className="w-3.5 h-3.5" /> AI-Powered
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Smart Inventory Prediction
            </h2>
            <p className="text-text-secondary leading-relaxed">
              WareFlow studies each product's stock-out history to estimate
              days of stock remaining and recommend exactly how much to
              reorder — surfaced right on your dashboard.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="bg-background rounded-2xl p-6 border border-subtle"
          >
            <p className="text-xs text-text-secondary mb-3">Reorder Recommendation</p>
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Industrial Shelving Unit</span>
              <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded-full">7 days left</span>
            </div>
            <div className="h-2 rounded-full bg-overlay overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-primary to-primary-hover" style={{ width: "28%" }} />
            </div>
            <p className="text-sm text-text-secondary">
              Recommended reorder: <span className="text-text font-semibold">140 units</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ---------------- TESTIMONIALS + FAQ (combined) ---------------- */}
      <section id="faq" className="py-16 px-6 bg-sidebar/40 border-y border-subtle">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          <div>
            <span className="text-primary text-sm font-medium">Testimonials</span>
            <h2 className="text-2xl font-display font-bold mt-2 mb-6">Trusted by warehouse teams</h2>
            <div className="space-y-4">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="glass-card p-5"
                >
                  <p className="text-text-secondary text-sm leading-relaxed mb-3">"{t.quote}"</p>
                  <p className="text-sm font-medium">{t.name} <span className="text-text-secondary font-normal">— {t.company}</span></p>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-primary text-sm font-medium">FAQ</span>
            <h2 className="text-2xl font-display font-bold mt-2 mb-6">Common questions</h2>
            <div className="space-y-3">
              {FAQS.map((f) => (
                <FaqItem key={f.q} question={f.q} answer={f.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CONTACT ---------------- */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-primary text-sm font-medium">Contact Us</span>
            <h2 className="text-2xl font-display font-bold mt-2 mb-5">Let's talk about your warehouse</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-text-secondary">
                <Mail className="w-4 h-4 text-primary" /> hello@wareflow.app
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <Phone className="w-4 h-4 text-primary" /> +91 44 4000 1234
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <MapPin className="w-4 h-4 text-primary" /> Coimbatore, Tamil Nadu, India
              </div>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            onSubmit={handleContactSubmit}
            className="glass-card p-6 space-y-4"
          >
            <input
              required
              placeholder="Your name"
              className="input-field"
              value={contactForm.name}
              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
            />
            <input
              required
              type="email"
              placeholder="Your email"
              className="input-field"
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            />
            <textarea
              required
              rows={3}
              placeholder="How can we help?"
              className="input-field resize-none"
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
            />
            <button type="submit" className="btn-primary w-full">Send Message</button>
          </motion.form>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
