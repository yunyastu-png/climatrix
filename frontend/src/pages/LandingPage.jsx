import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Cloud, Droplets, Wind, Sun, Thermometer, Shield, Mic, Globe, ChevronRight, Zap } from "lucide-react";
import { Button } from "../components/ui/button";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Cloud, title: "Climate Intelligence", desc: "AI-powered predictions for drought, flood, and heat stress" },
    { icon: Droplets, title: "Water Management", desc: "Smart recommendations for sustainable water usage" },
    { icon: Wind, title: "Real-time Monitoring", desc: "Live weather data with interactive map layers" },
    { icon: Shield, title: "Risk Assessment", desc: "Explainable AI with confidence scores" },
    { icon: Mic, title: "Voice Assistant", desc: "Ask climate questions using voice commands" },
    { icon: Globe, title: "Multilingual", desc: "Available in English and Tamil" },
  ];

  const stats = [
    { value: "95%", label: "Prediction Accuracy" },
    { value: "24/7", label: "Real-time Monitoring" },
    { value: "10+", label: "Climate Indicators" },
    { value: "2", label: "Languages" },
  ];

  return (
    <div className="min-h-screen bg-[#02040A] overflow-hidden relative">
      {/* Grid Background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa')" }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#02040A] via-transparent to-[#02040A]" />
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Zap className="w-8 h-8 text-[#00FF94]" />
              <span className="text-[#00FF94] font-rajdhani text-lg tracking-widest uppercase">Climate Intelligence Platform</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-rajdhani font-bold mb-6 leading-tight">
              <span className="text-white">Transform Climate Data into</span>
              <br />
              <span className="text-glow-green text-[#00FF94]">Predictive Intelligence</span>
            </h1>
            
            <p className="text-base lg:text-lg text-[#94A3B8] max-w-2xl mx-auto mb-10">
              AI-powered environmental monitoring and sustainability decision support system. 
              Predict risks, analyze trends, and take action with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/auth")}
                className="cyber-btn text-lg px-8 py-6"
                data-testid="get-started-btn"
              >
                Get Started <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                variant="outline"
                className="cyber-btn-secondary text-lg px-8 py-6 bg-transparent border-2 border-[#00E0FF] text-[#00E0FF] hover:bg-[#00E0FF]/10"
                data-testid="explore-demo-btn"
              >
                Explore Demo
              </Button>
            </div>
          </motion.div>
          
          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="glass-card rounded-xl p-6 text-center"
              >
                <div className="text-3xl lg:text-4xl font-rajdhani font-bold text-[#00FF94] mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-[#94A3B8] uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-[#00E0FF] rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-[#00E0FF] rounded-full" />
          </div>
        </motion.div>
      </section>
      
      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-rajdhani font-bold text-white mb-4">
              Comprehensive <span className="text-[#00E0FF]">Climate Analysis</span>
            </h2>
            <p className="text-[#94A3B8] max-w-xl mx-auto">
              Everything you need to monitor, predict, and respond to climate challenges
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="glass-card rounded-xl p-6 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg bg-[#00FF94]/10 flex items-center justify-center mb-4 group-hover:bg-[#00FF94]/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-[#00FF94]" />
                </div>
                <h3 className="text-xl font-rajdhani font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#94A3B8] text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-8 lg:p-12 text-center relative overflow-hidden"
          >
            {/* Animated Border */}
            <div className="absolute inset-0 rounded-2xl animated-border" />
            
            <div className="relative z-10">
              <div className="flex justify-center gap-4 mb-6">
                <Thermometer className="w-8 h-8 text-[#FF2E2E]" />
                <Sun className="w-8 h-8 text-[#FFB800]" />
                <Droplets className="w-8 h-8 text-[#00E0FF]" />
              </div>
              
              <h2 className="text-2xl lg:text-3xl font-rajdhani font-bold text-white mb-4">
                Ready to Predict Climate Risks?
              </h2>
              <p className="text-[#94A3B8] mb-8 max-w-lg mx-auto">
                Join thousands of researchers and professionals using our platform to make data-driven environmental decisions.
              </p>
              
              <Button
                onClick={() => navigate("/auth")}
                className="cyber-btn text-lg px-10 py-6"
                data-testid="start-free-btn"
              >
                Start Free Analysis
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-[#00E0FF]/10 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00FF94]" />
            <span className="font-rajdhani font-semibold text-white">ClimateAI Hub</span>
          </div>
          <div className="text-sm text-[#94A3B8]">
            © 2024 Climate Intelligence Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
