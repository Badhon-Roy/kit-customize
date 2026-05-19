 import Footer from "@/shared/Footer";

// This is main layout page 
const MainLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow">
                {children}
            </div>
            <Footer />
        </div>
    );
};

export default MainLayout;