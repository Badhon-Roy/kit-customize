 
const SectionSubTitle = ({ title, className = "" }: { title: string; className?: string }) => {
    return (
       <h2
      className={`text-[#565E69] text-center text-[16px] md:text-[18px] lg:text-[24px] ${className}`}
    >
      {title}
    </h2>
    );
};

export default SectionSubTitle;