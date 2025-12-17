'use client';

import { useState } from 'react';
import Image from 'next/image';
import Lightbox from '@/components/Lightbox';

// All project images organized by category
const allProjects = [
  // Kitchens
  { src: '/images/IMG_6655.jpg', alt: 'Modern kitchen with custom range hood', category: 'Kitchen' },
  { src: '/images/IMG_6648.jpg', alt: 'Built-in wine and storage cabinet', category: 'Kitchen' },
  { src: '/images/IMG_6657.jpg', alt: 'Kitchen with island seating', category: 'Kitchen' },
  { src: '/images/IMG_6684.jpg', alt: 'Open concept kitchen', category: 'Kitchen' },
  { src: '/images/IMG_6712.jpg', alt: 'Kitchen detail with lighting', category: 'Kitchen' },
  { src: '/images/IMG_6641.jpg', alt: 'Custom kitchen design', category: 'Kitchen' },
  { src: '/images/IMG_6645.jpg', alt: 'Modern kitchen cabinets', category: 'Kitchen' },
  { src: '/images/IMG_6650.jpg', alt: 'Kitchen storage solutions', category: 'Kitchen' },
  { src: '/images/IMG_6652.jpg', alt: 'Cabinet details', category: 'Kitchen' },
  { src: '/images/IMG_6659.jpg', alt: 'Kitchen workspace', category: 'Kitchen' },
  { src: '/images/IMG_6666.jpg', alt: 'Custom woodwork', category: 'Kitchen' },
  { src: '/images/IMG_6682.jpg', alt: 'Kitchen renovation', category: 'Kitchen' },
  { src: '/images/IMG_6694.jpg', alt: 'Built-in cabinetry', category: 'Kitchen' },
  { src: '/images/IMG_6703.jpg', alt: 'Kitchen island', category: 'Kitchen' },
  { src: '/images/IMG_6713.jpg', alt: 'Cabinet hardware', category: 'Kitchen' },
  { src: '/images/IMG_6718.jpg', alt: 'Modern kitchen layout', category: 'Kitchen' },
  { src: '/images/IMG_6720.jpg', alt: 'Custom storage', category: 'Kitchen' },
  { src: '/images/IMG_6723.jpg', alt: 'Kitchen finishes', category: 'Kitchen' },
  { src: '/images/IMG_6732.jpg', alt: 'Kitchen design', category: 'Kitchen' },
  { src: '/images/IMG_6802.jpg', alt: 'Kitchen remodel', category: 'Kitchen' },
  { src: '/images/IMG_6809.jpg', alt: 'Custom kitchen project', category: 'Kitchen' },
  { src: '/images/IMG_6834.jpg', alt: 'Kitchen transformation', category: 'Kitchen' },
  { src: '/images/IMG_6844.jpg', alt: 'Custom cabinetry', category: 'Kitchen' },
  { src: '/images/IMG_6849.jpg', alt: 'Modern kitchen design', category: 'Kitchen' },
  { src: '/images/IMG_6902.jpg', alt: 'Kitchen renovation project', category: 'Kitchen' },
  { src: '/images/IMG_6917.jpg', alt: 'Modern cabinetry', category: 'Kitchen' },

  // Closets
  { src: '/images/IMG_9881.jpg', alt: 'Custom closet organization', category: 'Closet' },
  { src: '/images/IMG_9872.jpg', alt: 'Custom closet shelving', category: 'Closet' },
  { src: '/images/IMG_9850.jpg', alt: 'Closet organization', category: 'Closet' },
  { src: '/images/IMG_9852.jpg', alt: 'Custom closet', category: 'Closet' },
  { src: '/images/IMG_9856.jpg', alt: 'Built-in closet system', category: 'Closet' },
  { src: '/images/IMG_9863.jpg', alt: 'Closet storage', category: 'Closet' },
  { src: '/images/IMG_9873.jpg', alt: 'Custom closet design', category: 'Closet' },
  { src: '/images/IMG_9877.jpg', alt: 'Closet organization system', category: 'Closet' },
  { src: '/images/IMG_9887.jpg', alt: 'Built-in storage', category: 'Closet' },
  { src: '/images/IMG_9892.jpg', alt: 'Custom closet work', category: 'Closet' },
  { src: '/images/IMG_9897.jpg', alt: 'Closet project', category: 'Closet' },
  { src: '/images/IMG_9898.jpg', alt: 'Storage solutions', category: 'Closet' },
  { src: '/images/IMG_9904.jpg', alt: 'Closet design', category: 'Closet' },
  { src: '/images/IMG_9909.jpg', alt: 'Built-in closet', category: 'Closet' },
  { src: '/images/IMG_9911.jpg', alt: 'Closet storage system', category: 'Closet' },
  { src: '/images/IMG_9915.jpg', alt: 'Custom closet project', category: 'Closet' },
  { src: '/images/IMG_9924.jpg', alt: 'Closet craftsmanship', category: 'Closet' },

  // Storage & Built-ins
  { src: '/images/IMG_6725.jpg', alt: 'Cabinet organization', category: 'Storage' },
  { src: '/images/IMG_6733.jpg', alt: 'Custom millwork', category: 'Storage' },
  { src: '/images/IMG_6737.jpg', alt: 'Storage detail', category: 'Storage' },
  { src: '/images/IMG_6744.jpg', alt: 'Modern woodwork', category: 'Storage' },
  { src: '/images/IMG_6763.jpg', alt: 'Cabinet craftsmanship', category: 'Storage' },
  { src: '/images/IMG_6826.jpg', alt: 'Built-in installation', category: 'Storage' },
  { src: '/images/IMG_6848.jpg', alt: 'Storage details', category: 'Storage' },
  { src: '/images/IMG_6857.jpg', alt: 'Built-in solutions', category: 'Storage' },
  { src: '/images/IMG_6861.jpg', alt: 'Storage project', category: 'Storage' },
  { src: '/images/IMG_6871.jpg', alt: 'Cabinet work', category: 'Storage' },
  { src: '/images/IMG_6897.jpg', alt: 'Custom storage', category: 'Storage' },

  // Bathroom
  { src: '/images/IMG_6692.jpg', alt: 'Bathroom vanity', category: 'Bathroom' },
  { src: '/images/IMG_6708.jpg', alt: 'Custom vanity cabinets', category: 'Bathroom' },
  { src: '/images/IMG_6446-2.jpg', alt: 'Bathroom pantry area', category: 'Bathroom' },
  { src: '/images/IMG_6441-2.jpg', alt: 'Built-in cabinet', category: 'Bathroom' },
];

const categories = ['All', 'Kitchen', 'Closet', 'Storage', 'Bathroom', 'Living Room', 'Laundry', 'Office', 'Entertainment'];

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredProjects =
    activeCategory === 'All'
      ? allProjects
      : allProjects.filter((p) => p.category === activeCategory);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = () => {
    if (lightboxIndex !== null && lightboxIndex < filteredProjects.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };
  const prevImage = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center">
        <Image
          src="/images/IMG_6655.jpg"
          alt="Custom kitchen cabinets"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 gradient-overlay-strong" />
        <div className="relative z-10 text-center text-white">
          <p className="section-subtitle text-white/80 mb-3">Our Portfolio</p>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-light"
            style={{ fontFamily: 'var(--font-playfair), serif' }}
          >
            Project Gallery
          </h1>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-[72px] z-30 bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-[#c4a35a] text-white'
                    : 'bg-[#f5f3ef] text-[#3d3d3d] hover:bg-[#c4a35a]/20'
                }`}
              >
                {category}
                {category !== 'All' && (
                  <span className="ml-1 text-xs opacity-70">
                    ({allProjects.filter((p) => p.category === category).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="section-padding bg-[#f5f3ef]">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-[#6b6b6b] mb-8">
            Showing {filteredProjects.length} projects
            {activeCategory !== 'All' && ` in ${activeCategory}`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((project, index) => (
              <div
                key={index}
                className="group relative aspect-[4/3] image-hover rounded-lg cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={project.src}
                  alt={project.alt}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </div>
                </div>
                {/* Category tag */}
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 backdrop-blur-sm text-[#3d3d3d] text-xs font-medium px-3 py-1 rounded-full">
                    {project.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-[#3d3d3d] text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-3xl md:text-4xl font-light mb-6"
            style={{ fontFamily: 'var(--font-playfair), serif' }}
          >
            Like What You See?
          </h2>
          <p className="text-gray-400 mb-8">
            Let&apos;s discuss your project. Contact Steve today to get started.
          </p>
          <a href="/contact" className="btn-primary">
            Start Your Project
          </a>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          image={filteredProjects[lightboxIndex].src}
          alt={filteredProjects[lightboxIndex].alt}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < filteredProjects.length - 1}
        />
      )}
    </>
  );
}
