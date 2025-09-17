import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Cloud, 
  Cpu, 
  Globe, 
  Code2, 
  BarChart
} from "lucide-react";

const TechStack = () => {
  const techCategories = [
    {
      icon: Database,
      title: "Data Sources",
      color: "text-primary",
      items: [
        "Sentinel-2 (10-20m resolution)",
        "Landsat 8/9 (30m resolution)", 
        "Planet NICFI (high-res tropical)",
        "Global Forest Change (Hansen)",
        "DeepGlobe Land Cover"
      ]
    },
    {
      icon: Cpu,
      title: "ML Architecture", 
      color: "text-accent",
      items: [
        "U-Net / SegFormer segmentation",
        "Vision Transformers (ViT/Swin)",
        "Siamese Networks (change detection)",
        "Gradient Boosting (XGBoost)",
        "Temporal Transformers"
      ]
    },
    {
      icon: Cloud,
      title: "Processing Stack",
      color: "text-secondary", 
      items: [
        "Google Earth Engine",
        "AWS Open Data",
        "PyTorch Lightning",
        "GDAL / Rasterio",
        "PostGIS / BigQuery"
      ]
    },
    {
      icon: Globe,
      title: "Geospatial Layers",
      color: "text-forest",
      items: [
        "Protected area boundaries",
        "Mining concession maps",
        "Shipping lane data",
        "Customs/trade manifests",
        "Labor risk regions"
      ]
    },
    {
      icon: BarChart,
      title: "Risk Assessment",
      color: "text-warning",
      items: [
        "Deforestation percentage",
        "Distance to illegal activity", 
        "Emission estimates",
        "Historical compliance",
        "Temporal correlation scores"
      ]
    },
    {
      icon: Code2,
      title: "Deployment",
      color: "text-ocean",
      items: [
        "Cloud Functions (inference)",
        "Streamlit dashboards",
        "REST APIs",
        "Real-time alerts",
        "Automated reporting"
      ]
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-secondary/30 text-secondary">
            <Code2 className="w-4 h-4 mr-2" />
            Technical Implementation
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Robust <span className="text-accent">ML Pipeline</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built on proven satellite imagery processing, advanced ML architectures, 
            and enterprise-grade geospatial analysis capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {techCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card key={index} className="bg-card border-border/50 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${category.color}`} />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Implementation Timeline */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-12">Implementation Phases</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { phase: "Phase 1", title: "Data Pipeline", desc: "Satellite imagery ingestion and preprocessing" },
              { phase: "Phase 2", title: "ML Training", desc: "Model development and validation" },
              { phase: "Phase 3", title: "Integration", desc: "Supply chain data correlation" },
              { phase: "Phase 4", title: "Deployment", desc: "Production monitoring and alerts" }
            ].map((phase, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">{index + 1}</span>
                </div>
                <Badge variant="outline" className="mb-2">{phase.phase}</Badge>
                <h4 className="font-semibold mb-2">{phase.title}</h4>
                <p className="text-sm text-muted-foreground">{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechStack;