import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Steve | Bazen Woodworking',
  description: 'Meet Steve Bazen - 20+ years of custom cabinet making experience in Corsica, South Dakota.',
};

const workshopImages = [
  { src: '/images/IMG_5945.jpg', alt: 'Woodworking shop' },
  { src: '/images/IMG_5952.jpg', alt: 'Steve working' },
  { src: '/images/IMG_5953.jpg', alt: 'Workshop tools' },
  { src: '/images/IMG_5957.jpg', alt: 'Cabinet construction' },
  { src: '/images/IMG_5966.jpg', alt: 'Workshop overview' },
  { src: '/images/IMG_5975.jpg', alt: 'Cabinet pieces' },
];

const values = [
  {
    title: 'Quality Craftsmanship',
    description: 'Every piece is built to last with premium materials and time-tested techniques.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Personal Service',
    description: 'Work directly with Steve from design to installation. No middlemen, no miscommunication.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: 'Local Expertise',
    description: 'Proudly serving South Dakota families. We understand local styles and building conditions.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Attention to Detail',
    description: 'Every joint, every finish, every measurement—nothing is overlooked in delivering perfection.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
];

export default function About() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[450px] flex items-center justify-center">
        <Image
          src="/images/IMG_5956.jpg"
          alt="Bazen Woodworking workshop"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 gradient-overlay-strong" />
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <p className="section-subtitle text-white/80 mb-3">Our Story</p>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-light mb-4"
            style={{ fontFamily: 'var(--font-playfair), serif' }}
          >
            20+ Years of Craftsmanship
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Building beautiful, functional spaces for South Dakota families
          </p>
        </div>
      </section>

      {/* Meet Steve Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div className="relative aspect-[3/4] max-w-lg mx-auto">
                <Image
                  src="/images/IMG_5992.jpg"
                  alt="Steve Bazen - Owner of Bazen Woodworking"
                  fill
                  className="object-cover rounded-lg shadow-xl"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <p className="section-subtitle">Meet the Craftsman</p>
              <h2 className="section-title">Steve Bazen</h2>
              <p className="text-lg text-[#c4a35a] mb-6">Owner & Master Craftsman</p>

              <div className="text-[#6b6b6b] space-y-5 leading-relaxed">
                <p>
                  Steve Bazen isn&apos;t just a cabinet maker—he&apos;s a craftsman with a genuine passion
                  for woodworking that shows in every project he touches. With over two decades
                  of hands-on experience, Steve has built a reputation throughout South Dakota
                  for quality work and honest service.
                </p>
                <p>
                  What started as a young man&apos;s fascination with building things has grown into
                  Bazen Woodworking LLC, a business built on the simple principles of quality
                  craftsmanship, fair pricing, and treating every customer like a neighbor.
                </p>
                <p>
                  When you work with Bazen Woodworking, you work directly with Steve. From the
                  first conversation about your project to the final installation, Steve is there
                  every step of the way. No salespeople, no project managers—just a skilled
                  craftsman dedicated to getting your project right.
                </p>
              </div>

              <div className="mt-10 flex flex-wrap gap-8">
                <div>
                  <p className="text-4xl font-bold text-[#c4a35a]" style={{ fontFamily: 'var(--font-playfair), serif' }}>20+</p>
                  <p className="text-sm text-[#6b6b6b]">Years Experience</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#c4a35a]" style={{ fontFamily: 'var(--font-playfair), serif' }}>150+</p>
                  <p className="text-sm text-[#6b6b6b]">Projects Completed</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#c4a35a]" style={{ fontFamily: 'var(--font-playfair), serif' }}>100%</p>
                  <p className="text-sm text-[#6b6b6b]">Satisfaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-[#f5f3ef]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="section-subtitle">Why Choose Us</p>
            <h2 className="section-title">What Sets Us Apart</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-sm">
                <div className="text-[#c4a35a] mb-4">{value.icon}</div>
                <h3 className="text-lg font-semibold text-[#3d3d3d] mb-3">{value.title}</h3>
                <p className="text-[#6b6b6b] text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop Gallery */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="section-subtitle">Behind the Scenes</p>
            <h2 className="section-title">The Workshop</h2>
            <p className="text-[#6b6b6b] mt-4">
              Every cabinet, every shelf, every piece of custom woodwork is crafted right here
              in our Corsica, South Dakota workshop.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {workshopImages.map((image, index) => (
              <div key={index} className="relative aspect-square image-hover rounded-lg overflow-hidden">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6">
        <Image
          src="/images/IMG_9853.jpg"
          alt="Custom kitchen"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#3d3d3d]/85" />
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-light mb-6"
            style={{ fontFamily: 'var(--font-playfair), serif' }}
          >
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Get in touch with Steve to discuss your custom cabinet or woodworking project.
            Let&apos;s bring your vision to life.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="btn-primary">
              Contact Steve
            </Link>
            <Link href="/gallery" className="btn-outline-white">
              View Our Work
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
