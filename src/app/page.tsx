import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "@/components/Features";
import BuildSteps from "@/components/BuildSteps";
import ResumeBuilder from "@/components/ResumeBuilder";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <ResumeBuilder />
      <BuildSteps />
      <FAQ />
      <div className="mt-9 mb-9">
      <Footer />
      </div>
    </div>
  );
}
