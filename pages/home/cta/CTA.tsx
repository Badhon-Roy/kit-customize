"use client";

import { motion } from "framer-motion";
import CommonButton from "@/common/CommonButton";

const CTA = () => {
  return (
    <section className="relative w-full bg-[#FAFCFF] py-24 md:py-32 flex flex-col items-center justify-center overflow-hidden border-t border-[#E8EFF9]">
      
      {/* Dynamic Floating Liquid Gradient Blobs (Video-like movement) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
        
        {/* Blob 1: Vibrant Lime Green (Top-Left) */}
        <motion.div
          animate={{
            x: [0, 50, -40, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[-30%] left-[-20%] w-[450px] h-[450px] md:w-[750px] md:h-[750px] bg-[#BEF264] rounded-full blur-[80px] md:blur-[130px] opacity-[0.45]"
        />

        {/* Blob 2: Warm Orchid Purple (Bottom-Left/Center) */}
        <motion.div
          animate={{
            x: [0, -60, 40, 0],
            y: [0, 50, -50, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[-25%] left-[5%] w-[400px] h-[400px] md:w-[700px] md:h-[700px] bg-[#C084FC] rounded-full blur-[80px] md:blur-[130px] opacity-[0.38]"
        />

        {/* Blob 3: Vibrant Mint/Turquoise (Top-Right) */}
        <motion.div
          animate={{
            x: [0, 40, -50, 0],
            y: [0, 70, -30, 0],
            scale: [1, 1.1, 0.85, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[-15%] right-[-20%] w-[380px] h-[380px] md:w-[650px] md:h-[650px] bg-[#A5F3FC] rounded-full blur-[80px] md:blur-[130px] opacity-[0.48]"
        />

        {/* Central Soft White Glow for high-end text contrast */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.75)_0%,rgba(255,255,255,0)_70%)] z-0" />
      </div>

      {/* Content Container */}
      <div className="relative container mx-auto px-6 max-w-4xl text-center z-10 space-y-6 md:space-y-8">

        {/* Dynamic Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-3xl md:text-5xl lg:text-[56px] font-bold text-[#031E39] tracking-tight leading-tight md:leading-none">
            Ready to Create Your<br className="hidden md:inline" /> Custom Jersey?
          </h2>
        </motion.div>

        {/* Dynamic Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto"
        >
          <p className="text-sm md:text-base lg:text-[18px] text-[#565E69]/90 leading-relaxed font-normal">
            Design professional jerseys with live previews, team branding, player personalization, and seamless online ordering.
          </p>
        </motion.div>

        {/* Call to Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="pt-4 flex justify-center"
        >
          <CommonButton
            buttonText="Start Your Design"
            className="px-10 py-4"
          />
        </motion.div>
      </div>

    </section>
  );
};

export default CTA;
