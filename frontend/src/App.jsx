import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Workflow from "./components/Workflow";
import InputForm from "./components/InputForm";
import Particles from "./components/Particles";
import { AnimatedTestimonialsDemo } from "./components/AnimatedTestimonials";

const App = () => {
  return (
    <>
      {/* Particles as full background */}
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1, // push it behind everything
        }}
      >
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      {/* Content */}
      <Navbar />
      <div className="max-w-7xl mx-auto pt-20 px-6 scroll-smooth">
        {/* Hero Section */}
        <div className="py-10">
          <HeroSection />
        </div>

        {/* Workflow Section */}
        <div id="workflow" className="mb-32 py-40 scroll-mt-24">
          <Workflow />
        </div>

        {/* Input Form Section */}
        <div id="inputform" className="mt-32 scroll-mt-24">
          <InputForm />
        </div>

        {/* Testimonials Section with spacing */}
        <div className="mt-32 mb-32">{/* <AnimatedTestimonialsDemo /> */}</div>
      </div>
    </>
  );
};

export default App;
