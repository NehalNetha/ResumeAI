"use client"
import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

type FAQItemProps = {
  question: string;
  answer: string;
  isOpen: boolean;
  toggleOpen: () => void;
};

const FAQItem = ({ question, answer, isOpen, toggleOpen }: FAQItemProps) => {
  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      <button
        className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
        onClick={toggleOpen}
      >
        <h3 className="text-base font-medium">{question}</h3>
        <div className="text-blue-600">
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </div>
      </button>
      
      {isOpen && (
        <div className="p-4 pt-0 text-gray-600 border-t border-gray-100">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number>(0);

  const faqItems = [
    {
      question: "Can I edit my resume after downloading?",
      answer: "Yes! Once you download your resume, you can edit it anytime using your preferred document editor. You can also come back to our platform to make adjustments and generate a new version."
    },
    {
      question: "How does AI improve my resume?",
      answer: "Our AI analyzes your experience and skills to suggest improvements, optimize for ATS systems, and highlight your strengths. It helps with phrasing, formatting, and ensuring your resume stands out to recruiters."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We take data security seriously and use industry-standard encryption to protect your information. Your data is never shared with third parties without your consent, and you can request deletion at any time."
    },
    {
      question: "What file formats can I download my resume in?",
      answer: "We offer multiple download formats including PDF, DOCX (Microsoft Word), and plain text. PDF is recommended for maintaining formatting across all devices and platforms."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(index === openIndex ? -1 : index);
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="md:w-1/3">
            <div className="sticky top-24">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.09 9C9.09 9.26522 9.19536 9.51957 9.38289 9.70711C9.57043 9.89464 9.82478 10 10.09 10C10.3552 10 10.6096 9.89464 10.7971 9.70711C10.9847 9.51957 11.09 9.26522 11.09 9C11.09 8.73478 10.9847 8.48043 10.7971 8.29289C10.6096 8.10536 10.3552 8 10.09 8C9.82478 8 9.57043 8.10536 9.38289 8.29289C9.19536 8.48043 9.09 8.73478 9.09 9ZM9.09 9V13C9.09 13.2652 9.19536 13.5196 9.38289 13.7071C9.57043 13.8946 9.82478 14 10.09 14H10.1H10.11M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                FAQs
              </div>
              <h2 className="text-3xl font-bold mb-4">Answers to Your Most Common Resume Questions</h2>
              <p className="text-gray-600 mb-6">Get clarity on how our AI resume builder works.</p>
              <a 
                href="/faq" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View all FAQs
              </a>
            </div>
          </div>
          
          <div className="md:w-2/3">
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <FAQItem
                  key={index}
                  question={item.question}
                  answer={item.answer}
                  isOpen={index === openIndex}
                  toggleOpen={() => toggleFAQ(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;