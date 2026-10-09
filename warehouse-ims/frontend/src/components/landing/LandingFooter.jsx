import React from "react";
import { PackageSearch, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="border-t border-subtle bg-sidebar">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <PackageSearch className="w-4.5 h-4.5 text-primary" />
            </div>
            <span className="font-display font-bold text-lg">WareFlow</span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">
            Real-time warehouse and inventory management for teams that can't afford to guess.
          </p>
          <div className="flex gap-3 mt-5">
            {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 rounded-lg bg-overlay flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display font-semibold text-sm mb-4">Product</h4>
          <ul className="space-y-2.5 text-sm text-text-secondary">
            <li><a href="#features" className="hover:text-text">Features</a></li>
            <li><a href="#about" className="hover:text-text">About</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-sm mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm text-text-secondary">
            <li><a href="#about" className="hover:text-text">Our mission</a></li>
            <li><a href="#faq" className="hover:text-text">FAQ</a></li>
            <li><a href="#contact" className="hover:text-text">Contact us</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-sm mb-4">Get in touch</h4>
          <ul className="space-y-2.5 text-sm text-text-secondary">
            <li>hello@wareflow.app</li>
            <li>+91 44 4000 1234</li>
            <li>Coimbatore, Tamil Nadu, India</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-subtle py-5 text-center text-xs text-text-secondary">
        © {new Date().getFullYear()} WareFlow. All rights reserved.
      </div>
    </footer>
  );
}
