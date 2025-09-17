import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Calendar, 
  ArrowRight, 
  CheckCircle 
} from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 text-primary-foreground">
            <Rocket className="w-4 h-4 mr-2" />
            Ready to Deploy
          </Badge>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-primary-foreground">
            Transform Your Supply Chain
            <span className="block text-accent">ESG Monitoring</span>
          </h2>
          
          <p className="text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto">
            Start detecting deforestation, illegal mining, and ESG risks in real-time. 
            Join leading enterprises securing their supply chains with satellite intelligence.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              "Reduce compliance risk by 85%",
              "24/7 automated monitoring", 
              "Real-time supplier alerts"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center justify-center gap-2 text-primary-foreground/90">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button variant="default" size="lg" className="text-lg px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Demo
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card className="bg-card/10 border-primary-foreground/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold text-primary-foreground mb-2">
                  Enterprise Solutions
                </h3>
                <p className="text-primary-foreground/70 mb-4">
                  Custom ML models and dedicated infrastructure for large-scale monitoring
                </p>
                <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/10 border-primary-foreground/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold text-primary-foreground mb-2">
                  Developer API
                </h3>
                <p className="text-primary-foreground/70 mb-4">
                  Integrate satellite ESG monitoring directly into your existing systems
                </p>
                <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  View Docs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;