//SectionTitle
const SectionTitle = ({ title, className = "" }: { title: string; className?: string }) => {
  return (
    <h2
      className={`text-black text-center text-[32px] sm:text-[40px] md:text-[48px] lg:text-[55px] font-semibold ${className}`}
    >
      {title}
    </h2>
  );
};

export default SectionTitle;
