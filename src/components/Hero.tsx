import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Satellite, TrendingUp, Shield, Globe } from "lucide-react";
import heroImage from "@/assets/hero-satellite.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Satellite monitoring global supply chains" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
          <Satellite className="w-4 h-4 mr-2" />
          Satellite-Powered ESG Intelligence
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          SupplyChainLens
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Advanced satellite imagery and ML-powered analysis to detect deforestation, illegal mining, 
          and ESG risks in your supply chain before products reach consumers.
        </p>

        {/* Key features */}
        <div className="flex flex-wrap justify-center gap-6 mb-10">
          <div className="flex items-center gap-2 text-success">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Real-time Risk Scoring</span>
          </div>
          <div className="flex items-center gap-2 text-accent">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">ESG Compliance</span>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Globe className="w-5 h-5" />
            <span className="text-sm font-medium">Global Coverage</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero" size="lg" className="text-lg px-8">
            Start Monitoring
          </Button>
          <Button variant="satellite" size="lg" className="text-lg px-8">
            View Demo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">24/7</div>
            <div className="text-sm text-muted-foreground">Satellite Monitoring</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">99.2%</div>
            <div className="text-sm text-muted-foreground">Detection Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary">150+</div>
            <div className="text-sm text-muted-foreground">Countries Covered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning">72h</div>
            <div className="text-sm text-muted-foreground">Alert Response</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;