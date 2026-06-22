 
const CommonButton = ({buttonText, className = ""}: {buttonText: string; className?: string}) => {
    return (
            <button className={`cursor-pointer px-6 py-3 active:scale-95 transition-all bg-[#00263C] rounded text-white shadow-lg shadow-[#00263C]/30 font-medium duration-300 ${className}`}>{buttonText}</button>
    );
};

export default CommonButton;