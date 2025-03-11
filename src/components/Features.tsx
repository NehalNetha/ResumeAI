
import React from 'react';
import { Brain, Sparkles, Clock, Shield } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Resume Builder",
      description: "Our AI analyzes your skills and experience to create the perfect resume that matches job requirements."
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Professional Templates",
      description: "Choose from dozens of professionally designed templates that catch the eye of recruiters."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Quick & Easy Process",
      description: "Create a professionally formatted resume in minutes, not hours. Our intuitive interface makes it simple."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "ATS-Friendly",
      description: "All our templates are tested with Applicant Tracking Systems to ensure your resume gets past the first scan."
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Why Choose Our AI Resume Builder?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Tools built to ensure you stand out and get noticed.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;