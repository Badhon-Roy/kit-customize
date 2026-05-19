"use client";

import Image from "next/image";
import { motion} from "framer-motion";
import SectionSubTitle from "@/common/SectionSubTitle";
import SectionTitle from "@/common/SectionTitle";
import SectionDescription from "@/common/SectionDescription";

// Import local assets
import configuratorImg from "@/assets/images/Configurator.png";
import superDesignImg from "@/assets/images/Super-design.png";

const Services = () => {


  const cards = [
    {
      id: "configurator",
      title: "Configurator",
      description: "Start creating custom uniforms online.\nChoose a product and customize it as you want!",
      image: configuratorImg,
      bgColor: "bg-[#EFF1F4]"
    },
    {
      id: "super-design",
      title: "Super design",
      description: "Request a personalized and tailor-made design.\nOur designers will make it a reality!",
      image: superDesignImg,
      bgColor: "bg-gradient-to-tr from-[#EBE2FC] to-[#FDF8FF]"
    }
  ];

  return (
    <section className="relative w-full bg-[#FFFFFF] py-16 md:py-24 overflow-hidden">
      {/* Header Container */}
      <div className="container mx-auto px-6 text-center mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionSubTitle title="Our Services" className="mb-2" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionTitle title="Not the usual uniform" className="mb-4" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionDescription 
            description="Be original, you decide how to create your custom uniforms.
You can use our Configurator or request a Super Design, the result will be exceptional!" 
            className="whitespace-pre-line max-w-2xl mx-auto text-[#565E69] leading-relaxed" 
          />
        </motion.div>
      </div>

      {/* Cards Container */}
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.8,
                delay: index * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover="hover"
              style={{ borderRadius: "24px" }}
              className={`relative flex flex-col group overflow-hidden p-8 md:p-12 pb-10 md:pb-14 transition-all duration-500 ease-out ${card.bgColor}`}
            >
              {/* Embedded dynamic light beam/glow for that premium luxury look */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45)_0%,transparent_70%)] transition-opacity duration-700 pointer-events-none" />

              {/* Card visual container for Image */}
              <div className="relative w-full aspect-4/3 flex items-center justify-center">
                {/* The main card image with refined motion floating */}
                <motion.div
                  className="w-full h-full relative"
                >
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    priority
                    quality={95}
                    className="object-contain"
                  />
                </motion.div>
              </div>

              {/* Text content inside the card container */}
              <div className="text-center mt-6 md:mt-8 relative z-10">
                <h3 className="text-2xl md:text-3xl font-semibold text-[#031E39] mb-3 group-hover:text-blue-900 transition-colors duration-300">
                  {card.title}
                </h3>
                <p className="text-[14px] md:text-[15px] text-[#565E69] leading-relaxed whitespace-pre-line max-w-sm mx-auto">
                  {card.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
