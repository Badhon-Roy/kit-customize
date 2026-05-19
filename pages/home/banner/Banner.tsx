"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "@/shared/Navbar";

// Import assets
import bannerBg from "@/assets/images/banner.png";
import jersey1 from "@/assets/images/banner-jersey-1.png";
import jersey2 from "@/assets/images/banner-jersey-2.png";
import jersey3 from "@/assets/images/banner-jersey-3.png";
import jersey4 from "@/assets/images/banner-jersey-4.png";

const Banner = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const prevActiveIndexRef = useRef(0);
  const prevActiveIndex = prevActiveIndexRef.current;

  useEffect(() => {
    prevActiveIndexRef.current = activeIndex;
  }, [activeIndex]);
  const [isMobile, setIsMobile] = useState(false);

  const jerseys = [
    { id: 1, src: jersey1, name: "Purple Gradient Polo" },
    { id: 2, src: jersey2, name: "Black Neon Lightning Jersey" },
    { id: 3, src: jersey3, name: "Blue Fade Jersey" },
    { id: 4, src: jersey4, name: "Sleek White Gold Diagonal Jersey" },
  ];

  // Hydration-safe mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Automatic slideshow interval (every 6 seconds for cinematic experience)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % jerseys.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [jerseys.length]);

  // Compute layout styles dynamically based on the active index
  const getJerseyStyle = (index: number) => {
    const diff = (index - activeIndex + jerseys.length) % jerseys.length;

    if (diff === 0) {
      // 1. Center-Left Active Focused Jersey
      return {
        x: "-50%",
        left: "33%",
        leftMobile: "50%",
        scale: 1,
        opacity: 1,
        zIndex: 35,
        rotate: 0,
        showMobile: true,
      };
    } else if (diff === 1) {
      // 2. Right Peeking Jersey (Entering next)
      return {
        x: "0%",
        left: "82%",
        leftMobile: "115%",
        scale: 0.58,
        opacity: 0.8,
        zIndex: 30,
        rotate: 12,
        showMobile: false,
      };
    } else if (diff === jerseys.length - 1) {
      // 3. Left Exited Jersey (Gliding off-screen left)
      return {
        x: "0%",
        left: "-25%",
        leftMobile: "-60%",
        scale: 0.65,
        opacity: 0,
        zIndex: 25,
        rotate: -12,
        showMobile: false,
      };
    } else {
      // 4. Waiting Pool Jersey (Positioned off-screen right)
      return {
        x: "0%",
        left: "135%",
        leftMobile: "150%",
        scale: 0.5,
        opacity: 0,
        zIndex: 20,
        rotate: 20,
        showMobile: false,
      };
    }
  };

  return (
    <section className="relative w-full h-[100vh] min-h-[600px] flex flex-col justify-between overflow-hidden select-none">
      
      {/* Base solid background color layer (z-0) */}
      <div className="absolute inset-0 bg-[#f1f3f5] z-0" />

      {/* Slanted background graphics using optimized Next.js Image (z-10) */}
      <motion.div
        initial={{ scale: 1.08, opacity: 1 }} // Starts fully visible in HTML pre-paint to avoid white screen!
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }} // Grand luxury easeOutExpo curve
        className="absolute inset-0 z-10 w-full h-full origin-center"
      >
        <Image
          src={bannerBg}
          alt="Slanted background"
          fill
          priority
          quality={100}
          className="object-cover object-center pointer-events-none"
        />
      </motion.div>

      {/* Layered transparent header navbar (z-50 - absolute top overlay) */}
      <div className="relative z-50 w-full">
        <Navbar />
      </div>

      {/* Huge centered "BIG FISH" typography background watermark (z-20) */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none overflow-hidden px-4">
        <motion.h1
          initial={{ scaleX: 0.6, scaleY: 0.66, opacity: 0.3 }} // Starts partially visible to prevent blank gap!
          animate={{ scaleX: 1, scaleY: 1.1, opacity: 0.95 }}
          transition={{ duration: 2.0, ease: [0.16, 1, 0.3, 1] }} // Grand luxury easeOutExpo curve
          className="text-[14vw] md:text-[13vw] font-bold text-white tracking-widest uppercase leading-none select-none text-center font-sans"
        >
          BIG FISH
        </motion.h1>
      </div>

      {/* Foreground dynamic auto-sliding jerseys (z-30) */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {jerseys.map((jersey, index) => {
          const style = getJerseyStyle(index);
          const isActive = index === activeIndex;

          // Detect if this specific jersey is wrapping around between Left Exit and furthest right state
          const diff = (index - activeIndex + jerseys.length) % jerseys.length;
          const prevDiff = (index - prevActiveIndex + jerseys.length) % jerseys.length;

          const isWrapAround = 
            (prevDiff === jerseys.length - 1 && diff === jerseys.length - 2) || 
            (prevDiff === jerseys.length - 2 && diff === jerseys.length - 1);

          return (
            <motion.div
              key={jersey.id}
              initial={{ scale: 0.5, opacity: 0.3 }} // Starts in position and partially visible to prevent blank gap!
              animate={{
                left: isMobile ? style.leftMobile : style.left,
                x: style.x,
                y: "-50%",
                scale: style.scale,
                opacity: style.opacity,
                zIndex: style.zIndex,
              }}
              transition={
                isWrapAround
                  ? {
                      left: { duration: 0 },
                      x: { duration: 0 },
                      y: { duration: 0 },
                      scale: { duration: 0 },
                      zIndex: { duration: 0 },
                      opacity: { duration: 0.8, delay: 0.8 }, // Fade in only after slide completes to keep exactly 2 jerseys visible
                    }
                  : {
                      type: "spring",
                      stiffness: 30,
                      damping: 15,
                      mass: 0.8,
                    }
              }
              style={{
                left: isMobile ? style.leftMobile : style.left,
                x: style.x,
                y: "-50%",
                scale: style.scale,
                opacity: style.opacity,
                zIndex: style.zIndex,
              }}
              className={`absolute top-[52%] w-[68vw] sm:w-[50vw] md:w-[34vw] max-w-[530px] aspect-[3/4] flex items-center justify-center ${
                style.showMobile ? "flex" : "hidden md:flex"
              }`}
            >
              {/* Floating micro-animation applied exclusively to active center jersey */}
              <motion.div
                animate={
                  isActive
                    ? {
                        y: [-12, 12, -12],
                        rotate: [-1, 2, -1],
                      }
                    : {
                        y: 0,
                        rotate: style.rotate,
                      }
                }
                transition={
                  isActive
                    ? {
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                    : {
                        type: "spring",
                        stiffness: 30,
                        damping: 15,
                        mass: 0.8,
                      }
                }
                className="w-full h-full relative drop-shadow-[0_32px_45px_rgba(3,30,57,0.16)] filter"
              >
                <Image
                  src={jersey.src}
                  alt={jersey.name}
                  fill
                  priority
                  quality={95}
                  className="object-contain pointer-events-none"
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom UI details (z-40) */}
      
      {/* Bottom-left: Scroll Indicator */}
      <div className="absolute bottom-8 left-6 md:left-12 lg:left-16 z-40 flex flex-col items-center">
        <span className="text-[14px] tracking-[0.25em] font-medium text-white uppercase select-none opacity-80 mb-2 font-sans">
          Scrol
        </span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="text-white text-base font-bold select-none opacity-80"
        >
          ↓
        </motion.span>
      </div>

      {/* Bottom-right: Editorial Text Description & Slider Progress */}
      <div className="absolute bottom-8 left-6 right-6 md:left-[52%] md:right-auto z-40 flex flex-col max-w-[280px]">
        <p className="text-[10.5px] md:text-[11.5px] font-medium leading-normal text-[#676F7E] tracking-wide select-none">
          Design premium custom sportswear with
          <span className="block mt-0.5">real-time customization.</span>
        </p>
        
        {/* Segmented stepper indicators synchronized with current slide (Clickable) */}
        <div className="flex items-center gap-2 mt-3 select-none">
          {jerseys.map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button 
                key={idx} 
                onClick={() => setActiveIndex(idx)}
                className="group cursor-pointer py-2 focus:outline-none"
                aria-label={`Go to jersey slide ${idx + 1}`}
              >
                <div 
                  className={`w-10 h-[2.5px] bg-[#031E39] rounded-full relative overflow-hidden transition-all duration-300 ${
                    isActive ? "bg-opacity-35" : "bg-opacity-20 group-hover:bg-opacity-45 scale-y-110 group-hover:scale-y-125"
                  }`}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      width: isActive ? "100%" : idx < activeIndex ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="absolute top-0 left-0 h-full bg-[#031E39] rounded-full"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </section>
  );
};

export default Banner;