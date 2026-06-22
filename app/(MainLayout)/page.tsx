import Banner from "@/pages/home/banner/Banner";
import Services from "@/pages/home/services/Services";
import Products from "@/pages/home/products/Products";
import HowItWorks from "@/pages/home/how-it-works/HowItWorks";
import CTA from "@/pages/home/cta/CTA";

// Home page
const HomePage = () => {
    return (
        <main className="w-full min-h-screen">
            <Banner />
            <Services />
            <Products />
            <HowItWorks />
            <CTA />
        </main>
    );
};

export default HomePage;