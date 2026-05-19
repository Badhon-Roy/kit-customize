"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import SectionSubTitle from "@/common/SectionSubTitle";
import SectionTitle from "@/common/SectionTitle";
import CommonButton from "@/common/CommonButton";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

// Import local assets
import jersey1 from "@/assets/images/jersey-1.png";
import jersey2 from "@/assets/images/jersery-2.png";

import jersey3 from "@/assets/images/jersey-3.png";
import jersey4 from "@/assets/images/jersey-4.png";
import jersey5 from "@/assets/images/jersey-5.png";

const Products = () => {
  const products = [
    { id: 1, src: jersey5, name: "Gold Accents Black Jersey" },
    { id: 2, src: jersey4, name: "Lion Print White Polo" },
    { id: 3, src: jersey3, name: "Wave Style Black Polo" },
    { id: 4, src: jersey5, name: "Sleek Yellow Stripe Polo" },
    { id: 5, src: jersey1, name: "Purple Gradient Polo" },
    { id: 6, src: jersey2, name: "Neon Lightning Black Jersey" },
    { id: 7, src: jersey5, name: "Gold Accents Black Jersey Alternate" },
  ];

  return (
    <section className="relative w-full bg-[#ECF0F6] py-16 overflow-hidden">
      {/* Header Container */}
      <div className=" mx-auto px-6 text-center mb-10 md:mb-14">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionSubTitle title="Products" className="mb-2 text-[#565E69]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionTitle
            title="One T-Shirt, infinite possibilities"
            className="text-[#031E39]"
          />
        </motion.div>
      </div>

      {/* Swiper Slider Container */}
      <div className="w-full mb-10 md:mb-12">
        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={24}
          slidesPerView={1.5}
          centeredSlides={false}
          loop={true}
          autoplay={{
            delay: 4500,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            el: ".custom-swiper-pagination",
          }}
          breakpoints={{
            480: {
              slidesPerView: 2.2,
              spaceBetween: 24,
            },
            768: {
              slidesPerView: 3.5,
              spaceBetween: 28,
            },
            1024: {
              slidesPerView: 4.8,
              spaceBetween: 32,
            },
            1440: {
              slidesPerView: 5.5,
              spaceBetween: 36,
            },
          }}
          className="products-swiper !pb-8"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id} className="h-auto">
              <div
                style={{ borderRadius: "24px" }}
                className="relative flex flex-col items-center justify-center p-6 md:p-8 aspect-[3/4] transition-all duration-300 bg-transparent border border-transparent hover:bg-[#DDE2EB] hover:border-[#BFC8D7] hover:shadow-sm cursor-pointer group"
              >
                {/* 3D Oval Floating Shadow (Stays grounded, shrinks and blurs on hover) */}
                <svg
                  className="absolute bottom-[20%] left-1/2 -translate-x-1/2 transition-all duration-500 pointer-events-none group-hover:scale-75 group-hover:opacity-75 origin-center"
                  width="150"
                  height="13"
                  viewBox="0 0 150 13"
                  style={{ overflow: "visible" }}
                >
                  <defs>
                    <filter
                      id={`shadow-only-${product.id}`}
                      x="-100%"
                      y="-100%"
                      width="300%"
                      height="800%"
                    >
                      <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                      <feOffset dx="-4" dy="50" result="offsetblur" />
                      <feFlood floodColor="black" floodOpacity="0.25" />
                      <feComposite in2="offsetblur" operator="in" />
                    </filter>
                  </defs>
                  <ellipse
                    cx="75"
                    cy="6.5"
                    rx="75"
                    ry="6.5"
                    fill="black"
                    filter={`url(#shadow-only-${product.id})`}
                  />
                </svg>

                {/* The main jersey container that floats UP on hover */}
                <motion.div
                  whileHover={{ y: -12 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="relative w-full flex items-center justify-center z-10"
                >
                  <Image
                    src={product.src}
                    alt={product.name}
                    width={280}
                    height={280}
                    priority={product.id < 4}
                    quality={95}
                    className="object-contain w-[72%] md:w-[78%] h-auto max-w-[240px]"
                  />
                </motion.div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Styled Swiper Pagination Dots */}
      <div className="flex justify-center mb-10 md:mb-12">
        <div className="custom-swiper-pagination flex items-center gap-2" />
      </div>

      {/* "See More" Button */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <CommonButton
            buttonText="See More"
            className="px-8 py-3.5 bg-[#031E39] hover:bg-[#09355E] transition-colors shadow-md text-sm md:text-base"
          />
        </motion.div>
      </div>

      {/* Custom Styles for Swiper Pagination Bullet Points */}
      <style jsx global>{`
        .custom-swiper-pagination {
          position: relative !important;
          bottom: auto !important;
          left: auto !important;
          width: auto !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 8px !important;
        }
        .custom-swiper-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #b0bccb;
          opacity: 0.6;
          border-radius: 50%;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .custom-swiper-pagination .swiper-pagination-bullet-active {
          background: #031e39;
          opacity: 1;
          width: 8px;
          height: 8px;
        }
      `}</style>
    </section>
  );
};

export default Products;
