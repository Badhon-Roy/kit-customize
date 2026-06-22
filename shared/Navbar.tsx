"use client";

import Image from "next/image";
import Link from "next/link";
import logoImg from "@/assets/images/logo.png";
import CommonButton from "@/common/CommonButton";
import { motion } from "framer-motion";

const Navbar = () => {
  const menuItems = [
    { name: "Home", href: "/", active: true },
    { name: "How it Works", href: "/how-it-works" },
    { name: "Products", href: "/products" },
    { name: "Contact Us", href: "/contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -45, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }} // Cinematic drop-down easeOutExpo curve
      className="w-full container mx-auto flex items-center justify-between px-6 md:px-12 lg:px-16 py-5 bg-transparent relative z-50"
    >
      {/* Logo */}
      <motion.div 
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.0, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="shrink-0"
      >
        <Link href="/" className="block transition-transform hover:scale-105 duration-300">
          <Image 
            src={logoImg} 
            alt="Big Fish Logo" 
            width={120} 
            height={48} 
            priority
            className="h-10 md:h-12 w-auto object-contain"
          />
        </Link>
      </motion.div>

      {/* Nav Menu with Staggered Link Drops */}
      <div className="hidden md:flex items-center space-x-8 lg:space-x-12">
        {menuItems.map((item, idx) => (
          <motion.div
            key={item.name}
            initial={{ y: -15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.0, delay: 0.6 + idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={item.href}
              className="relative py-2 text-sm lg:text-base font-medium text-[#031E39] hover:text-opacity-80 transition-colors duration-200 block"
            >
              {item.name}
              {item.active && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#031E39] rounded-full" />
              )}
            </Link>
          </motion.div>
        ))}
      </div>

      {/* CTA Button */}
      <motion.div
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.0, delay: 1.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link href="/brand-new-design" className="inline-block">
          <CommonButton 
            buttonText="Start Customizing"
          />
        </Link>
      </motion.div>
    </motion.nav>
  );
};

export default Navbar;