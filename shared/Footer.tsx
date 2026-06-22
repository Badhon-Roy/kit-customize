import Image from "next/image";
import Link from "next/link";
import logoImg from "@/assets/images/logo.png";

const Footer = () => {
  return (
    <footer className="w-full bg-[#01182B] text-white pt-16 pb-8 md:pt-20 md:pb-10 overflow-hidden relative z-10 border-t border-white/5">
      
      {/* Footer Main Content Grid */}
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 lg:gap-16">
          
          {/* Column 1: Brand Info & Socials */}
          <div className="space-y-6">
            <Link href="/" className="inline-block transition-transform hover:scale-[1.03] duration-300">
              <Image
                src={logoImg}
                alt="BIG FISH Logo"
                width={130}
                height={52}
                priority
                className="h-10 md:h-12 w-auto object-contain"
              />
            </Link>
            
            <p className="text-sm text-white/60 leading-relaxed max-w-xs font-light">
              Your Trusted partner for world-class travel experiences across 50+ destinations.
            </p>
            
            {/* Square Bordered Social Icons */}
            <div className="flex items-center space-x-3 pt-2">
              
              {/* Facebook */}
              <a 
                href="#" 
                className="w-9 h-9 border border-white/20 hover:border-white/60 hover:bg-white/5 rounded flex items-center justify-center transition-all duration-300 group"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-white/80 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href="#" 
                className="w-9 h-9 border border-white/20 hover:border-white/60 hover:bg-white/5 rounded flex items-center justify-center transition-all duration-300 group"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 stroke-white/80 group-hover:stroke-white fill-none stroke-2 transition-colors" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              {/* Twitter (X) */}
              <a 
                href="#" 
                className="w-9 h-9 border border-white/20 hover:border-white/60 hover:bg-white/5 rounded flex items-center justify-center transition-all duration-300 group"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4 fill-white/80 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a 
                href="#" 
                className="w-9 h-9 border border-white/20 hover:border-white/60 hover:bg-white/5 rounded flex items-center justify-center transition-all duration-300 group"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 fill-white/80 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-5">
            <h4 className="text-[#FFFFFF] text-base md:text-lg font-semibold tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { name: "How it Works", href: "/how-it-works" },
                { name: "Products", href: "/products" },
                { name: "About Us", href: "/about" },
                { name: "FAQ", href: "/faq" },
                { name: "Contact Us", href: "/contact" }
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-white/60 hover:text-white hover:translate-x-1 inline-block transition-all duration-200 text-sm md:text-base font-light"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Terms */}
          <div className="space-y-5">
            <h4 className="text-[#FFFFFF] text-base md:text-lg font-semibold tracking-wide">
              Terms
            </h4>
            <ul className="space-y-3">
              {[
                { name: "Privacy policy", href: "/privacy" },
                { name: "Help Center", href: "/help" },
                { name: "Terms of Services", href: "/terms" }
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-white/60 hover:text-white hover:translate-x-1 inline-block transition-all duration-200 text-sm md:text-base font-light"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div className="space-y-5">
            <h4 className="text-[#FFFFFF] text-base md:text-lg font-semibold tracking-wide">
              Contact Us
            </h4>
            <ul className="space-y-4">
              
              {/* Telephone */}
              <li className="flex items-center space-x-3 text-white/60 hover:text-white transition-colors duration-200 text-sm md:text-base font-light">
                <svg className="w-5 h-5 stroke-white/60 stroke-[1.8] fill-none" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>+44 123 456 7890</span>
              </li>

              {/* Email */}
              <li className="flex items-center space-x-3 text-white/60 hover:text-white transition-colors duration-200 text-sm md:text-base font-light">
                <svg className="w-5 h-5 stroke-white/60 stroke-[1.8] fill-none" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span className="break-all">user1234@gamil.com</span>
              </li>

            </ul>
          </div>

        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-white/10 mt-12 pt-8 md:mt-16 md:pt-8 text-center">
          <p className="text-xs md:text-sm text-white/40 font-light tracking-wide">
            © 2026 BIGFISH. All rights reserved.
          </p>
        </div>

      </div>

    </footer>
  );
};

export default Footer;