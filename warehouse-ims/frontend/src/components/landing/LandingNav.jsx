import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PackageSearch, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-subtle" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <PackageSearch className="w-4.5 h-4.5 text-primary" />
          </div>
          <span className="font-display font-bold text-lg">WareFlow</span>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-text transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-overlay hover:text-primary transition"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link to="/login" className="text-sm text-text-secondary hover:text-text transition">
            Login
          </Link>
          <Link to="/register" className="btn-primary text-sm py-2">
            Get Started
          </Link>
        </div>

        <button className="md:hidden text-text" onClick={() => setOpen((o) => !o)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-background border-t border-subtle px-6 py-4 flex flex-col gap-4">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm text-text-secondary">
              {l.label}
            </a>
          ))}
          <Link to="/login" className="text-sm text-text-secondary">Login</Link>
          <Link to="/register" className="btn-primary text-sm text-center">Get Started</Link>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-sm text-text-secondary"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
      )}
    </motion.header>
  );
}
