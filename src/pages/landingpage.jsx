import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";


export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-blue-50 to-white text-gray-800">
      {/* Transparent Navbar */}
      <header className="flex justify-between items-center px-8 py-4 bg-transparent fixed top-0 w-full z-10">
        <h1 className="text-2xl font-bold text-blue-600">Flow</h1>
        <nav className="space-x-6">
          <a href="#features" className="hover:text-blue-600 transition">Features</a>
          <a href="#about" className="hover:text-blue-600 transition">About</a>
          <a href="#contact" className="hover:text-blue-600 transition">Contact</a>
          <Button className="bg-blue-600 text-white hover:bg-blue-700 transition">Get Started</Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-8 md:px-20 py-40">
        {/* Left side text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2"
        >
          <h1 className="text-6xl md:text-7xl font-extrabold mb-8 leading-tight">
            Water <br /> Purity <span className="text-blue-600">Detection</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-lg">
            Detect . Analyze . Protect
          </p>
          <div className="space-x-4">
            <Button size="lg">Get Started</Button>
            <Button variant="outline" size="lg">Learn More</Button>
          </div>
        </motion.div>

        {/* Right side — empty for now */}
        <div className="hidden md:block md:w-1/2"></div>
      </section>
    </div>
  );
}