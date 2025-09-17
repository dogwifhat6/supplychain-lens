import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Satellite, 
  Brain, 
  TrendingDown, 
  MapPin, 
  AlertTriangle, 
  BarChart3,
  Trees,
  Factory,
  Ship
} from "lucide-react";
import deforestationImage from "@/assets/deforestation-detection.jpg";
import dashboardImage from "@/assets/supply-chain-dashboard.jpg";

const Features = () => {
  const features = [
    {
      icon: Satellite,
      title: "Multi-Spectral Analysis",
      description: "Sentinel-2, Landsat, and Planet imagery processed with advanced atmospheric correction and cloud masking",
      tech: "CNN/U-Net/ViT"
    },
    {
      icon: Trees,
      title: "Deforestation Detection",
      description: "Real-time forest loss monitoring using change detection algorithms and temporal analysis",
      tech: "Siamese Networks"
    },
    {
      icon: Factory,
      title: "Mining Activity Tracking",
      description: "Identify new mining operations, processing facilities, and industrial expansion patterns",
      tech: "Semantic Segmentation"
    },
    {
      icon: Brain,
      title: "ML Risk Scoring",
      description: "Gradient-boosted models fuse satellite detections with shipping data for comprehensive risk assessment",
      tech: "XGBoost/Transformers"
    },
    {
      icon: MapPin,
      title: "Geospatial Correlation",
      description: "Link detected activities to supplier concessions and shipping manifests through spatial joins",
      tech: "PostGIS/BigQuery"
    },
    {
      icon: BarChart3,
      title: "ESG Reporting",
      description: "Automated compliance reports with emission estimates and forced labor risk indicators",
      tech: "Auto-Generated"
    }
  ];

  return (
    <section className="py-24 bg-gradient-card">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-accent/30 text-accent">
            <Brain className="w-4 h-4 mr-2" />
            Advanced ML Pipeline
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            End-to-End <span className="text-primary">ESG Intelligence</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From satellite imagery ingestion to risk scoring, our comprehensive pipeline 
            delivers actionable ESG insights for procurement teams.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-8 h-8 text-primary" />
                    <Badge variant="secondary" className="text-xs">
                      {feature.tech}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Visual Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="relative">
            <img 
              src={deforestationImage} 
              alt="Deforestation detection analysis"
              className="w-full rounded-lg shadow-earth"
            />
            <div className="absolute top-4 left-4">
              <Badge className="bg-destructive/90 text-destructive-foreground">
                <AlertTriangle className="w-4 h-4 mr-2" />
                High Risk Detected
              </Badge>
            </div>
            <div className="mt-6">
              <h3 className="text-2xl font-bold mb-3">Change Detection</h3>
              <p className="text-muted-foreground">
                Temporal analysis compares multi-date imagery to identify illegal deforestation 
                activities within supplier concession boundaries.
              </p>
            </div>
          </div>

          <div className="relative">
            <img 
              src={dashboardImage} 
              alt="Supply chain monitoring dashboard"
              className="w-full rounded-lg shadow-glow"
            />
            <div className="absolute top-4 left-4">
              <Badge className="bg-success/90 text-success-foreground">
                <Ship className="w-4 h-4 mr-2" />
                Supply Chain Linked
              </Badge>
            </div>
            <div className="mt-6">
              <h3 className="text-2xl font-bold mb-3">Risk Correlation</h3>
              <p className="text-muted-foreground">
                Satellite detections are correlated with shipping manifests and customs data 
                to identify at-risk product batches before they enter your supply chain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;