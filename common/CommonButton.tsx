 
const CommonButton = ({buttonText, className = ""}: {buttonText: string; className?: string}) => {
    return (
            <button className={`px-6 py-2 active:scale-95 transition bg-[#00263C] rounded text-white shadow-lg shadow-[#00263C]/30 font-medium ${className}`}>{buttonText}</button>
    );
};

export default CommonButton;