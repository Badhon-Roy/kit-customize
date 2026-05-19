"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import SectionTitle from "@/common/SectionTitle";

// Import step images
import step1Image from "@/assets/images/step1-custom-design-jersey.png";
import step2Image from "@/assets/images/step2-custom-design-jersey.png";
import step3Image from "@/assets/images/step3-custom-design-jersey.png";

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      image: step1Image,
      number: "1",
      title: "1. Choose your product and start designing",
      description:
        "Select from a range of customizable jerseys and jackets. Pick your favorite style, fit, and size to get started with your unique design.",
    },
    {
      id: 2,
      image: step2Image,
      number: "2",
      title: "2. Customize every detail with live preview updates",
      description:
        "Personalize colors, patterns, logos, player names, numbers, and more while instantly previewing every change directly on the product.",
    },
    {
      id: 3,
      image: step3Image,
      number: "3",
      title: "3. Review your final design and add to cart your order",
      description:
        "Check your complete design from multiple views, confirm all customization details, and securely complete your order through checkout.",
    },
  ];

  return (
    <section className="relative w-full bg-[#FFFFFF] py-20 md:py-28 overflow-hidden">
      {/* Header Container */}
      <div className="container mx-auto px-6 text-center mb-16 md:mb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionTitle
            title="How does it work?"
            className="text-[#031E39] mb-4"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto"
        >
          <p className="text-sm md:text-base text-[#565E69] leading-relaxed">
            In a few simple steps, you can create and wear your own customized
            sportswear.
          </p>
        </motion.div>
      </div>

      {/* Steps List */}
      <div className="container mx-auto px-6 max-w-7xl space-y-24 md:space-y-36">
        {steps.map((step, idx) => {
          const isEven = idx % 2 === 1;
          return (
            <div
              key={step.id}
              className={`flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20 ${
                isEven ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Text Column */}
              <motion.div
                initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full lg:w-[45%] space-y-4 md:space-y-6"
              >
                <h3 className="text-xl md:text-2xl lg:text-[32px] font-bold text-[#031E39] tracking-tight leading-snug">
                  {step.title}
                </h3>
                <p className="text-sm md:text-base lg:text-[20px] text-[#565E69] leading-relaxed font-normal">
                  {step.description}
                </p>
              </motion.div>

              {/* Graphic Column */}
              <motion.div
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full lg:w-[50%] flex items-center justify-center aspect-square md:aspect-[1.2/1] overflow-visible"
              >
                {/* Jersey Image Wrapper */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 5,
                    ease: "easeInOut",
                  }}
                  className="relative w-full h-full flex items-center justify-center z-10"
                >
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    priority
                    className="object-contain"
                  />
                </motion.div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;
